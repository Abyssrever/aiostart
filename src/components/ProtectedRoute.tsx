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
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // 如果用户未登录，重定向到登录页面
      if (!user) {
        router.push(redirectTo)
        return
      }

      // 如果用户角色不在允许的角色列表中，重定向到对应角色的默认页面
      if (!allowedRoles.includes(user.role)) {
        switch (user.role) {
          case 'student':
            router.push('/dashboard')
            break
          case 'teacher':
            router.push('/teacher')
            break
          case 'admin':
            router.push('/admin')
            break
          default:
            router.push('/login')
        }
        return
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router])

  // 显示加载状态
  if (isLoading) {
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
  if (!user || !allowedRoles.includes(user.role)) {
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