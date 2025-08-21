'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  User,
  GraduationCap,
  Shield,
  Target,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Home
} from 'lucide-react'

interface NavigationProps {
  currentRole: 'student' | 'teacher' | 'admin'
  currentPage?: string
}

export default function Navigation({ currentRole, currentPage }: NavigationProps) {
  const router = useRouter()
  const [role, setRole] = useState(currentRole)

  const roleConfig = {
    student: {
      label: '学生',
      icon: User,
      color: 'bg-blue-500',
      routes: [
        { path: '/dashboard', label: '个人中心', icon: Home },
        { path: '/okr', label: 'OKR管理', icon: Target },
        { path: '/chat', label: 'AI助手', icon: MessageSquare },
      ]
    },
    teacher: {
      label: '教师',
      icon: GraduationCap,
      color: 'bg-green-500',
      routes: [
        { path: '/teacher', label: '教师仪表盘', icon: BarChart3 },
        { path: '/okr', label: 'OKR管理', icon: Target },
        { path: '/chat', label: 'AI助手', icon: MessageSquare },
      ]
    },
    admin: {
      label: '管理员',
      icon: Shield,
      color: 'bg-purple-500',
      routes: [
        { path: '/admin', label: '管理仪表盘', icon: BarChart3 },
        { path: '/okr', label: 'OKR管理', icon: Target },
        { path: '/settings', label: '系统设置', icon: Settings },
      ]
    }
  }

  const currentConfig = roleConfig[role]
  const CurrentRoleIcon = currentConfig.icon

  const handleRoleSwitch = (newRole: 'student' | 'teacher' | 'admin') => {
    setRole(newRole)
    const targetRoute = roleConfig[newRole].routes[0].path
    router.push(targetRoute)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleLogout = () => {
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
            const isActive = currentPage === route.path || 
              (route.path === '/dashboard' && currentPage === '/') ||
              (route.path === '/teacher' && currentPage === '/teacher') ||
              (route.path === '/admin' && currentPage === '/admin')
            
            return (
              <Button
                key={route.path}
                variant={isActive ? 'default' : 'ghost'}
                className="flex items-center space-x-2"
                onClick={() => handleNavigation(route.path)}
              >
                <Icon className="w-4 h-4" />
                <span>{route.label}</span>
              </Button>
            )
          })}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {/* Role Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <div className={`w-6 h-6 ${currentConfig.color} rounded-full flex items-center justify-center`}>
                  <CurrentRoleIcon className="w-3 h-3 text-white" />
                </div>
                <span>{currentConfig.label}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>切换角色</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(roleConfig).map(([roleKey, config]) => {
                const Icon = config.icon
                return (
                  <DropdownMenuItem
                    key={roleKey}
                    onClick={() => handleRoleSwitch(roleKey as 'student' | 'teacher' | 'admin')}
                    className="flex items-center space-x-2"
                  >
                    <div className={`w-4 h-4 ${config.color} rounded-full flex items-center justify-center`}>
                      <Icon className="w-2 h-2 text-white" />
                    </div>
                    <span>{config.label}</span>
                    {roleKey === role && (
                      <Badge variant="secondary" className="ml-auto text-xs">当前</Badge>
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="hidden md:block">张三</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center space-x-2">
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
            const isActive = currentPage === route.path || 
              (route.path === '/dashboard' && currentPage === '/') ||
              (route.path === '/teacher' && currentPage === '/teacher') ||
              (route.path === '/admin' && currentPage === '/admin')
            
            return (
              <Button
                key={route.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="flex items-center space-x-1 whitespace-nowrap"
                onClick={() => handleNavigation(route.path)}
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