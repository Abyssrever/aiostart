import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建带有Service Role的客户端（如果可用）
const supabaseAdmin = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const okrData = await request.json()
    
    // 确保日期字段不为空
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // 如果有Service Role Key，直接插入
    if (supabaseServiceKey) {
      const { data, error } = await supabaseAdmin
        .from('okrs')
        .insert({
          user_id: okrData.user_id,
          title: okrData.title,
          description: okrData.description || '',
          category: okrData.category || 'personal',
          priority: okrData.priority || 'medium',
          status: okrData.status || 'active',
          start_date: okrData.start_date || today,
          end_date: okrData.end_date || endDate,
          progress: 0
        })
        .select()
        .single()

      if (error) {
        console.error('创建OKR失败:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ data, success: true })
    } else {
      // 没有Service Role Key时，模拟成功创建（用于演示）
      const mockOKR = {
        id: crypto.randomUUID(),
        user_id: okrData.user_id,
        title: okrData.title,
        description: okrData.description || '',
        category: okrData.category || 'personal',
        priority: okrData.priority || 'medium',
        status: okrData.status || 'active',
        start_date: okrData.start_date || today,
        end_date: okrData.end_date || endDate,
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        parent_okr_id: null
      }
      
      console.log('演示模式：模拟创建OKR成功')
      return NextResponse.json({ data: mockOKR, success: true })
    }
  } catch (error) {
    console.error('创建OKR异常:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}