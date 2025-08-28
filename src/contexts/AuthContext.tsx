'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, UserProfile, UserRole } from '@/lib/supabase'

// 用户信息接口
export interface User {
  id: string
  email: string
  name: string
  roles: UserRole[]
  avatar?: string
  student_id?: string
  grade?: number
  major?: string
  class_name?: string
  created_at?: string
  updated_at?: string
}

// 认证上下文接口
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithOtp: (email: string, token: string) => Promise<{ error?: string }>
  sendOtp: (email: string) => Promise<{ error?: string }>
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>
  signInDirectly: (email: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, userData: { name: string; student_id?: string; role?: UserRole }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  getUserRoles: () => UserRole[]
  isAuthenticated: boolean
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取用户角色 - 简化版本，直接从用户表获取
  const fetchUserRoles = async (userId: string): Promise<UserRole[]> => {
    try {
      console.log('开始获取用户角色，用户ID:', userId)
      
      // 直接从用户表获取角色
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      console.log('用户角色查询结果:', { data, error })

      if (error) {
        console.error('获取用户角色失败:', error)
        return ['student']
      }

      if (!data || !data.role) {
        console.log('用户没有分配角色，返回默认学生角色')
        return ['student']
      }

      const role = data.role as UserRole
      console.log('获取到的用户角色:', role)
      return [role]
    } catch (error) {
      console.error('获取用户角色异常:', error)
      return ['student']
    }
  }

  // 获取用户资料 - 优化版本，只选择必要字段
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, name, role, avatar_url, student_id, grade, major, class_name, created_at')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('获取用户资料失败:', profileError)
        return null
      }

      // 直接从用户资料中获取角色
      const role = profile.role as UserRole || 'student'
      const roles = [role]
      const userProfile = { ...profile, roles }
      
      console.log('用户资料获取成功，角色:', roles)
      
      // 设置用户信息
      const userData: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        roles,
        avatar: profile.avatar_url || undefined,
        student_id: profile.student_id || undefined,
        grade: profile.grade || undefined,
        major: profile.major || undefined,
        class_name: profile.class_name || undefined,
        created_at: profile.created_at || undefined
      }
      
      setUser(userData)
      return userProfile
    } catch (error) {
      console.error('获取用户资料异常:', error)
      return null
    }
  }

  // 发送OTP验证码
  const sendOtp = async (email: string) => {
    try {
      console.log('发送验证码到邮箱:', email)
      
      // 调用 Next.js API 路由发送验证码
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('发送验证码失败:', data)
        return { error: data.error || '发送验证码失败，请稍后重试' }
      }

      console.log('验证码发送成功')
      return {}
    } catch (error) {
      console.error('发送验证码异常:', error)
      return { error: '发送验证码失败，请稍后重试' }
    }
  }

  // 发送Magic Link邮箱验证链接
  const signInWithMagicLink = async (email: string) => {
    try {
      // 统一处理邮箱：转小写并去除空格
      const normalizedEmail = email.trim().toLowerCase()
      console.log('开始登录，原始邮箱:', email, '处理后邮箱:', normalizedEmail)
      
      // 检查用户是否存在于数据库中
      console.log('发送查询请求，参数:', { table: 'users', select: 'email', filter: `email=eq.${normalizedEmail}` })
      
      const queryResult = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)

      console.log('Supabase原始返回值:', JSON.stringify(queryResult, null, 2))
      console.log('返回数据类型:', typeof queryResult.data, '数据内容:', queryResult.data)
      console.log('错误信息:', queryResult.error)

      const { data: existingUsers, error: queryError } = queryResult

      if (queryError) {
        console.error('查询用户时出错:', queryError.message || queryError)
        return { error: '查询用户信息失败' }
      }

      if (!existingUsers || existingUsers.length === 0) {
        console.log('用户不存在于数据库中，查询邮箱:', normalizedEmail)
        return { error: '该邮箱未注册，请联系管理员' }
      }
      
      // 对于数据库中存在的邮箱，调用 sendOtp 发送真实验证码
      console.log('邮箱存在于数据库中，发送验证码')
      return await sendOtp(normalizedEmail)
    } catch (error) {
      console.error('signInWithMagicLink错误:', error)
      return { error: '发送验证邮件失败，请稍后重试' }
    }
  }

  // 使用OTP验证码登录
  const signInWithOtp = async (email: string, token: string) => {
    try {
      console.log('验证验证码，邮箱:', email, '验证码:', token)
      
      // 调用 Next.js API 路由验证验证码
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          code: token.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('验证验证码失败:', data)
        return { error: data.error || '验证失败，请稍后重试' }
      }

      if (!data?.success || !data?.user) {
        return { error: '验证失败，请重试' }
      }

      // 设置用户登录状态
      const userInfo = data.user
      const userData: User = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        roles: [userInfo.role as UserRole],
        avatar: userInfo.avatar_url || undefined,
        student_id: userInfo.student_id || undefined,
        grade: userInfo.grade || undefined,
        major: userInfo.major || undefined,
        class_name: userInfo.class_name || undefined
      }
      
      console.log('验证码验证成功，设置用户状态:', userData)
      setUser(userData)
      return {}
    } catch (error) {
      console.error('验证验证码异常:', error)
      return { error: '验证失败，请稍后重试' }
    }
  }

  // 直接登录（临时跳过验证）
  const signInDirectly = async (email: string) => {
    try {
      // 检查用户是否存在于数据库中
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userCheckError || !existingUser) {
        return { error: '该邮箱未注册，请联系管理员' }
      }

      // 直接从用户数据中获取角色
      const role = existingUser.role as UserRole || 'student'
      const roles = [role]
      console.log('直接登录用户角色:', roles)
      
      // 直接设置用户登录状态
      const userData: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        roles,
        avatar: existingUser.avatar_url || undefined,
        student_id: existingUser.student_id || undefined,
        grade: existingUser.grade || undefined,
        major: existingUser.major || undefined,
        class_name: existingUser.class_name || undefined
      }
      
      // 设置用户状态并确保loading状态正确
      setUser(userData)
      
      // 确保loading状态正确设置
      setTimeout(() => {
        setLoading(false)
      }, 100)
      
      return {}
    } catch (error) {
      return { error: '登录失败，请稍后重试' }
    }
  }

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: 开始登录，邮箱:', email)
      
      // 直接使用Supabase客户端登录，确保session正确设置
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (authError) {
        console.error('AuthContext: Supabase登录失败:', authError)
        
        if (authError.message.includes('Invalid login credentials')) {
          return { error: '邮箱或密码错误，请检查后重试' }
        } else if (authError.message.includes('Email not confirmed')) {
          return { error: '请先验证您的邮箱后再登录' }
        } else {
          return { error: '登录失败：' + authError.message }
        }
      }
      
      if (!authData.user || !authData.session) {
        return { error: '登录失败，请稍后重试' }
      }
      
      console.log('AuthContext: Supabase登录成功，用户ID:', authData.user.id)
      
      // 设置session - 这会触发 onAuthStateChange
      setSession(authData.session)
      
      // 并行获取用户资料，不等待完成
      fetchUserProfile(authData.user.id).then(() => {
        console.log('AuthContext: 用户资料获取完成')
      }).catch((profileError) => {
        console.error('AuthContext: 用户资料获取失败:', profileError)
        // 即使资料获取失败，也继续登录流程
      })
      
      // 立即返回成功，不等待用户资料
      return {}
    } catch (error) {
      console.error('AuthContext: 登录异常:', error)
      return { error: '登录失败，请稍后重试' }
    }
  }

  // 注册
  const signUp = async (email: string, password: string, userData: { name: string; student_id?: string; role?: UserRole }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: userData.name,
            student_id: userData.student_id
          })

        if (profileError) {
          console.error('创建用户资料失败:', profileError)
          return { error: '注册失败，请稍后重试' }
        }

        // 分配默认角色（学生）
        const { data: studentRole } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'student')
          .single()

        if (studentRole) {
          await supabase
            .from('user_roles')
            .insert({
              user_id: data.user.id,
              role_id: studentRole.id
            })
        }
      }

      return {}
    } catch (error) {
      return { error: '注册失败，请稍后重试' }
    }
  }

  // 登出
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // 检查用户是否有特定角色
  const hasRole = (role: UserRole): boolean => {
    return user?.roles?.includes(role) || false
  }

  // 获取用户所有角色
  const getUserRoles = (): UserRole[] => {
    return user?.roles || []
  }

  useEffect(() => {
    let mounted = true
    
    // 获取初始会话
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: 开始初始化认证状态')
        setLoading(true)
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        console.log('AuthContext: 获取到会话:', session ? '存在' : '不存在')
        setSession(session)
        
        if (session?.user) {
          console.log('AuthContext: 用户已登录，并行获取用户资料')
          // 立即设置loading为false，并行获取用户资料
          setLoading(false)
          fetchUserProfile(session.user.id).catch(error => {
            console.error('初始化时获取用户资料失败:', error)
          })
        } else {
          console.log('AuthContext: 用户未登录')
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        }
        
        console.log('AuthContext: 认证状态初始化完成')
      } catch (error) {
        console.error('初始化认证状态失败:', error)
        if (mounted) {
          setUser(null)
          setUserProfile(null)
          setSession(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // 监听认证状态变化
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('AuthContext: 认证状态变化:', event, session ? '有会话' : '无会话')
      
      setSession(session)
      
      if (session?.user) {
        console.log('AuthContext: 会话变化 - 用户已登录')
        await fetchUserProfile(session.user.id)
      } else {
        console.log('AuthContext: 会话变化 - 用户未登录')
        setUser(null)
        setUserProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithOtp,
    sendOtp,
    signInWithMagicLink,
    signInDirectly,
    signUp,
    signOut,
    hasRole,
    getUserRoles,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 权限检查函数
export const hasPermission = (userRoles: UserRole[], requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    'student': 1,
    'teacher': 2,
    'admin': 3
  }
  
  return userRoles.some(role => roleHierarchy[role] >= roleHierarchy[requiredRole])
}

// 获取用户可访问的路由
export const getAccessibleRoutes = (roles: UserRole[]): string[] => {
  const allRoutes = new Set<string>()
  
  const routesByRole = {
    'student': ['/dashboard/student', '/profile', '/courses'],
    'teacher': ['/dashboard/teacher', '/profile', '/courses', '/students'],
    'admin': ['/dashboard/admin', '/profile', '/courses', '/students', '/teachers', '/settings']
  }
  
  roles.forEach(role => {
    routesByRole[role]?.forEach(route => allRoutes.add(route))
  })
  
  return Array.from(allRoutes)
}

// 获取角色显示名称
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    'student': '学生',
    'teacher': '教师',
    'admin': '管理员'
  }
  
  return roleNames[role] || role
}