import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: '邮箱地址不能为空' }, { status: 400 })
    }

    // 检查用户是否存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: '该邮箱未注册，请联系管理员' }, { status: 404 })
    }

    // 生成6位数验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5分钟后过期

    // 删除该邮箱的所有旧验证码（确保只有最新的有效）
    const { error: deleteError } = await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())

    if (deleteError) {
      console.error('删除旧验证码失败:', deleteError)
    }

    // 保存新验证码到数据库
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (insertError) {
      console.error('保存验证码失败:', insertError)
      return NextResponse.json({ error: '生成验证码失败' }, { status: 500 })
    }

    // 发送邮件
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: '启明星系统 - 登录验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">启明星系统登录验证码</h2>
            <p>您好，${user.name || '用户'}！</p>
            <p>您的登录验证码是：</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${code}</span>
            </div>
            <p>验证码有效期为5分钟，请及时使用。</p>
            <p>如果您没有请求此验证码，请忽略此邮件。</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">此邮件由启明星系统自动发送，请勿回复。</p>
          </div>
        `
      })

      console.log('验证码邮件发送成功:', email)
      return NextResponse.json({ success: true })
    } catch (emailError) {
      console.error('发送邮件失败:', emailError)
      return NextResponse.json({ error: '发送邮件失败，请稍后重试' }, { status: 500 })
    }
  } catch (error) {
    console.error('发送验证码API错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}