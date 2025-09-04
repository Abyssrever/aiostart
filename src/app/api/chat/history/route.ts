import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const organizationId = searchParams.get('organizationId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    console.log('🔍 获取聊天历史:', { userId, projectId, organizationId, limit })

    // 构建查询条件
    let query = supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit)

    // 如果指定了项目ID，添加过滤条件
    if (projectId && projectId !== 'undefined') {
      query = query.eq('project_id', projectId)
    }

    // 如果指定了组织ID，添加过滤条件
    if (organizationId && organizationId !== 'undefined') {
      query = query.eq('organization_id', organizationId)
    }

    const { data: chatHistory, error } = await query

    if (error) {
      console.error('获取聊天历史失败:', error)
      return NextResponse.json(
        { success: false, error: '获取聊天历史失败' },
        { status: 500 }
      )
    }

    console.log(`✅ 成功获取 ${chatHistory?.length || 0} 条聊天历史记录`)

    return NextResponse.json({
      success: true,
      history: chatHistory || [],
      count: chatHistory?.length || 0
    })

  } catch (error) {
    console.error('聊天历史API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用户ID' },
        { status: 400 }
      )
    }

    console.log('🗑️ 删除聊天历史:', { userId, sessionId })

    let query = supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)

    // 如果指定了会话ID，只删除特定会话
    if (sessionId && sessionId !== 'undefined') {
      query = query.eq('session_id', sessionId)
    }

    const { error } = await query

    if (error) {
      console.error('删除聊天历史失败:', error)
      return NextResponse.json(
        { success: false, error: '删除聊天历史失败' },
        { status: 500 }
      )
    }

    console.log('✅ 成功删除聊天历史记录')

    return NextResponse.json({
      success: true,
      message: '聊天历史已清除'
    })

  } catch (error) {
    console.error('删除聊天历史API错误:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}