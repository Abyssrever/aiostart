/**
 * 增强版AI聊天服务
 * 集成n8n工作流和知识库功能
 */

import { createClient } from '@supabase/supabase-js'
import { AIServiceManager } from './ai-service-manager'
import { KnowledgeService } from './knowledge-service'
import { aiCache } from './ai-cache'

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

// 聊天请求接口
export interface ChatRequest {
  message: string
  userId: string
  sessionId?: string
  sessionType?: string
  projectId?: string
  organizationId?: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  userProfile?: any
}

// 聊天响应接口
export interface ChatResponse {
  success: boolean
  content: string
  conversationId?: string
  knowledgeContext?: any
  suggestions?: string[]
  okrResult?: any
  tokensUsed?: number
  responseTime?: number
  cached?: boolean
  error?: string
}

export class EnhancedChatService {
  private static instance: EnhancedChatService
  private aiManager: AIServiceManager
  private knowledgeService: KnowledgeService

  private constructor() {
    this.aiManager = AIServiceManager.getInstance()
    this.knowledgeService = KnowledgeService.getInstance()
  }

  public static getInstance(): EnhancedChatService {
    if (!EnhancedChatService.instance) {
      EnhancedChatService.instance = new EnhancedChatService()
    }
    return EnhancedChatService.instance
  }

