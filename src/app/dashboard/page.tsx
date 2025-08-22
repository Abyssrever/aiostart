'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) {
      return
    }

    // 如果用户未登录，重定向到登录页面
    if (!user) {
      router.replace('/login')
      return
    }
  }, [user, loading, router])

  // 如果正在加载或用户未登录，显示加载状态
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载仪表板...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentPage="/dashboard" 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <UnifiedDashboard activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  )
}
