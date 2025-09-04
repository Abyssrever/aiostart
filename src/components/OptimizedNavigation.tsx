'use client'

import React, { memo, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from './Navigation'

// 优化的导航组件，减少不必要的重新渲染
const OptimizedNavigation = memo(() => {
  const pathname = usePathname()
  const { user } = useAuth()

  // 使用 useMemo 缓存导航配置
  const navigationConfig = useMemo(() => ({
    currentPath: pathname,
    userRole: user?.roles?.[0], // 使用第一个角色
    userName: user?.name
  }), [pathname, user?.roles, user?.name])

  return <Navigation />
})

OptimizedNavigation.displayName = 'OptimizedNavigation'

export default OptimizedNavigation