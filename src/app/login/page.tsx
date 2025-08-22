'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const LoginContent: React.FC = () => {
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const { signInWithMagicLink, signInWithOtp, signInDirectly, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 如果已登录，重定向到仪表板
  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) {
      console.log('Login页面: 认证状态加载中...')
      return
    }
    
    if (isAuthenticated) {
      console.log('Login页面: 用户已登录，重定向到dashboard')
      // 使用setTimeout避免在渲染过程中立即重定向，防止循环
      const timer = setTimeout(() => {
        router.replace('/dashboard')
      }, 200)
      return () => clearTimeout(timer)
    } else {
      console.log('Login页面: 用户未登录，显示登录界面')
    }
  }, [isAuthenticated, loading, router])

  // 处理URL参数中的错误信息
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'auth_failed') {
      setError('邮箱验证失败，请重新尝试')
    } else if (errorParam === 'callback_failed') {
      setError('登录过程中出现错误，请重新尝试')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signInWithMagicLink(email)
      
      if (result.error) {
        setError(result.error)
      } else {
        // 邮箱验证成功，进入验证码界面
        setEmailSent(true)
      }
    } catch (err) {
      setError('发送验证邮件失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setError('')
    setIsLoading(true)

    try {
      const result = await signInWithMagicLink(email)
      
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('重新发送验证邮件失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // 检查验证码是否为6位数字
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('请输入6位数字验证码')
        return
      }
      
      // 对于临时版本，任意6位数字验证码都能通过
      console.log('使用临时验证逻辑，任意6位数字验证码都能通过')
      
      // 使用signInDirectly方法手动登录
      const result = await signInDirectly(email)
      
      if (result.error) {
        setError(result.error)
      } else {
        // 登录成功，跳转到智能dashboard路由分发器，它会根据用户角色自动重定向
        router.push('/dashboard')
      }
      
    } catch (err) {
      console.log('验证码验证异常:', err)
      setError('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 平台标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            启明星平台
          </h1>
          <p className="text-gray-600">智能化教育管理系统</p>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              {emailSent ? '检查您的邮箱' : '邮箱登录'}
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              {emailSent 
                ? `我们已向 ${email} 发送了验证链接` 
                : '请输入您的邮箱地址，我们将发送验证链接'
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!emailSent ? (
              // 邮箱输入表单
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    邮箱地址
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入您的邮箱地址"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <p className="font-medium">测试邮箱：</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>1956094526@qq.com (学生)</li>
                      <li>teacher@example.com (教师)</li>
                      <li>admin@example.com (管理员)</li>
                    </ul>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 发送验证邮件按钮 */}
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      发送验证邮件
                    </>
                  )}
                </Button>
              </form>
            ) : (
              // 邮件发送成功界面
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      验证邮件已发送
                    </h3>
                    <p className="text-gray-600 text-sm">
                      请输入6位数字验证码完成登录
                    </p>
                  </div>
                </div>

                {/* 验证码输入表单 */}
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                      验证码
                    </Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="请输入6位验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-center text-lg tracking-widest"
                      maxLength={6}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* 错误提示 */}
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 验证按钮 */}
                  <Button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        验证中...
                      </>
                    ) : (
                      '验证并登录'
                    )}
                  </Button>
                </form>

                <div className="space-y-3">
                  {/* 重新发送按钮 */}
                  <Button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-11 border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        重新发送中...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        重新发送验证邮件
                      </>
                    )}
                  </Button>

                  {/* 返回按钮 */}
                  <Button
                    onClick={() => {
                      setEmailSent(false)
                      setVerificationCode('')
                      setError('')
                    }}
                    variant="ghost"
                    className="w-full h-11 text-gray-600 hover:text-gray-800"
                  >
                    使用其他邮箱
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 页脚信息 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 启明星平台. 保留所有权利.</p>
        </div>
      </div>
    </div>
  )
}

const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

export default LoginPage
