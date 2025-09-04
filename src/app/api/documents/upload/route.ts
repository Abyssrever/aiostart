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
    const rateLimit = await applyRateLimit(clientIP, 'document-upload')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    console.log('📄 文档上传API被调用')

    // 解析multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const projectId = formData.get('project_id') as string
    const userId = formData.get('user_id') as string
    const organizationId = formData.get('organization_id') as string
    const documentType = formData.get('document_type') as string || 'general'

    if (!file || !title || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数: file, title, user_id' },
        { status: 400 }
      )
    }

    // 验证文件类型和大小
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型。支持的类型: txt, pdf, doc, docx' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小不能超过10MB' },
        { status: 400 }
      )
    }

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

    // 如果指定了项目ID，验证用户是否有权限
    if (projectId) {
      const { data: userProject, error: projectError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single()

      if (projectError || !userProject) {
        return NextResponse.json(
          { error: '无权访问指定项目' },
          { status: 403 }
        )
      }
    }

    // 准备文档元数据
    const metadata = {
      title,
      project_id: projectId || null,
      user_id: userId,
      organization_id: organizationId || null,
      document_type: documentType,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString()
    }

    console.log('📤 准备上传文档到n8n工作流:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      metadata
    })

    // 调用AI服务管理器的文档上传功能
    const aiManager = AIServiceManager.getInstance()
    const aiResponse = await aiManager.uploadDocument(file, metadata)

    if (!aiResponse.content) {
      return NextResponse.json(
        { error: '文档处理失败，请稍后重试' },
        { status: 500 }
      )
    }

    // 解析AI响应，获取处理结果
    let processedResult
    try {
      processedResult = typeof aiResponse.content === 'string' 
        ? JSON.parse(aiResponse.content) 
        : aiResponse.content
    } catch (error) {
      console.error('解析AI响应失败:', error)
      processedResult = { message: aiResponse.content }
    }

    console.log('✅ 文档处理完成:', processedResult)

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '文档上传和处理成功',
      data: {
        documentId: processedResult.document_id || null,
        title: metadata.title,
        processedContent: processedResult.extracted_text || null,
        embeddingGenerated: !!processedResult.embedding_created,
        tokensUsed: aiResponse.tokensUsed || 0,
        responseTime: aiResponse.responseTime || 0
      },
      metadata: {
        originalFilename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: metadata.uploaded_at,
        processingStatus: 'completed'
      }
    })

  } catch (error) {
    console.error('❌ 文档上传API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '文档上传失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('project_id')
    const organizationId = searchParams.get('organization_id')
    const documentType = searchParams.get('document_type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      )
    }

    console.log('📋 获取文档列表:', {
      userId,
      projectId,
      organizationId,
      documentType,
      limit,
      offset
    })

    // 构建查询条件
    let query = supabase
      .from('documents')
      .select(`
        id,
        title,
        document_type,
        created_at,
        updated_at,
        metadata,
        organization_id,
        project_id,
        user_id
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 应用过滤条件
    if (projectId) {
      query = query.eq('project_id', projectId)
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else {
      // 默认只显示用户自己的文档
      query = query.eq('user_id', userId)
    }

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('获取文档列表失败:', error)
      return NextResponse.json(
        { error: '获取文档列表失败' },
        { status: 500 }
      )
    }

    // 获取总数
    let countQuery = supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    if (projectId) {
      countQuery = countQuery.eq('project_id', projectId)
    } else if (organizationId) {
      countQuery = countQuery.eq('organization_id', organizationId)
    } else {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (documentType) {
      countQuery = countQuery.eq('document_type', documentType)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('获取文档总数失败:', countError)
    }

    return NextResponse.json({
      success: true,
      data: documents || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ 获取文档列表API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取文档列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}