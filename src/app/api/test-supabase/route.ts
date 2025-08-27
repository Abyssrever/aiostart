import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('测试 Supabase 连接...')
    
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('环境变量检查:')
    console.log('URL:', supabaseUrl)
    console.log('Key:', supabaseKey ? '已设置' : '未设置')
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: '环境变量未设置', 
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 })
    }
    
    // 测试数据库连接
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      
    if (error) {
      console.error('Supabase 连接错误:', error)
      return NextResponse.json({ 
        error: 'Supabase 连接失败', 
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase 连接正常',
      url: supabaseUrl
    })
    
  } catch (error) {
    console.error('测试连接异常:', error)
    return NextResponse.json({ 
      error: '测试连接异常', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}