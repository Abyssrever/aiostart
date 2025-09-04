/**
 * 知识库服务
 * 提供知识库管理和检索功能
 */

import { createClient } from '@supabase/supabase-js'
import { AIServiceManager } from './ai-service-manager'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 搜索结果接口
export interface SearchResult {
  id: string
  title: string
  content: string
  document_type: string
  organization_id?: string
  project_id?: string
  user_id?: string
  similarity?: number
  metadata?: any
  created_at: string
}

// 搜索选项接口
export interface SearchOptions {
  maxResults?: number
  threshold?: number
  searchType?: 'vector' | 'text' | 'hybrid'
  documentType?: string
  projectId?: string
  organizationId?: string
}

// 知识库统计接口
export interface KnowledgeStats {
  totalDocuments: number
  recentDocuments: number
  qaDocuments: number
  manualDocuments: number
  tutorialDocuments: number
  topContributors: Array<{
    userId: string
    userName?: string
    documentCount: number
  }>
}

export class KnowledgeService {
  private static instance: KnowledgeService
  private aiManager: AIServiceManager

  private constructor() {
    this.aiManager = AIServiceManager.getInstance()
  }

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService()
    }
    return KnowledgeService.instance
  }

  /**
   * 搜索知识库内容
   */
  async searchKnowledge(
    query: string,
    userId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      threshold = 0.7,
      searchType = 'hybrid',
      documentType,
      projectId,
      organizationId
    } = options

    try {
      // 优先尝试使用n8n向量搜索工作流
      if (searchType === 'vector' || searchType === 'hybrid') {
        try {
          const searchFilters = {
            user_id: userId,
            project_id: projectId || null,
            organization_id: organizationId || null,
            document_type: documentType || null,
            max_results: maxResults,
            threshold: threshold
          }

          const aiResponse = await this.aiManager.searchKnowledge(query, searchFilters)
          
          if (aiResponse.content) {
            let searchResults
            try {
              searchResults = typeof aiResponse.content === 'string' 
                ? JSON.parse(aiResponse.content) 
                : aiResponse.content
            } catch (error) {
              console.warn('N8N返回格式解析失败，使用备用搜索')
              throw new Error('N8N response parsing failed')
            }

            const results = searchResults.results || searchResults
            if (Array.isArray(results)) {
              console.log(`✅ N8N向量搜索成功，返回 ${results.length} 条结果`)
              return results.map(this.formatSearchResult)
            }
          }
        } catch (error) {
          console.warn('N8N向量搜索失败，fallback到数据库搜索:', error)
        }
      }

      // 备用数据库搜索
      return await this.fallbackDatabaseSearch(query, userId, options)

    } catch (error) {
      console.error('知识库搜索失败:', error)
      throw new Error('知识库搜索失败')
    }
  }

  /**
   * 备用数据库搜索
   */
  private async fallbackDatabaseSearch(
    query: string,
    userId: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const {
      maxResults = 10,
      documentType,
      projectId,
      organizationId,
      searchType = 'text'
    } = options

    // 构建基础查询
    let queryBuilder = supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        document_type,
        organization_id,
        project_id,
        user_id,
        metadata,
        created_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(maxResults)

    // 应用搜索条件
    if (searchType === 'text') {
      // 使用PostgreSQL全文搜索
      queryBuilder = queryBuilder.textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
    } else {
      // 简单的文本匹配
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    }

    // 应用过滤条件
    if (projectId) {
      queryBuilder = queryBuilder.eq('project_id', projectId)
    } else if (organizationId) {
      queryBuilder = queryBuilder.eq('organization_id', organizationId)
    } else {
      // 默认搜索用户有权访问的文档
      queryBuilder = queryBuilder.or(`user_id.eq.${userId}`)
    }

    if (documentType) {
      queryBuilder = queryBuilder.eq('document_type', documentType)
    }

    const { data: documents, error } = await queryBuilder

    if (error) {
      console.error('数据库搜索失败:', error)
      throw new Error('数据库搜索失败')
    }

    console.log(`✅ 数据库搜索完成，返回 ${documents?.length || 0} 条结果`)
    return (documents || []).map(this.formatSearchResult)
  }

  /**
   * 格式化搜索结果
   */
  private formatSearchResult(doc: any): SearchResult {
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      document_type: doc.document_type,
      organization_id: doc.organization_id,
      project_id: doc.project_id,
      user_id: doc.user_id,
      similarity: doc.similarity || 0,
      metadata: doc.metadata || {},
      created_at: doc.created_at
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeStats(
    userId: string,
    projectId?: string,
    organizationId?: string
  ): Promise<KnowledgeStats> {
    try {
      // 构建统计查询
      let baseFilter = 'status.eq.active'
      
      if (projectId) {
        baseFilter += `,project_id.eq.${projectId}`
      } else if (organizationId) {
        baseFilter += `,organization_id.eq.${organizationId}`
      } else {
        baseFilter += `,user_id.eq.${userId}`
      }

      // 获取文档统计
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, document_type, user_id, created_at')
        .filter(baseFilter.split(',')[0], 'eq', 'active')

      if (error) {
        console.error('获取知识库统计失败:', error)
        throw new Error('获取统计信息失败')
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // 计算统计信息
      const stats: KnowledgeStats = {
        totalDocuments: documents?.length || 0,
        recentDocuments: documents?.filter(d => new Date(d.created_at) > weekAgo).length || 0,
        qaDocuments: documents?.filter(d => d.document_type === 'auto_qa').length || 0,
        manualDocuments: documents?.filter(d => d.document_type === 'manual').length || 0,
        tutorialDocuments: documents?.filter(d => d.document_type === 'tutorial').length || 0,
        topContributors: this.calculateTopContributors(documents || [])
      }

      return stats

    } catch (error) {
      console.error('获取知识库统计失败:', error)
      throw new Error('获取统计信息失败')
    }
  }

  /**
   * 计算顶级贡献者
   */
  private calculateTopContributors(documents: any[]): Array<{userId: string, documentCount: number}> {
    const contributorMap = new Map<string, number>()
    
    documents.forEach(doc => {
      if (doc.user_id) {
        contributorMap.set(doc.user_id, (contributorMap.get(doc.user_id) || 0) + 1)
      }
    })

    return Array.from(contributorMap.entries())
      .map(([userId, count]) => ({ userId, documentCount: count }))
      .sort((a, b) => b.documentCount - a.documentCount)
      .slice(0, 5)
  }

  /**
   * 添加文档到知识库
   */
  async addDocument(
    title: string,
    content: string,
    userId: string,
    options: {
      documentType?: string
      projectId?: string
      organizationId?: string
      metadata?: any
    } = {}
  ): Promise<string> {
    const {
      documentType = 'manual',
      projectId,
      organizationId,
      metadata = {}
    } = options

    try {
      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          title,
          content,
          document_type: documentType,
          user_id: userId,
          project_id: projectId || null,
          organization_id: organizationId || null,
          metadata,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('添加文档失败:', error)
        throw new Error('添加文档失败')
      }

      console.log('✅ 文档添加成功:', document.id)
      return document.id

    } catch (error) {
      console.error('添加文档异常:', error)
      throw new Error('添加文档失败')
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      // 验证用户权限
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('id, user_id')
        .eq('id', documentId)
        .eq('status', 'active')
        .single()

      if (fetchError || !document) {
        throw new Error('文档不存在')
      }

      if (document.user_id !== userId) {
        throw new Error('无权删除此文档')
      }

      // 软删除（更新状态为deleted）
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) {
        console.error('删除文档失败:', error)
        throw new Error('删除文档失败')
      }

      console.log('✅ 文档删除成功:', documentId)
      return true

    } catch (error) {
      console.error('删除文档异常:', error)
      throw error
    }
  }

  /**
   * 获取文档详情
   */
  async getDocument(documentId: string, userId: string): Promise<SearchResult | null> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          content,
          document_type,
          organization_id,
          project_id,
          user_id,
          metadata,
          created_at,
          updated_at
        `)
        .eq('id', documentId)
        .eq('status', 'active')
        .single()

      if (error || !document) {
        return null
      }

      // 验证访问权限（简化版）
      if (document.user_id !== userId) {
        // TODO: 检查项目/组织权限
        return null
      }

      return this.formatSearchResult(document)

    } catch (error) {
      console.error('获取文档详情失败:', error)
      return null
    }
  }

  /**
   * 更新文档
   */
  async updateDocument(
    documentId: string,
    userId: string,
    updates: {
      title?: string
      content?: string
      metadata?: any
    }
  ): Promise<boolean> {
    try {
      // 验证权限
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('id, user_id')
        .eq('id', documentId)
        .eq('status', 'active')
        .single()

      if (fetchError || !document || document.user_id !== userId) {
        throw new Error('无权修改此文档')
      }

      // 更新文档
      const { error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)

      if (error) {
        console.error('更新文档失败:', error)
        throw new Error('更新文档失败')
      }

      console.log('✅ 文档更新成功:', documentId)
      return true

    } catch (error) {
      console.error('更新文档异常:', error)
      throw error
    }
  }
}