'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 用户角色类型
export type UserRole = 'student' | 'teacher' | 'admin'

// 用户信息接口
export interface User {
  id: string
  username: string
  name: string
  role: UserRole
  avatar?: string
}

// 认证上下文接口
interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 预设测试账户
const TEST_USERS: User[] = [
  {
    id: '1',
    username: 'student',
    name: '张三',
    role: 'student',
    avatar: ''
  },
  {
    id: '2',
    username: 'teacher',
    name: '李老师',
    role: 'teacher',
    avatar: ''
  },
  {
    id: '3',
    username: 'admin',
    name: '管理员',
    role: 'admin',
    avatar: ''
  }
]

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 组件挂载时检查本地存储的用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem('currentUser')
      }
    }
    setIsLoading(false)
  }, [])

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 查找匹配的用户（简单验证：用户名和密码相同）
    const foundUser = TEST_USERS.find(
      u => u.username === username && username === password
    )
    
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('currentUser', JSON.stringify(foundUser))
      setIsLoading(false)
      return true
    }
    
    setIsLoading(false)
    return false
  }

  // 登出函数
  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 角色权限检查函数
export const hasPermission = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    student: 1,
    teacher: 2,
    admin: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// 根据角色获取可访问的路由
export const getAccessibleRoutes = (role: UserRole): string[] => {
  switch (role) {
    case 'student':
      return ['/dashboard', '/okr']
    case 'teacher':
      return ['/dashboard', '/okr', '/teacher']
    case 'admin':
      return ['/dashboard', '/okr', '/teacher', '/admin']
    default:
      return []
  }
}

// 根据角色获取显示名称
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'student':
      return '学生'
    case 'teacher':
      return '教师'
    case 'admin':
      return '管理员'
    default:
      return '未知'
  }
}