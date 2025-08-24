'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { OKRServiceFixed } from '@/lib/okr-service-fixed'
import { OKRServiceAPI } from '@/lib/okr-service-api'
import { ChatService, ChatSession } from '@/lib/chat-service'
import { OKRWithKeyResults } from '@/types/okr'

// 动态选择OKR服务 - 优先使用API服务，开发环境可回退到Fixed服务
const OKRService = process.env.NODE_ENV === 'development' ? OKRServiceFixed : OKRServiceAPI

// 全局数据状态管理Hook
export function useStudentData() {
  const { user } = useAuth()
  const [okrs, setOkrs] = useState<OKRWithKeyResults[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<number>(0)

  // 加载所有学生数据
  const loadStudentData = useCallback(async (force = false) => {
    if (!user?.id) return
    
    // 避免频繁刷新（除非强制刷新）
    const now = Date.now()
    if (!force && now - lastRefresh < 2000) return

    setLoading(true)
    try {
      // 并行加载数据
      const [okrResult, chatResult, statsResult] = await Promise.all([
        OKRService.getUserOKRs(user.id),
        ChatService.getUserChatSessions(user.id),
        OKRService.getOKRStats(user.id)
      ])
      
      if (okrResult.data) setOkrs(okrResult.data)
      if (chatResult.data) setChatSessions(chatResult.data)
      if (statsResult.data) setStats(statsResult.data)
      
      setLastRefresh(now)
      console.log('学生数据已刷新')
    } catch (error) {
      console.error('加载学生数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, lastRefresh])

  // 初始加载数据
  useEffect(() => {
    if (user?.id) {
      loadStudentData(true)
    }
  }, [user?.id, loadStudentData])

  // 刷新统计数据（用于OKR操作后的快速同步）
  const refreshStats = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const [okrResult, statsResult] = await Promise.all([
        OKRService.getUserOKRs(user.id),
        OKRService.getOKRStats(user.id)
      ])
      
      if (okrResult.data) setOkrs(okrResult.data)
      if (statsResult.data) setStats(statsResult.data)
      
      console.log('统计数据已刷新')
    } catch (error) {
      console.error('刷新统计数据失败:', error)
    }
  }, [user?.id])

  // 提供外部触发刷新的方法
  const refresh = useCallback(() => {
    loadStudentData(true)
  }, [loadStudentData])

  return {
    okrs,
    chatSessions,
    stats,
    loading,
    refresh,
    refreshStats,
    loadStudentData
  }
}