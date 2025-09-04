'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import Navigation from '@/components/Navigation'
import OKRManagementReal from '@/components/OKRManagementReal'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { StudentOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useDataCache } from '@/hooks/useDataCache'
import { OKRServiceFixed } from '@/lib/okr-service-fixed'
import { OKRServiceAPI } from '@/lib/okr-service-api'
import { OKRWithKeyResults } from '@/types/okr'
import { ChatService, ChatSession } from '@/lib/chat-service'

// 动态选择OKR服务 - 优先使用API服务，开发环境可回退到Fixed服务
const OKRService = process.env.NODE_ENV === 'development' ? OKRServiceFixed : OKRServiceAPI

function StudentDashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'resources'>('overview')
  const router = useRouter()

  // 使用缓存Hook替代传统状态管理
  const {
    data: okrs,
    loading: okrsLoading,
    refresh: refreshOkrs
  } = useDataCache<OKRWithKeyResults[]>(
    `user-okrs-${user?.id}`,
    () => user?.id ? OKRService.getUserOKRs(user.id).then(result => result.data || []) : Promise.resolve([]),
    { ttl: 2 * 60 * 1000 } // 2分钟缓存
  )

  const {
    data: chatSessions,
    loading: chatLoading
  } = useDataCache<ChatSession[]>(
    `user-chats-${user?.id}`,
    () => user?.id ? ChatService.getUserChatSessions(user.id).then(result => result.data || []) : Promise.resolve([]),
    { ttl: 5 * 60 * 1000 } // 5分钟缓存
  )

  const {
    data: stats,
    loading: statsLoading
  } = useDataCache<any>(
    `user-stats-${user?.id}`,
    () => user?.id ? OKRService.getOKRStats(user.id).then(result => result.data || {}) : Promise.resolve({}),
    { ttl: 3 * 60 * 1000 } // 3分钟缓存
  )

  // 刷新所有数据的方法
  const loadDashboardData = useCallback(async () => {
    console.log('🔄 刷新仪表板数据')
    await Promise.all([
      refreshOkrs(),
      // 聊天和统计数据通常不需要频繁刷新
    ])
  }, [refreshOkrs])

  // 优化的URL参数处理 - 减少不必要的数据刷新
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'okr') {
      setSelectedView('overview')
    } else if (!tab && user?.id) {
      // 检查是否从OKR页面返回，如果是则刷新数据
      const lastOKRPageTimestamp = sessionStorage.getItem('okr_page_timestamp')
      if (lastOKRPageTimestamp) {
        // 清除标记并刷新数据
        sessionStorage.removeItem('okr_page_timestamp')
        console.log('从OKR页面返回，刷新总览数据')
        loadDashboardData()
      }
    }
  }, [searchParams, user?.id, loadDashboardData])

  // 防抖的页面焦点监听
  useEffect(() => {
    let focusTimeout: NodeJS.Timeout
    
    const handleFocus = () => {
      // 防抖处理，避免频繁刷新
      clearTimeout(focusTimeout)
      focusTimeout = setTimeout(() => {
        if (user?.id && !searchParams.get('tab')) {
          console.log('页面重新获得焦点，检查数据更新')
          // 只在数据可能过期时才刷新
          const lastRefresh = sessionStorage.getItem('last_dashboard_refresh')
          const now = Date.now()
          if (!lastRefresh || now - parseInt(lastRefresh) > 5 * 60 * 1000) { // 5分钟
            loadDashboardData()
            sessionStorage.setItem('last_dashboard_refresh', now.toString())
          }
        }
      }, 1000) // 1秒防抖
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearTimeout(focusTimeout)
    }
  }, [user?.id, searchParams, loadDashboardData])

  // 判断是否显示OKR管理组件
  const showOKRManagement = searchParams.get('tab') === 'okr'

  // 使用useMemo优化计算
  const overallProgress = useMemo(() => {
    if (!okrs || okrs.length === 0) return 0
    return Math.round(okrs.reduce((sum, okr) => sum + (okr.progress || okr.progress_percentage || 0), 0) / okrs.length)
  }, [okrs])
    
  // 计算累计学习天数
  const getCumulativeStudyDays = useMemo(() => {
    if (!user?.created_at) return 30
    try {
      const registrationDate = new Date(user.created_at)
      const today = new Date()
      const diffTime = today.getTime() - registrationDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(1, diffDays)
    } catch (error) {
      console.error('计算累计学习天数失败:', error)
      return 30
    }
  }, [user?.created_at])

  // 骨架屏组件
  const DashboardSkeleton = () => (
    <div className="space-y-6">
      {/* 欢迎横幅骨架屏 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 bg-white/20" />
            <Skeleton className="h-4 w-48 bg-white/20" />
            <div className="flex space-x-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/10 rounded-lg p-3 space-y-2">
                  <Skeleton className="h-3 w-16 bg-white/20" />
                  <Skeleton className="h-6 w-12 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 bg-white/20" />
            <Skeleton className="h-6 w-12 bg-white/20" />
            <Skeleton className="h-2 w-32 bg-white/20" />
          </div>
        </div>
      </div>

      {/* 统计卡片骨架屏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* OKR概览骨架屏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-2 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 检查是否需要显示骨架屏
  const isInitialLoading = okrsLoading && !okrs

  if (isInitialLoading) {
    return (
      <StudentOnlyRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <DashboardSkeleton />
          </div>
        </div>
      </StudentOnlyRoute>
    )
  }

  return (
    <StudentOnlyRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 如果是OKR标签页，直接显示OKR管理组件 */}
          {showOKRManagement ? (
            <OKRManagementReal userRole="student" onDataChange={loadDashboardData} />
          ) : (
            <>
              {/* 视图切换器 */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                  {[
                    { key: 'overview', label: '学习概览', icon: '📊' },
                    { key: 'analytics', label: '学习分析', icon: '📈' },
                    { key: 'resources', label: '推荐资源', icon: '🎯' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedView(tab.key as 'overview' | 'analytics' | 'resources')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                        selectedView === tab.key
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 学习概览 */}
              {selectedView === 'overview' && (
                <div className="space-y-6">
                  {/* 欢迎横幅 */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold mb-2">欢迎回来，{user?.name || '同学'}！</h1>
                        <p className="text-purple-100 mb-4">
                          {user?.major || '专业'} · {user?.grade || '年级'} · {user?.class_name || '班级'}
                        </p>
                        <div className="flex items-center space-x-6">
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">总体进度</div>
                            <div className="text-xl font-bold">{overallProgress}%</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">累计学习</div>
                            <div className="text-xl font-bold">{getCumulativeStudyDays}天</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">总OKR数</div>
                            <div className="text-xl font-bold">{stats?.totalOKRs || 0}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-purple-100">完成率</div>
                        <div className="text-lg font-semibold">{stats?.completionRate || 0}%</div>
                        <Progress 
                          value={stats?.completionRate || 0} 
                          className="mt-2 w-32"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 学习统计 - 带加载状态 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsLoading ? (
                      // 统计数据加载中的骨架屏
                      [1, 2, 3, 4].map(i => (
                        <Card key={i}>
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-20" />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">关键结果总数</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stats?.totalKeyResults || 0}</div>
                            <p className="text-sm text-green-600">已创建关键结果</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">完成任务</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stats?.completedOKRs || 0}/{stats?.totalOKRs || 0}</div>
                            <p className="text-sm text-blue-600">OKR完成情况</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">平均进度</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stats?.averageProgress || 0}%</div>
                            <p className="text-sm text-purple-600">所有OKR平均</p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">AI对话次数</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{chatSessions?.length || 0}</div>
                            <p className="text-sm text-gray-600">AI对话会话</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* OKR快速概览 - 带加载状态 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>我的OKR目标</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            sessionStorage.setItem('okr_page_timestamp', Date.now().toString())
                            router.push('/dashboard/student?tab=okr')
                          }}
                        >
                          管理OKR
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        当前活跃目标进度概览
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {okrsLoading ? (
                        // OKR数据加载中的骨架屏
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-64" />
                                <div className="flex space-x-4">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-4 w-24" />
                                </div>
                              </div>
                              <div className="ml-4 space-y-1">
                                <Skeleton className="h-8 w-12" />
                                <Skeleton className="h-2 w-20" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {!okrs || okrs.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 mb-2">📋</div>
                              <p className="text-gray-600 mb-4">还没有创建OKR目标</p>
                              <Button 
                                onClick={() => {
                                  sessionStorage.setItem('okr_page_timestamp', Date.now().toString())
                                  router.push('/dashboard/student?tab=okr')
                                }}
                                size="sm"
                              >
                                创建第一个OKR
                              </Button>
                            </div>
                          ) : (
                            okrs.slice(0, 3).map((okr) => (
                              <div key={okr.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">{okr.title}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{okr.description}</p>
                                  <div className="flex items-center mt-2 space-x-4">
                                    <Badge className={
                                      okr.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                      okr.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }>
                                      {okr.priority === 'high' ? '高优先级' : okr.priority === 'medium' ? '中优先级' : '低优先级'}
                                    </Badge>
                                    <Badge className={
                                      okr.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      okr.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }>
                                      {okr.status === 'completed' ? '已完成' : okr.status === 'active' ? '进行中' : okr.status}
                                    </Badge>
                                    <span className="text-sm text-gray-500">截止: {okr.end_date ? new Date(okr.end_date).toLocaleDateString() : '无'}</span>
                                  </div>
                                </div>
                                <div className="ml-4 text-right">
                                  <div className="text-2xl font-bold text-gray-900">{okr.progress || okr.progress_percentage || 0}%</div>
                                  <Progress value={okr.progress || okr.progress_percentage || 0} className="w-20 mt-1" />
                                  <div className="text-xs text-gray-500 mt-1">
                                    {okr.keyResults?.length || 0} 关键结果
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          {okrs && okrs.length > 3 && (
                            <div className="text-center pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  sessionStorage.setItem('okr_page_timestamp', Date.now().toString())
                                  router.push('/dashboard/student?tab=okr')
                                }}
                                size="sm"
                              >
                                查看全部 {okrs.length} 个OKR
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 学习分析 */}
              {selectedView === 'analytics' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>OKR分析报告</CardTitle>
                      <CardDescription>
                        基于你的目标设定和完成情况生成的个性化分析
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {okrsLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-3">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                  </div>
                                  <Skeleton className="h-2 w-full" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="space-y-2">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                  <Skeleton className="h-4 w-16" />
                                  <div className="flex items-center space-x-2">
                                    <Skeleton className="h-2 w-32" />
                                    <Skeleton className="h-4 w-8" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* OKR类型分布 */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">目标类型分布</h3>
                            <div className="space-y-3">
                              {['personal', 'course', 'college'].map((category) => {
                                const categoryOKRs = okrs?.filter(okr => okr.category === category) || []
                                const percentage = okrs && okrs.length > 0 ? (categoryOKRs.length / okrs.length) * 100 : 0
                                return (
                                  <div key={category} className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium">
                                        {category === 'personal' ? '个人目标' : 
                                         category === 'course' ? '课程目标' : '学院目标'}
                                      </span>
                                      <span className="text-sm text-gray-600">{categoryOKRs.length}个 ({Math.round(percentage)}%)</span>
                                    </div>
                                    <Progress value={percentage} />
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 月度OKR创建趋势 */}
                          <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">目标创建趋势</h3>
                            <div className="space-y-2">
                              {(() => {
                                const monthlyData: Record<string, number> = {}
                                okrs?.forEach(okr => {
                                  const month = new Date(okr.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
                                  monthlyData[month] = (monthlyData[month] || 0) + 1
                                })
                                const maxCount = Math.max(...Object.values(monthlyData), 1)
                                return Object.entries(monthlyData).slice(-6).map(([month, count]) => (
                                  <div key={month} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">{month}</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-purple-600 h-2 rounded-full" 
                                          style={{ width: `${(count / maxCount) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium">{count}个</span>
                                    </div>
                                  </div>
                                ))
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 推荐资源 */}
              {selectedView === 'resources' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">📚</span>
                        AI智能推荐资源
                      </CardTitle>
                      <CardDescription>
                        基于你的学习目标和兴趣，AI为你精选的学习资源（功能开发中）
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                          {
                            id: '1',
                            title: 'React开发实战指南',
                            description: '从基础到高级的React开发完整教程',
                            category: '前端开发',
                            difficulty: 'intermediate',
                            estimatedTime: '24小时',
                            rating: 4.8,
                            tags: ['React', 'JavaScript', 'Web开发'],
                            recommendReason: '基于你的编程学习目标推荐'
                          },
                          {
                            id: '2', 
                            title: 'TypeScript深度解析',
                            description: '掌握TypeScript核心概念和高级特性',
                            category: '编程语言',
                            difficulty: 'advanced',
                            estimatedTime: '18小时',
                            rating: 4.9,
                            tags: ['TypeScript', '类型系统', '前端'],
                            recommendReason: '适合有JavaScript基础的学习者'
                          },
                          {
                            id: '3',
                            title: '数据结构与算法',
                            description: '计算机科学核心基础课程',
                            category: '计算机基础',
                            difficulty: 'intermediate',
                            estimatedTime: '40小时',
                            rating: 4.7,
                            tags: ['算法', '数据结构', '编程思维'],
                            recommendReason: '提升编程思维和解决问题能力'
                          }
                        ].map((resource) => (
                          <div key={resource.id} className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                              </div>
                              <Badge className={
                                resource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                resource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {resource.difficulty === 'beginner' ? '初级' :
                                 resource.difficulty === 'intermediate' ? '中级' : '高级'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">类型</span>
                                <span className="font-medium">{resource.category}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">预估时长</span>
                                <span className="font-medium">{resource.estimatedTime}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">评分</span>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-sm ${i < Math.floor(resource.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                      ⭐
                                    </span>
                                  ))}
                                  <span className="ml-1 text-sm font-medium">{resource.rating}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {resource.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">推荐理由: </span>
                                {resource.recommendReason}
                              </p>
                            </div>

                            <div className="flex space-x-2">
                              <Button className="flex-1" size="sm">
                                开始学习
                              </Button>
                              <Button variant="outline" size="sm">
                                收藏
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                        <div className="flex items-center mb-2">
                          <span className="mr-2">🤖</span>
                          <h4 className="font-medium text-gray-900">AI功能开发中</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          未来这里将集成AI功能，根据你的OKR目标、学习进度和兴趣偏好，智能推荐最适合的学习资源和路径。
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 悬浮AI助手 */}
        <FloatingAIAssistant
          chatHistory={[]}
        />
      </div>
    </StudentOnlyRoute>
  )
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  )
}