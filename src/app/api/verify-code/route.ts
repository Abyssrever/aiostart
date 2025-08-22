import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: '邮箱和验证码不能为空' }, { status: 400 })
    }

    // 查找该邮箱最新的验证码（按创建时间降序排列，只取第一个）
    const { data: latestCodes, error: queryError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (queryError || !latestCodes || latestCodes.length === 0) {
      return NextResponse.json({ error: '验证码不存在或已失效' }, { status: 400 })
    }

    const verificationCode = latestCodes[0]

    // 检查输入的验证码是否与最新的验证码匹配
    if (verificationCode.code !== code.trim()) {
      return NextResponse.json({ error: '验证码错误，请输入最新收到的验证码' }, { status: 400 })
    }

    // 检查验证码是否过期
    const now = new Date()
    const expiresAt = new Date(verificationCode.expires_at)
    
    if (now > expiresAt) {
      // 删除过期的验证码
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', verificationCode.id)
      
      return NextResponse.json({ error: '验证码已过期，请重新获取' }, { status: 400 })
    }

    // 标记验证码为已使用，并删除该邮箱的所有其他验证码
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())

    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 返回用户信息
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        avatar_url: user.avatar_url,
        student_id: user.student_id,
        grade: user.grade,
        major: user.major,
        class_name: user.class_name
      }
    })
  } catch (error) {
    console.error('验证验证码API错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}