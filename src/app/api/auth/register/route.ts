import { NextRequest, NextResponse } from 'next/server'
import { supabaseServerAnon } from '@/lib/supabase-server'
import { isValidEmail, isValidPassword, normalizeEmail, generateDisplayName, isValidRole } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, student_id } = await request.json()
    
    // 1. 输入验证
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    // 标准化邮箱
    const normalizedEmail = normalizeEmail(email)
    
    // 验证邮箱格式
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 }
      )
    }
    
    // 验证密码强度
    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }
    
    // 验证角色
    if (!isValidRole(role)) {
      return NextResponse.json(
        { error: '无效的用户角色' },
        { status: 400 }
      )
    }
    
    // 2. 准备用户数据
    const displayName = generateDisplayName(name, normalizedEmail)
    
    // 生成学号
    const generateStudentId = () => {
      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      return `ST${year}${randomNum}`
    }
    
    // 3. 使用 Supabase 客户端注册（自动发送验证邮件）
    const { data: authData, error: authError } = await supabaseServerAnon.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: displayName,
          role,
          student_id: student_id || generateStudentId()
        }
      }
    })
    
    if (authError) {
      console.error('Supabase Auth注册失败:', authError)
      
      // 处理常见的错误
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 400 }
        )
      } else if (authError.message.includes('password')) {
        return NextResponse.json(
          { error: '密码格式不符合要求' },
          { status: 400 }
        )
      } else if (authError.message.includes('rate limit')) {
        return NextResponse.json(
          { error: '操作过于频繁，请稍后重试' },
          { status: 429 }
        )
      } else if (authError.message.includes('Unable to validate email address')) {
        return NextResponse.json(
          { error: '邮箱地址无效，请检查后重试' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: '注册失败：' + authError.message },
          { status: 400 }
        )
      }
    }
    
    if (!authData.user) {
      return NextResponse.json(
        { error: '注册失败，请稍后重试' },
        { status: 400 }
      )
    }

    console.log('Supabase Auth注册成功，用户ID:', authData.user.id)
    console.log('邮箱确认状态:', authData.user.email_confirmed_at ? '已确认' : '待确认')
    console.log('用户元数据:', authData.user.user_metadata)
    
    // 4. 返回注册成功信息
    return NextResponse.json({
      success: true,
      message: '注册成功！我们已向您的邮箱发送了验证链接，请查收邮件并点击链接完成验证。',
      user_id: authData.user.id,
      email: normalizedEmail,
      needVerification: !authData.user.email_confirmed_at
    })
    
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}