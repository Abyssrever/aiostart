import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    console.log('🚀 开始设置数据库表...')

    const results = []

    // 由于无法直接执行DDL语句，我们先检查表是否存在
    console.log('📝 检查chat_history表是否存在...')
    const { data: chatCheck, error: chatCheckError } = await supabase
      .from('chat_history')
      .select('count')
      .limit(1)

    if (chatCheckError) {
      console.log('chat_history表不存在，需要手动创建')
      results.push({
        table: 'chat_history',
        exists: false,
        error: 'Table does not exist - needs manual creation',
        sql: `
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  content TEXT NOT NULL,
  ai_content TEXT,
  role TEXT DEFAULT 'user',
  agent_type TEXT DEFAULT 'general',  
  project_id UUID,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at);
        `
      })
    } else {
      console.log('chat_history表已存在')
      results.push({
        table: 'chat_history',
        exists: true,
        message: 'Table exists'
      })
    }

    // 检查其他表
    const otherTables = ['documents', 'tasks']
    
    for (const table of otherTables) {
      console.log(`📄 检查${table}表...`)
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      results.push({
        table,
        exists: !error,
        error: error?.message
      })
    }

    console.log('✅ 数据库表设置完成:', results)

    return NextResponse.json({
      success: true,
      message: '数据库表设置完成',
      results
    })

  } catch (error) {
    console.error('❌ 数据库设置失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      message: '数据库设置失败'
    }, { status: 500 })
  }
}

// GET方法：检查表状态
export async function GET() {
  try {
    console.log('🔍 检查数据库表状态...')

    const tables = ['chat_history', 'documents', 'tasks', 'users']
    const results = []

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)

      results.push({
        table,
        exists: !error,
        error: error?.message
      })
    }

    return NextResponse.json({
      success: true,
      tables: results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}