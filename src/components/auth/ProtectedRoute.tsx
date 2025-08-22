'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  allowedRoles, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    // 如果用户未登录，重定向到登录页
    if (!user) {
      router.push(redirectTo)
      return
    }

    // 检查角色权限
    let hasPermission = true

    if (requiredRole) {
      hasPermission = hasRole(requiredRole)
    } else if (allowedRoles && allowedRoles.length > 0) {
      hasPermission = allowedRoles.some(role => hasRole(role))
    }

    if (!hasPermission) {
      // 根据用户角色重定向到相应的仪表板
      const userRoles = user.roles
      if (userRoles.includes('admin')) {
        router.push('/dashboard/admin')
      } else if (userRoles.includes('teacher')) {
        router.push('/dashboard/teacher')
      } else if (userRoles.includes('student')) {
        router.push('/dashboard/student')
      } else {
        router.push('/auth')
      }
      return
    }

    setIsAuthorized(true)
  }, [user, loading, requiredRole, allowedRoles, hasRole, router, redirectTo])

  // 显示加载状态
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 渲染受保护的内容
  return <>{children}</>
}

// 角色检查组件
interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  allowedRoles, 
  fallback = null 
}: RoleGuardProps) {
  const { user, hasRole } = useAuth()

  if (!user) {
    return <>{fallback}</>
  }

  let hasPermission = true

  if (requiredRole) {
    hasPermission = hasRole(requiredRole)
  } else if (allowedRoles && allowedRoles.length > 0) {
    hasPermission = allowedRoles.some(role => hasRole(role))
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export default ProtectedRoute