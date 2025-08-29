'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
// import GitUpdateLogger from '@/components/GitUpdateLogger'

function LoginFormContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()

  // 预加载目标页面以加快跳转速度
  useEffect(() => {
    router.prefetch('/dashboard/student')
    router.prefetch('/dashboard/teacher')
    router.prefetch('/dashboard/admin')
  }, [router])

  // 处理URL参数中的状态信息
  useEffect(() => {
    const verified = searchParams.get('verified')
    const errorParam = searchParams.get('error')
    
    if (verified === 'true') {
      setSuccess('邮箱验证成功！现在您可以登录了。')
    } else if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'missing_token': '验证链接无效',
        'server_error': '服务器错误，请稍后重试',
        'expired_token': '验证链接已过期'
      }
      setError(errorMessages[errorParam] || decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('LoginForm: 开始调用signIn方法')
      // 使用AuthContext的signIn方法
      const result = await signIn(email.trim().toLowerCase(), password)
      
      console.log('LoginForm: signIn返回结果:', result)
      
      if (result.error) {
        console.log('LoginForm: 登录失败，错误:', result.error)
        setError(result.error)
        return
      }
      
      // 登录成功，立即跳转
      console.log('LoginForm: 登录成功，立即跳转')
      
      // 直接跳转，无需延迟
      try {
        router.replace('/dashboard/student')
        console.log('LoginForm: 已执行跳转命令')
      } catch (routeError) {
        console.error('LoginForm: 路由跳转错误:', routeError)
        // 降级方案：使用 window.location
        window.location.href = '/dashboard/student'
      }
      
    } catch (error) {
      console.error('LoginForm: 登录异常:', error)
      setError('登录失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const handleGoToRegister = () => {
    router.push('/register')
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">🌟 启明星登录</CardTitle>
        <CardDescription className="text-center">
          请输入您的邮箱和密码登录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入您的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          还没有账户？{' '}
          <Button
            type="button"
            variant="link"
            onClick={handleGoToRegister}
            className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
          >
            立即注册
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginForm() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* <GitUpdateLogger /> */}
      <Suspense fallback={
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-8">
            <div className="text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载中...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  )
}