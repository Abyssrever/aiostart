import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/lib/supabase'

/**
 * 权限缓存Hook - 避免重复计算用户权限
 * 只有在用户或角色变化时才重新计算
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth()

  const permissions = useMemo(() => {
    if (!user || !isAuthenticated) {
      return {
        hasRole: () => false,
        canAccess: () => false,
        isStudent: false,
        isTeacher: false,
        isAdmin: false,
        userRoles: []
      }
    }

    const userRoles = user.roles || []
    
    return {
      // 检查是否有特定角色
      hasRole: (role: UserRole) => userRoles.includes(role),
      
      // 检查是否能访问特定页面
      canAccess: (allowedRoles: UserRole[]) => 
        userRoles.some(role => allowedRoles.includes(role)),
      
      // 快速角色检查
      isStudent: userRoles.includes('student'),
      isTeacher: userRoles.includes('teacher'),
      isAdmin: userRoles.includes('admin'),
      
      // 用户角色列表
      userRoles
    }
  }, [user?.roles, isAuthenticated])

  return permissions
}

/**
 * 页面级权限检查Hook
 * 用于替代ProtectedRoute组件中的重复逻辑
 */
export function usePagePermissions(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth()
  const permissions = usePermissions()

  const canAccessPage = useMemo(() => {
    if (loading) return null // 还在加载中
    if (!user) return false // 未登录
    return permissions.canAccess(allowedRoles)
  }, [loading, user, permissions, allowedRoles])

  return {
    canAccess: canAccessPage,
    loading,
    user,
    permissions
  }
}