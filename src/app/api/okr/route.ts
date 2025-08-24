import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 检查必要的环境变量
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

// 创建Supabase客户端 - 优先使用Service Role，回退到匿名密钥
const effectiveKey = supabaseServiceKey || supabaseAnonKey
const useServiceRole = !!supabaseServiceKey

const supabaseClient = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 记录警告但不阻止API工作
if (!useServiceRole) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key with RLS restrictions')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'createOKR':
        return await createOKR(data)
      case 'createKeyResult':
        return await createKeyResult(data)
      case 'updateKeyResultProgress':
        return await updateKeyResultProgress(data)
      case 'deleteOKR':
        return await deleteOKR(data)
      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('OKR API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function createOKR(okrData: any) {
  try {
    // 确保日期字段不为空
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data, error } = await supabaseClient
      .from('okrs')
      .insert({
        user_id: okrData.user_id,
        title: okrData.title,
        description: okrData.description || '',
        objective_type: (okrData.category || 'personal') as 'personal' | 'course' | 'college',
        status: (okrData.status || 'active') as 'draft' | 'active' | 'completed' | 'cancelled',
        target_year: new Date().getFullYear(),
        progress_percentage: 0
      })
      .select()
      .single()

    if (error) {
      console.error('创建OKR失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('创建OKR异常:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

async function createKeyResult(keyResultData: any) {
  try {
    const { data, error } = await supabaseClient
      .from('key_results')
      .insert({
        okr_id: keyResultData.okr_id,
        title: keyResultData.title,
        description: keyResultData.description || '',
        target_value: keyResultData.target_value || 0,
        unit: keyResultData.unit || '',
        current_value: 0,
        progress_percentage: 0,
        status: 'active',
        measurement_type: 'numeric'
      })
      .select()
      .single()

    if (error) {
      console.error('创建关键结果失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('创建关键结果异常:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

async function updateKeyResultProgress(updateData: any) {
  try {
    const { keyResultId, currentValue } = updateData
    
    // 获取关键结果信息
    const { data: keyResult, error: fetchError } = await supabaseClient
      .from('key_results')
      .select('*')
      .eq('id', keyResultId)
      .single()

    if (fetchError || !keyResult) {
      return NextResponse.json({ error: '关键结果不存在' }, { status: 404 })
    }

    // 计算进度百分比
    let progressPercentage = 0
    if (keyResult.target_value && keyResult.target_value > 0) {
      progressPercentage = Math.min((currentValue / keyResult.target_value) * 100, 100)
    }

    // 更新关键结果
    const { data, error } = await supabaseClient
      .from('key_results')
      .update({
        current_value: currentValue,
        progress_percentage: Math.round(progressPercentage),
        status: progressPercentage >= 100 ? 'completed' : 'active'
      })
      .eq('id', keyResultId)
      .select()
      .single()

    if (error) {
      console.error('更新关键结果进度失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('更新进度异常:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

async function deleteOKR(deleteData: any) {
  try {
    const { okrId } = deleteData
    
    const { error } = await supabaseClient
      .from('okrs')
      .delete()
      .eq('id', okrId)

    if (error) {
      console.error('删除OKR失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除OKR异常:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    switch (action) {
      case 'getUserOKRs':
        return await getUserOKRs(userId!)
      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('OKR API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function getUserOKRs(userId: string) {
  try {
    // 获取OKR数据
    const { data: okrs, error: okrError } = await supabaseClient
      .from('okrs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (okrError) {
      console.error('获取OKR失败:', okrError)
      return NextResponse.json({ error: okrError.message }, { status: 400 })
    }

    if (!okrs) {
      return NextResponse.json({ data: [], success: true })
    }

    // 获取所有OKR的关键结果
    const okrIds = okrs.map(okr => okr.id)
    const { data: keyResults, error: krError } = await supabaseClient
      .from('key_results')
      .select('*')
      .in('okr_id', okrIds)
      .order('created_at', { ascending: true })

    if (krError) {
      console.error('获取关键结果失败:', krError)
      return NextResponse.json({ error: krError.message }, { status: 400 })
    }

    // 组合数据
    const okrsWithKeyResults = okrs.map(okr => ({
      ...okr,
      keyResults: keyResults?.filter(kr => kr.okr_id === okr.id) || []
    }))

    return NextResponse.json({ data: okrsWithKeyResults, success: true })
  } catch (error) {
    console.error('获取用户OKR异常:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}