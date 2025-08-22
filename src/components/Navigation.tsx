'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  GraduationCap,
  Shield,
  Target,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Home
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NavigationProps {
  currentPage?: string
}

export default function Navigation({ currentPage }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, isAuthenticated } = useAuth()

  // 如果未认证，不显示导航栏
  if (!isAuthenticated || !user) {
    return null
  }

  const roleConfig = {
    student: {
      label: '学生',
      icon: User,
      color: 'bg-blue-500',
      routes: [
        { path: '/dashboard', label: '总览', icon: Home, type: 'page' },
        { path: 'okr', label: 'OKR管理', icon: Target, type: 'tab' },
      ]
    },
    teacher: {
      label: '教师',
      icon: GraduationCap,
      color: 'bg-green-500',
      routes: [
        { path: '/dashboard/teacher', label: '管理仪表盘', icon: BarChart3, type: 'page' },
        { path: 'okr', label: 'OKR管理', icon: Target, type: 'tab' },
      ]
    },
    admin: {
      label: '管理员',
      icon: Shield,
      color: 'bg-purple-500',
      routes: [
        { path: '/dashboard/admin', label: '管理仪表盘', icon: BarChart3, type: 'page' },
        { path: 'okr', label: 'OKR管理', icon: Target, type: 'tab' },
      ]
    }
  }

  // 根据用户角色优先级确定当前配置
  const getCurrentConfig = () => {
    if (user.roles.includes('admin')) {
      return roleConfig.admin
    } else if (user.roles.includes('teacher')) {
      return roleConfig.teacher
    } else if (user.roles.includes('student')) {
      return roleConfig.student
    } else {
      return roleConfig.student // 默认配置
    }
  }
  
  const currentConfig = getCurrentConfig()
  const CurrentRoleIcon = currentConfig.icon

  // 检查当前路径是否匹配导航项
  const isActiveRoute = (routePath: string) => {
    // 使用 pathname 而不是 currentPage prop
    const currentPath = pathname || currentPage || '/'
    
    // 精确匹配
    if (currentPath === routePath) {
      return true
    }
    
    // 特殊匹配规则
    if (routePath === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) {
      return true
    }
    
    // 子路径匹配
    if (routePath !== '/' && currentPath.startsWith(routePath)) {
      return true
    }
    
    return false
  }

  const handleNavigation = (routePath: string, e?: React.MouseEvent) => {
    // 阻止默认行为，确保不会在新窗口打开
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // 找到对应的路由配置
    const route = currentConfig.routes.find(r => r.path === routePath)
    if (!route) return
    
    if (route.type === 'page') {
      // 页面跳转
      router.push(route.path)
    } else if (route.type === 'tab') {
      // 标签页切换 - 通过URL参数或事件通知父组件
      const currentPath = pathname
      if (currentPath.includes('/dashboard/student')) {
        router.push('/dashboard/student?tab=okr')
      } else if (currentPath.includes('/dashboard/teacher')) {
        router.push('/dashboard/teacher?tab=okr')
      } else if (currentPath.includes('/dashboard/admin')) {
        router.push('/dashboard/admin?tab=okr')
      } else {
        // 默认跳转到学生页面的OKR标签
        router.push('/dashboard/student?tab=okr')
      }
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">启</span>
            </div>
            <span className="text-xl font-bold text-gray-900">启明星平台</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-1">
          {currentConfig.routes.map((route) => {
            const Icon = route.icon
            const isActive = isActiveRoute(route.path)
            
            return (
              <Button
                key={route.path}
                variant="ghost"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={(e) => handleNavigation(route.path, e)}
              >
                <Icon className="w-4 h-4" />
                <span>{route.label}</span>
              </Button>
            )
          })}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Role Display Button (Non-clickable) */}
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 cursor-default hover:bg-gray-50"
            disabled
          >
            <div className={`w-6 h-6 ${currentConfig.color} rounded-full flex items-center justify-center`}>
              <CurrentRoleIcon className="w-3 h-3 text-white" />
            </div>
            <span>{currentConfig.label}</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <span className="hidden md:block">{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-gray-500">{currentConfig.label}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>个人设置</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {currentConfig.routes.map((route) => {
            const Icon = route.icon
            const isActive = isActiveRoute(route.path)
            
            return (
              <Button
                key={route.path}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 whitespace-nowrap text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={(e) => handleNavigation(route.path, e)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{route.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}