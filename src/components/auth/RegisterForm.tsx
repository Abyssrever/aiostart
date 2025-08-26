'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface RegisterFormProps {
  onToggleMode?: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '',
    student_id: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // 验证必填字段
    if (!formData.name.trim()) {
      setError('请输入您的姓名')
      setLoading(false)
      return
    }

    if (!formData.role) {
      setError('请选择您的角色')
      setLoading(false)
      return
    }

    if (!formData.email.trim()) {
      setError('请输入邮箱地址')
      setLoading(false)
      return
    }

    // 验证密码
    if (formData.password.length < 6) {
      setError('密码长度至少为6位')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          role: formData.role,
          student_id: formData.student_id.trim() || undefined
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSuccess('注册成功！我们已向您的邮箱发送了验证邮件，请查收并点击验证链接激活账户。')
        // 清空表单
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          role: '',
          student_id: ''
        })
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('注册失败，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">🌟 加入启明星</CardTitle>
        <CardDescription className="text-center">
          请填写您的信息完成注册
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">角色</Label>
            <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="请选择您的角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="student_id">学号（可选）</Label>
            <Input
              id="student_id"
              name="student_id"
              type="text"
              placeholder="请输入学号"
              value={formData.student_id}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码（至少6位）"
                value={formData.password}
                onChange={handleChange}
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
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
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
                注册中...
              </>
            ) : (
              '注册账户'
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          已有账户？{' '}
          <Button
            type="button"
            variant="link"
            onClick={() => router.push('/login')}
            className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
          >
            立即登录
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}