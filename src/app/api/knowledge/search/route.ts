import { NextRequest, NextResponse } from 'next/server'
import { AIServiceManager } from '@/lib/ai-service-manager'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

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

export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'knowledge-search')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    console.log('🔍 知识库搜索API被调用')

    const body = await request.json()
    const { 
      query, 
      userId, 
      projectId, 
      organizationId, 
      documentType,
      searchType = 'hybrid',
      maxResults = 10,
      threshold = 0.7
    } = body

    if (!query || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数: query, userId' },
        { status: 400 }
      )
    }

    console.log('📤 知识库搜索请求:', {
      query,
      userId,
      projectId,
      organizationId,
      searchType,
      maxResults
    })

    // 验证用户权限
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role_type')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: '用户验证失败' },
        { status: 401 }
      )
    }

    try {
      // 方案1: 优先使用n8n工作流搜索
      const aiManager = AIServiceManager.getInstance()
      const searchFilters = {
        user_id: userId,
        project_id: projectId || null,
        organization_id: organizationId || null,
        document_type: documentType || null,
        max_results: maxResults,
        threshold: threshold
      }

      console.log('🤖 调用n8n知识库搜索工作流')
      const aiResponse = await aiManager.searchKnowledge(query, searchFilters)

      if (aiResponse.content) {
        let searchResults
        try {
          searchResults = typeof aiResponse.content === 'string' 
            ? JSON.parse(aiResponse.content) 
            : aiResponse.content
        } catch (error) {
          console.log('⚠️ N8N返回非JSON格式，使用备用搜索')
          throw new Error('N8N response format error')
        }

        console.log('✅ N8N知识库搜索成功')
        
        return NextResponse.json({
          success: true,
          data: searchResults.results || searchResults,
          metadata: {
            source: 'n8n-workflow',
            searchType: 'vector',
            totalResults: searchResults.total || (searchResults.results?.length || 0),
            responseTime: aiResponse.responseTime || 0,
            tokensUsed: aiResponse.tokensUsed || 0
          }
        })
      }
    } catch (error) {
      console.log('⚠️ N8N工作流搜索失败，使用数据库备用搜索:', error)
    }

    // 方案2: 备用数据库直接搜索
    console.log('🔄 使用数据库备用搜索')
    
    let query_builder = supabase
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

    // 应用搜索过滤
    if (searchType === 'exact') {
      query_builder = query_builder.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    } else {
      // 使用PostgreSQL全文搜索
      query_builder = query_builder.textSearch('content', query, {
        type: 'websearch',
        config: 'english'
      })
    }

    // 应用权限过滤
    if (user.role_type !== 'admin') {
      if (projectId) {
        // 验证项目访问权限
        const { data: userProject } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', userId)
          .eq('project_id', projectId)
          .single()

        if (!userProject) {
          return NextResponse.json(
            { error: '无权访问指定项目的文档' },
            { status: 403 }
          )
        }
        query_builder = query_builder.eq('project_id', projectId)
      } else if (organizationId) {
        // 验证组织访问权限
        const { data: userOrg } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .single()

        if (!userOrg) {
          return NextResponse.json(
            { error: '无权访问指定组织的文档' },
            { status: 403 }
          )
        }
        query_builder = query_builder.eq('organization_id', organizationId)
      } else {
        // 默认只搜索用户有权限的文档
        query_builder = query_builder.or(`user_id.eq.${userId},organization_id.in.(${await getUserOrganizations(userId)})`)
      }
    }

    if (documentType) {
      query_builder = query_builder.eq('document_type', documentType)
    }

    const { data: documents, error: searchError } = await query_builder

    if (searchError) {
      console.error('数据库搜索失败:', searchError)
      return NextResponse.json(
        { error: '搜索失败' },
        { status: 500 }
      )
    }

    console.log(`✅ 数据库搜索完成，找到 ${documents?.length || 0} 条结果`)

    return NextResponse.json({
      success: true,
      data: documents || [],
      metadata: {
        source: 'database-fallback',
        searchType: searchType,
        totalResults: documents?.length || 0,
        query: query,
        filters: {
          projectId,
          organizationId,
          documentType
        }
      }
    })

  } catch (error) {
    console.error('❌ 知识库搜索API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '知识库搜索失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 获取用户所属的组织ID列表
async function getUserOrganizations(userId: string): Promise<string> {
  try {
    const { data: userProjects } = await supabase
      .from('user_projects')
      .select('organization_id')
      .eq('user_id', userId)

    const orgIds = userProjects?.map(up => up.organization_id).filter(Boolean) || []
    return orgIds.length > 0 ? orgIds.join(',') : '00000000-0000-0000-0000-000000000000'
  } catch (error) {
    console.error('获取用户组织失败:', error)
    return '00000000-0000-0000-0000-000000000000'
  }
}

// GET方法：获取知识库统计信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('project_id')
    const organizationId = searchParams.get('organization_id')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      )
    }

    // 获取知识库统计信息
    let statsQuery = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_documents,
        COUNT(CASE WHEN document_type = 'auto_qa' THEN 1 END) as qa_documents,
        COUNT(CASE WHEN document_type = 'manual' THEN 1 END) as manual_documents,
        COUNT(CASE WHEN document_type = 'tutorial' THEN 1 END) as tutorial_documents
      FROM documents 
      WHERE status = 'active'
    `

    const queryParams: any[] = []
    if (projectId) {
      statsQuery += ` AND project_id = $${queryParams.length + 1}`
      queryParams.push(projectId)
    } else if (organizationId) {
      statsQuery += ` AND organization_id = $${queryParams.length + 1}`
      queryParams.push(organizationId)
    } else {
      statsQuery += ` AND user_id = $${queryParams.length + 1}`
      queryParams.push(userId)
    }

    const { data: stats, error: statsError } = await supabase.rpc('execute_sql', {
      sql_query: statsQuery,
      params: queryParams
    })

    if (statsError) {
      console.error('获取统计信息失败:', statsError)
    }

    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {
        total_documents: 0,
        recent_documents: 0,
        qa_documents: 0,
        manual_documents: 0,
        tutorial_documents: 0
      }
    })

  } catch (error) {
    console.error('❌ 获取知识库统计API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取统计信息失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}