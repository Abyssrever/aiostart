import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端，使用Service Role Key进行向量搜索
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
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: '查询内容不能为空' }, { status: 400 })
    }

    // 使用向量相似度搜索知识库
    const { data: chunks, error } = await supabase.rpc('search_knowledge', {
      query_text: query,
      match_threshold: 0.7,
      match_count: limit
    })

    if (error) {
      console.error('知识库搜索失败:', error)
      return NextResponse.json({ error: '知识库搜索失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: chunks || [],
      query,
      count: chunks?.length || 0
    })

  } catch (error) {
    console.error('知识库API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 获取知识库统计信息
    const { data: stats, error } = await supabase
      .from('knowledge_documents')
      .select('id, title, document_type, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('获取知识库信息失败:', error)
      return NextResponse.json({ error: '获取知识库信息失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      documents: stats || [],
      total: stats?.length || 0
    })

  } catch (error) {
    console.error('知识库API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}