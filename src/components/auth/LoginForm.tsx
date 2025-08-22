'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false)
  
  const { signIn, sendOtp, signInWithOtp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!showVerification) {
        // 检查是否为首次登录（这里简化处理，实际应该从后端获取）
        const isFirstTime = !localStorage.getItem(`user_verified_${email}`)
        setIsFirstTimeLogin(isFirstTime)
        
        if (isFirstTime) {
          // 首次登录，发送OTP验证码
          const result = await sendOtp(email)
          
          if (result.error) {
            setError(result.error)
          } else {
            // 显示验证码输入界面
            setShowVerification(true)
          }
        } else {
          // 非首次登录，使用密码登录
          const result = await signIn(email, password)
          
          if (result.error) {
            setError(result.error)
          } else {
            router.push('/dashboard')
          }
        }
      } else {
        // 验证OTP验证码
        const result = await signInWithOtp(email, verificationCode)
        
        if (result.error) {
          setError(result.error)
        } else {
          // 验证成功，标记用户已验证
          localStorage.setItem(`user_verified_${email}`, 'true')
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await sendOtp(email)
      
      if (result.error) {
        setError(result.error)
      } else {
        // 可以显示成功消息
        console.log('验证码已重新发送到邮箱:', email)
      }
    } catch (err) {
      setError('重新发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    // 返回登录页面
    setShowVerification(false)
    setVerificationCode('')
    setError('')
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {showVerification ? '验证身份' : '登录'}
        </CardTitle>
        <CardDescription className="text-center">
          {showVerification 
            ? `验证码已发送至 ${email}，请输入6位验证码` 
            : '输入您的邮箱和密码来登录账户'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!showVerification ? (
            // 登录表单
            <>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            // 验证码表单
            <>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">验证码</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  required
                  disabled={loading}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  ← 返回登录
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-blue-600 hover:text-blue-800"
                  disabled={loading}
                >
                  重新发送
                </button>
              </div>
            </>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {showVerification ? '验证中...' : '登录中...'}
              </>
            ) : (
              showVerification ? '验证' : '登录'
            )}
          </Button>
        </form>
        

      </CardContent>
    </Card>
  )
}