'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('student' | 'teacher' | 'admin')[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['student', 'teacher', 'admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      console.log('ProtectedRoute: 检查权限，用户:', user?.name, '角色:', user?.roles, '允许角色:', allowedRoles)
      
      // 如果用户未登录，重定向到登录页面
      if (!user) {
        console.log('ProtectedRoute: 用户未登录，重定向到:', redirectTo)
        // 使用setTimeout避免在渲染过程中立即重定向
        setTimeout(() => {
          router.replace(redirectTo)
        }, 100)
        return
      }

      // 检查用户是否有允许的角色
      const hasAllowedRole = user.roles && user.roles.length > 0 && user.roles.some(role => allowedRoles.includes(role))
      console.log('ProtectedRoute: 角色检查结果:', hasAllowedRole)
      
      if (!hasAllowedRole) {
        console.log('ProtectedRoute: 用户角色不匹配，重定向到未授权页面')
        setTimeout(() => {
          router.replace('/unauthorized')
        }, 100)
        return
      }
      
      console.log('ProtectedRoute: 权限检查通过')
    }
  }, [user, loading, allowedRoles, redirectTo, router])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  // 如果用户未登录或角色不匹配，不渲染内容
  if (!user || !user.roles.some(role => allowedRoles.includes(role))) {
    return null
  }

  // 渲染受保护的内容
  return <>{children}</>
}

// 便捷的角色特定组件
export function StudentOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      {children}
    </ProtectedRoute>
  )
}

export function TeacherOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      {children}
    </ProtectedRoute>
  )
}

export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function TeacherAdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
      {children}
    </ProtectedRoute>
  )
}