  /**
   * 处理聊天请求（主要入口）
   */
  async processChatRequest(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 增强版AI聊天服务启动')
      console.log('📤 收到请求:', {
        message: request.message.substring(0, 100) + '...',
        userId: request.userId,
        sessionType: request.sessionType,
        projectId: request.projectId
      })

      // 1. 分析对话上下文和用户意图
      const conversationContext = this.analyzeConversationContext(
        request.message, 
        request.conversationHistory || []
      )

      // 2. 检查OKR相关意图
      const okrIntent = await this.analyzeOKRIntent(
        request.message, 
        request.userId, 
        conversationContext
      )

      // 3. 检查缓存（OKR相关消息不缓存）
      const cacheKey = this.generateCacheKey(request)
      const cachedResponse = !okrIntent.isOKRRelated ? aiCache.get(cacheKey, request.sessionType) : null
      
      if (cachedResponse) {
        console.log('💾 返回缓存响应')
        return {
          success: true,
          content: cachedResponse,
          cached: true,
          tokensUsed: 0,
          responseTime: Date.now() - startTime
        }
      }

      // 4. 搜索相关知识库内容
      const knowledgeContext = await this.searchRelevantKnowledge(request)

      // 5. 生成智能建议
      const smartSuggestions = await this.generateSmartSuggestions(
        request.message, 
        request.userId, 
        knowledgeContext
      )

      // 6. 处理OKR操作（如果相关）
      let okrResult = null
      if (okrIntent.isOKRRelated) {
        okrResult = await this.handleOKROperation(
          request.message, 
          request.userId, 
          okrIntent
        )
      }

      // 7. 构建增强的AI请求
      const enhancedRequest = this.buildEnhancedAIRequest(
        request,
        conversationContext,
        knowledgeContext,
        smartSuggestions,
        okrResult
      )

      // 8. 调用n8n聊天工作流
      console.log('🤖 调用n8n聊天工作流')
      const aiResponse = await this.aiManager.sendAIRequest(enhancedRequest)

      if (!aiResponse.success) {
        throw new Error(aiResponse.error || 'AI响应失败')
      }

      // 9. 保存聊天记录到数据库
      const conversationId = await this.saveChatHistory(request, aiResponse.content, okrResult)

      // 10. 缓存响应（非OKR相关）
      if (!okrIntent.isOKRRelated && aiResponse.content) {
        aiCache.set(cacheKey, aiResponse.content, request.sessionType)
      }

      console.log('✅ 增强版AI聊天处理完成')

      return {
        success: true,
        content: aiResponse.content,
        conversationId: conversationId || undefined,
        knowledgeContext: {
          hasResults: knowledgeContext.hasResults,
          resultsCount: knowledgeContext.results?.length || 0
        },
        suggestions: smartSuggestions.suggestions,
        okrResult,
        tokensUsed: aiResponse.tokensUsed || 0,
        responseTime: Date.now() - startTime,
        cached: false
      }

    } catch (error) {
      console.error('❌ 增强版AI聊天服务错误:', error)
      
      return {
        success: false,
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        error: error instanceof Error ? error.message : '未知错误',
        responseTime: Date.now() - startTime
      }
    }
  }

  /**
   * 分析对话上下文
   */
  private analyzeConversationContext(message: string, conversationHistory: any[]) {
    const recentMessages = conversationHistory.slice(-5)
    
    const topics: string[] = []
    const keywords: string[] = []
    
    recentMessages.forEach(msg => {
      const content = msg.content?.toLowerCase() || ''
      
      if (content.includes('okr') || content.includes('目标')) topics.push('目标管理')
      if (content.includes('学习') || content.includes('教程')) topics.push('学习')
      if (content.includes('项目') || content.includes('开发')) topics.push('项目开发')
      if (content.includes('算法') || content.includes('编程')) topics.push('编程技术')
      
      const words = content.split(/\s+/).filter((w: string) => w.length > 2)
      keywords.push(...words.slice(0, 3))
    })
    
    const currentLower = message.toLowerCase()
    const isFollowUp = topics.some(topic => {
      const topicWords = topic.split('').slice(0, 2)
      return topicWords.some(word => currentLower.includes(word))
    })
    
    const isProgressUpdate = recentMessages.some(msg => 
      (msg.content?.includes('创建') || msg.content?.includes('目标')) &&
      (currentLower.includes('完成') || currentLower.includes('进度'))
    )
    
    return {
      recentTopics: [...new Set(topics)],
      keywords: [...new Set(keywords)].slice(0, 10),
      isFollowUp,
      isProgressUpdate,
      conversationLength: conversationHistory.length,
      hasContext: conversationHistory.length > 0
    }
  }

  /**
   * 搜索相关知识库内容
   */
  private async searchRelevantKnowledge(request: ChatRequest) {
    try {
      const searchOptions = {
        maxResults: 5,
        threshold: 0.6,
        searchType: 'hybrid' as const,
        projectId: request.projectId,
        organizationId: request.organizationId
      }

      const results = await this.knowledgeService.searchKnowledge(
        request.message,
        request.userId,
        searchOptions
      )

      console.log(`🔍 知识库搜索完成，找到 ${results.length} 条相关内容`)

      return {
        hasResults: results.length > 0,
        results: results.slice(0, 3), // 限制返回数量避免prompt过长
        totalCount: results.length
      }

    } catch (error) {
      console.error('知识库搜索失败:', error)
      return { hasResults: false, results: [], totalCount: 0 }
    }
  }

  /**
   * 分析OKR意图
   */
  private async analyzeOKRIntent(message: string, userId: string, context: any) {
    const lowerMessage = message.toLowerCase()
    
    const okrKeywords = [
      '目标', 'okr', 'OKR', '计划', '学习计划',
      '创建', '制定', '设定', '建立',
      '完成', '达成', '进度', '更新', '汇报', '提交',
      '查看', '状态', '进展', '怎么样', '如何',
      '建议', '推荐', '改进', '优化'
    ]
    
    let isOKRRelated = okrKeywords.some(keyword => lowerMessage.includes(keyword))
    
    if (!isOKRRelated && context?.hasContext) {
      if (context.recentTopics.includes('目标管理') && context.isProgressUpdate) {
        isOKRRelated = true
      }
    }
    
    if (!isOKRRelated) {
      return { isOKRRelated: false }
    }
    
    // 分析具体意图
    const createKeywords = ['创建', '制定', '设定', '建立', '目标', 'okr', '学习计划', '计划']
    const updateKeywords = ['完成', '达成', '进度', '更新', '汇报', '提交']
    const queryKeywords = ['查看', '状态', '进展', '怎么样', '如何']
    const suggestKeywords = ['建议', '推荐', '如何', '怎样', '改进', '优化']
    
    const createScore = createKeywords.filter(k => lowerMessage.includes(k)).length
    let updateScore = updateKeywords.filter(k => lowerMessage.includes(k)).length
    let queryScore = queryKeywords.filter(k => lowerMessage.includes(k)).length
    const suggestScore = suggestKeywords.filter(k => lowerMessage.includes(k)).length
    
    if (context?.isProgressUpdate) updateScore += 2
    if (context?.recentTopics.includes('目标管理')) queryScore += 1
    
    const maxScore = Math.max(createScore, updateScore, queryScore, suggestScore)
    
    let action = 'suggest'
    let confidence = 0
    
    if (updateScore === maxScore) {
      action = 'update'
      confidence = Math.min(updateScore * 0.25 + (context?.isProgressUpdate ? 0.3 : 0), 0.95)
    } else if (createScore === maxScore) {
      action = 'create'
      confidence = Math.min(createScore * 0.3, 0.9)
    } else if (queryScore === maxScore) {
      action = 'query'
      confidence = Math.min(queryScore * 0.3 + (context?.hasContext ? 0.1 : 0), 0.9)
    } else {
      action = 'suggest'
      confidence = Math.min(suggestScore * 0.3, 0.9)
    }
    
    return {
      isOKRRelated: true,
      action,
      confidence,
      originalMessage: message
    }
  }

  /**
   * 处理OKR操作
   */
  private async handleOKROperation(message: string, userId: string, intent: any) {
    // 这里可以调用现有的OKR处理逻辑
    // 或者调用专门的n8n OKR工作流
    try {
      console.log('🎯 处理OKR操作:', intent.action)
      
      // 根据意图调用相应的OKR API
      const okrApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/okr`
      const response = await fetch(okrApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: intent.action,
          message,
          userId,
          confidence: intent.confidence
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ OKR操作完成:', result)
        return result
      }

      throw new Error(`OKR API调用失败: ${response.status}`)

    } catch (error) {
      console.error('OKR操作失败:', error)
      return {
        success: false,
        message: '抱歉，OKR操作暂时无法完成，请稍后重试',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 生成智能建议
   */
  private async generateSmartSuggestions(message: string, userId: string, knowledgeContext: any) {
    try {
      const suggestions: string[] = []
      const lowerMessage = message.toLowerCase()
      
      // 基于知识库内容的建议
      if (knowledgeContext.hasResults) {
        knowledgeContext.results.forEach((item: any) => {
          if (item.document_type === 'tutorial') {
            suggestions.push(`相关教程：${item.title}，建议深入学习`)
          }
          if (item.document_type === 'auto_qa') {
            suggestions.push(`相关Q&A：${item.title}，可参考解决方案`)
          }
        })
      }
      
      // 基于消息内容的通用建议
      if (lowerMessage.includes('学习') && !lowerMessage.includes('方法')) {
        suggestions.push('建议制定具体的学习OKR来追踪进度')
      }
      
      if (lowerMessage.includes('项目')) {
        suggestions.push('建议将项目经验加入知识库分享')
      }

      if (lowerMessage.includes('算法') || lowerMessage.includes('编程')) {
        suggestions.push('建议每天练习相关算法题并记录学习心得')
      }
      
      // 去重并限制数量
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 4)
      
      return {
        hasSuggestions: uniqueSuggestions.length > 0,
        suggestions: uniqueSuggestions,
        count: uniqueSuggestions.length
      }
      
    } catch (error) {
      console.error('生成智能建议失败:', error)
      return { hasSuggestions: false, suggestions: [], count: 0 }
    }
  }

  /**
   * 构建增强的AI请求
   */
  private buildEnhancedAIRequest(
    request: ChatRequest,
    conversationContext: any,
    knowledgeContext: any,
    smartSuggestions: any,
    okrResult: any
  ) {
    let enhancedMessage = request.message

    // 如果有OKR操作结果，增强消息
    if (okrResult) {
      enhancedMessage = `用户消息: ${request.message}

OKR操作结果: ${okrResult.success ? '成功' : '失败'}
${okrResult.message || ''}
${okrResult.aiResponse || ''}

${knowledgeContext.hasResults ? `相关知识库内容:\n${knowledgeContext.results.map((r: any) => `- ${r.title}: ${r.content.substring(0, 200)}...`).join('\n')}` : ''}

请基于这个OKR操作结果和相关知识库内容，用友好自然的方式回复用户。`
    } else if (knowledgeContext.hasResults || smartSuggestions.hasSuggestions) {
      // 为非OKR消息添加知识库上下文和智能建议
      enhancedMessage = `用户问题: ${request.message}

${knowledgeContext.hasResults ? `相关知识库内容:
${knowledgeContext.results.map((r: any) => `- ${r.title}: ${r.content.substring(0, 300)}...`).join('\n')}` : ''}

${smartSuggestions.hasSuggestions ? `智能学习建议:
${smartSuggestions.suggestions.map((s: string) => `• ${s}`).join('\n')}` : ''}

请基于以上内容回答用户问题，并提供有用的学习建议。如果有智能建议，请自然地融入到回答中。`
    }

    // 确保 sessionType 符合 AIRequest 接口要求
    const validSessionTypes = ['general', 'okr_planning', 'study_help', 'career_guidance'] as const
    const sessionType = validSessionTypes.includes(request.sessionType as any) 
      ? request.sessionType as 'general' | 'okr_planning' | 'study_help' | 'career_guidance' 
      : 'general'

    return {
      message: enhancedMessage,
      userId: request.userId,
      sessionId: request.sessionId,
      sessionType: sessionType,
      userProfile: request.userProfile,
      conversationHistory: request.conversationHistory || [],
      metadata: {
        platform: 'qiming-star',
        timestamp: new Date().toISOString(),
        projectId: request.projectId,
        organizationId: request.organizationId,
        knowledgeContext: knowledgeContext,
        smartSuggestions: smartSuggestions,
        conversationContext: conversationContext,
        okrResult: okrResult
      }
    }
  }

  /**
   * 保存聊天记录
   */
  private async saveChatHistory(request: ChatRequest, aiResponse: string, okrResult: any): Promise<string | null> {
    try {
      // 保存用户消息
      const { data: userMessage, error: userError } = await supabase
        .from('chat_history')
        .insert({
          user_id: request.userId,
          project_id: request.projectId || null,
          organization_id: request.organizationId || null,
          role: 'user',
          content: request.message,
          agent_type: request.sessionType || 'general',
          ai_content: aiResponse,
          metadata: {
            session_id: request.sessionId,
            has_okr_result: !!okrResult,
            message_length: request.message.length,
            response_length: aiResponse.length
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (userError) {
        console.error('保存聊天记录失败:', userError)
        return null
      }

      console.log('💾 聊天记录已保存:', userMessage.id)
      return userMessage.id

    } catch (error) {
      console.error('保存聊天记录异常:', error)
      return null
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: ChatRequest): string {
    const messageHash = request.message.toLowerCase().replace(/\s+/g, ' ').trim()
    const contextHash = [
      request.sessionType,
      request.projectId,
      request.organizationId
    ].filter(Boolean).join('|')
    
    return `${messageHash}:${contextHash}`
  }

  /**
   * 获取聊天历史记录
   */
  async getChatHistory(
    userId: string,
    projectId?: string,
    organizationId?: string,
    limit: number = 20
  ) {
    try {
      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: history, error } = await query

      if (error) {
        console.error('获取聊天历史失败:', error)
        return []
      }

      return history || []

    } catch (error) {
      console.error('获取聊天历史异常:', error)
      return []
    }
  }

  /**
   * 删除聊天记录
   */
  async deleteChatHistory(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId)

      if (error) {
        console.error('删除聊天记录失败:', error)
        return false
      }

      console.log('✅ 聊天记录删除成功:', conversationId)
      return true

    } catch (error) {
      console.error('删除聊天记录异常:', error)
      return false
    }
  }
}