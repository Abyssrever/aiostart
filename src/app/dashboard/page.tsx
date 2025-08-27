'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard页面: loading =', loading, ', user =', user ? '存在' : '不存在')
    
    // 等待认证状态加载完成
    if (loading) {
      console.log('Dashboard: 认证状态加载中，等待...')
      return
    }

    // 如果用户未登录，重定向到登录页面
    if (!user) {
      console.log('Dashboard: 用户未登录，重定向到登录页面')
      router.replace('/login')
      return
    }

    console.log('Dashboard: 用户已登录，角色:', user.roles)

    // 默认重定向到学生页面，不进行角色检查
    console.log('Dashboard: 默认重定向到学生页面')
    router.replace('/dashboard/student')
    
  }, [user, loading, router])

  // 显示加载状态
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到您的仪表板...</p>
      </div>
    </div>
  )
}
