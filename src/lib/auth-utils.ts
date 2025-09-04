import { randomBytes } from 'crypto'

/**
 * 生成安全的验证令牌
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证密码强度
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少需要8位' }
  }
  
  // 密码必须包含大小写字母、数字和特殊字符
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
    return { valid: false, message: '密码必须包含大小写字母、数字和特殊字符(@$!%*?&)' }
  }
  
  // 检查常见弱密码
  const weakPasswords = ['12345678', 'password', 'Password123!', 'admin123@', 'qwerty123!']
  if (weakPasswords.some(weak => password.toLowerCase().includes(weak.toLowerCase()))) {
    return { valid: false, message: '密码过于简单，请使用更安全的密码' }
  }
  
  return { valid: true }
}

/**
 * 清理和标准化邮箱地址
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * 生成用户显示名称
 */
export function generateDisplayName(name: string, email: string): string {
  if (name && name.trim()) {
    return name.trim()
  }
  
  // 从邮箱提取用户名作为显示名称
  const username = email.split('@')[0]
  return username.charAt(0).toUpperCase() + username.slice(1)
}

/**
 * 验证角色是否有效
 */
export function isValidRole(role: string): role is 'student' | 'teacher' | 'admin' {
  return ['student', 'teacher', 'admin'].includes(role)
}

/**
 * 生成验证邮件的HTML内容
 */
export function generateVerificationEmailHtml(
  name: string, 
  verificationUrl: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">🌟 启明星系统</h1>
        <p style="color: #666; margin: 5px 0;">AI智慧教育平台</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h2 style="color: #1e40af; margin-top: 0;">欢迎加入启明星！</h2>
        <p>亲爱的 <strong>${name}</strong>，</p>
        <p>感谢您注册启明星AI智慧教育平台。为了确保您的账户安全，请点击下方按钮验证您的邮箱地址：</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            🔗 验证邮箱地址
          </a>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ 重要提示：</strong></p>
          <ul style="margin: 10px 0; color: #856404;">
            <li>此验证链接将在24小时后自动失效</li>
            <li>请在失效前完成邮箱验证，否则无法正常登录系统</li>
            <li>如果按钮无法点击，请复制下方链接到浏览器地址栏</li>
          </ul>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #1565c0; font-size: 14px; word-break: break-all;">
            <strong>验证链接：</strong><br>
            ${verificationUrl}
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          完成验证后，您将能够：<br>
          ✅ 使用AI助手进行学习规划<br>
          ✅ 创建和管理个人OKR目标<br>
          ✅ 获得个性化学习建议<br>
          ✅ 查看学习进度和数据分析
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">
      
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p>如果您没有注册此账户，请忽略此邮件。</p>
        <p style="margin: 20px 0;">
          <strong>启明星AI智慧教育平台</strong><br>
          让AI成为您的学习伙伴
        </p>
        <p style="font-size: 12px; color: #9ca3af;">
          此邮件由系统自动发送，请勿直接回复。<br>
          如有问题，请联系系统管理员。
        </p>
      </div>
    </div>
  `
}