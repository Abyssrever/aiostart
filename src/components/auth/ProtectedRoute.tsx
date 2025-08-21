'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { UserRole } from '@/types/auth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  redirectTo?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // 如果未认证，重定向到登录页
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // 如果需要特定角色且用户角色不匹配，重定向到无权限页面
      if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, user, loading, router, requiredRoles, redirectTo])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">验证用户身份中...</p>
        </div>
      </div>
    )
  }

  // 如果未认证或角色不匹配，不渲染内容（等待重定向）
  if (!isAuthenticated) {
    return null
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role as UserRole)) {
    return null
  }

  // 渲染受保护的内容
  return <>{children}</>
}

export default ProtectedRoute