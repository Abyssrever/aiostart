'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { signOut, user } = useAuth()

  const handleGoHome = () => {
    if (user?.roles.includes('admin')) {
      router.push('/dashboard/admin')
    } else if (user?.roles.includes('teacher')) {
      router.push('/dashboard/teacher')
    } else if (user?.roles.includes('student')) {
      router.push('/dashboard/student')
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            访问被拒绝
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            抱歉，您没有权限访问此页面。请联系管理员或返回到您的主页。
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={handleGoHome}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Home className="w-4 h-4 mr-2" />
              返回主页
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              重新登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}