import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { normalizeEmail, isValidEmail } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // 1. 输入验证
    if (!email || !password) {
      return NextResponse.json(
        { error: '请输入邮箱和密码' },
        { status: 400 }
      )
    }

    // 标准化邮箱
    const normalizedEmail = normalizeEmail(email)
    
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }
    
    // 2. 使用Supabase Auth登录
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })
    
    if (authError) {
      console.error('Supabase Auth登录失败:', authError)
      
      // 根据错误类型返回更具体的消息
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: '邮箱或密码错误，请检查后重试' },
          { status: 401 }
        )
      } else if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            error: '请先验证您的邮箱后再登录',
            needVerification: true,
            email: normalizedEmail
          },
          { status: 403 }
        )
      } else if (authError.message.includes('too many requests')) {
        return NextResponse.json(
          { error: '登录尝试过于频繁，请稍后再试' },
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          { error: '登录失败：' + authError.message },
          { status: 401 }
        )
      }
    }
    
    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: '登录失败，请稍后重试' },
        { status: 401 }
      )
    }
    
    console.log('Supabase Auth登录成功，用户ID:', authData.user.id)
    
    // 3. 返回登录成功信息
    return NextResponse.json({
      success: true,
      message: '登录成功！',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
        role: authData.user.user_metadata?.role || 'student',
        email_verified: !!authData.user.email_confirmed_at,
        student_id: authData.user.user_metadata?.student_id,
        last_login_at: authData.user.last_sign_in_at
      },
      session: authData.session
    })
    
  } catch (error) {
    console.error('登录异常:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}