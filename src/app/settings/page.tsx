'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Camera,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 个人信息状态
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    bio: '',
    birthday: '',
    avatar: user?.avatar || ''
  })

  // 安全设置状态
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const handleProfileSave = async () => {
    setIsLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: '个人信息已成功更新' })
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败，请重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: '新密码与确认密码不匹配' })
      return
    }
    if (securityData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '密码长度至少为6位' })
      return
    }

    setIsLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: 'success', text: '密码已成功修改' })
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setMessage({ type: 'error', text: '密码修改失败，请重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          avatar: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="/settings" />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">个人设置</h1>
          <p className="text-gray-600 mt-2">管理您的账户信息和安全设置</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* 设置选项卡 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>个人信息</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>账号安全</span>
            </TabsTrigger>
          </TabsList>

          {/* 个人信息选项卡 */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>基本信息</span>
                </CardTitle>
                <CardDescription>
                  更新您的个人资料和联系信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 头像上传 */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData.avatar} alt={profileData.name} />
                      <AvatarFallback className="text-2xl">
                        {profileData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{profileData.name}</h3>
                    <p className="text-gray-500">{user?.role === 'student' ? '学生' : user?.role === 'teacher' ? '教师' : '管理员'}</p>
                    <Badge variant="outline" className="mt-2">
                      {user?.role === 'student' ? '学生账户' : user?.role === 'teacher' ? '教师账户' : '管理员账户'}
                    </Badge>
                  </div>
                </div>

                {/* 基本信息表单 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱地址</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="请输入邮箱地址"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号码</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="请输入手机号码"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday">生日</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="birthday"
                        type="date"
                        value={profileData.birthday}
                        onChange={(e) => setProfileData(prev => ({ ...prev, birthday: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="请输入您的地址"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="介绍一下您自己..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileSave}
                    disabled={isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? '保存中...' : '保存更改'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 账号安全选项卡 */}
          <TabsContent value="security" className="space-y-6">
            {/* 密码修改 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>密码设置</span>
                </CardTitle>
                <CardDescription>
                  定期更改密码以保护您的账户安全
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="请输入新密码（至少6位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="请再次输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !securityData.currentPassword || !securityData.newPassword}
                    className="flex items-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isLoading ? '修改中...' : '修改密码'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 双重验证 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5" />
                  <span>双重验证</span>
                </CardTitle>
                <CardDescription>
                  为您的账户添加额外的安全保护
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">短信验证</h4>
                    <p className="text-sm text-gray-500">通过短信接收验证码</p>
                  </div>
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecurityData(prev => ({ ...prev, twoFactorEnabled: checked }))}
                  />
                </div>
                {securityData.twoFactorEnabled && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">
                      双重验证已启用。登录时需要输入发送到您手机的验证码。
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 通知设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>通知设置</span>
                </CardTitle>
                <CardDescription>
                  管理您接收通知的方式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">邮件通知</h4>
                    <p className="text-sm text-gray-500">接收重要更新和提醒</p>
                  </div>
                  <Switch
                    checked={securityData.emailNotifications}
                    onCheckedChange={(checked) => setSecurityData(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">短信通知</h4>
                    <p className="text-sm text-gray-500">接收紧急通知和验证码</p>
                  </div>
                  <Switch
                    checked={securityData.smsNotifications}
                    onCheckedChange={(checked) => setSecurityData(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}