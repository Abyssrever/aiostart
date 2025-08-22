'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  
  const { signInWithOtp, sendOtp, signInDirectly } = useAuth()
  const router = useRouter()

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await sendOtp(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('验证码已发送到您的邮箱，请查收')
        setShowOtpInput(true)
        setCountdown(60) // 60秒倒计时
      }
    } catch (error) {
      setError('发送验证码失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError('请输入验证码')
      return
    }

    if (otp.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signInWithOtp(email, otp)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('登录成功！')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDirectLogin = async () => {
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signInDirectly(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('登录成功！')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await sendOtp(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('验证码已重新发送')
        setCountdown(60)
      }
    } catch (error) {
      setError('重新发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">启明星系统</CardTitle>
          <CardDescription className="text-center">
            {!showOtpInput ? '请输入您的邮箱地址登录' : '请输入邮箱验证码'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? '发送中...' : '发送验证码'}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={handleDirectLogin}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  临时跳过验证直接登录
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otp">验证码</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // 只允许数字
                    setOtp(value)
                  }}
                  maxLength={6}
                  required
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500 text-center">
                  验证码已发送到您的邮箱，有效期5分钟，请使用最新收到的验证码
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || otp.length !== 6}
              >
                {loading ? '验证中...' : '验证登录'}
              </Button>
              
              <div className="flex justify-between text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setShowOtpInput(false)
                    setOtp('')
                    setError('')
                    setSuccess('')
                    setCountdown(0)
                  }}
                  className="text-gray-600 hover:text-gray-800 p-0"
                >
                  返回
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendOtp}
                  disabled={loading || countdown > 0}
                  className="text-blue-600 hover:text-blue-800 p-0"
                >
                  {countdown > 0 ? `重新发送(${countdown}s)` : '重新发送'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}