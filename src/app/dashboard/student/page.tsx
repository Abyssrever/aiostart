'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/Navigation'
import OKRManagementReal from '@/components/OKRManagementReal'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { StudentOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { OKRServiceFixed } from '@/lib/okr-service-fixed'
import { OKRServiceAPI } from '@/lib/okr-service-api'
import { OKRWithKeyResults } from '@/types/okr'

// 动态选择OKR服务 - 优先使用API服务，开发环境可回退到Fixed服务
const OKRService = process.env.NODE_ENV === 'development' ? OKRServiceFixed : OKRServiceAPI
import { ChatService, ChatSession } from '@/lib/chat-service'


function StudentDashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'chat' | 'resources'>('overview')
  const router = useRouter()
  const [okrs, setOkrs] = useState<OKRWithKeyResults[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 加载数据
  const loadDashboardData = async () => {
    if (!user?.id) return
    
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
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 检查URL参数来确定当前标签页，并在必要时刷新数据
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
  }, [searchParams, user?.id])

  // 监听视图切换，当切换到overview时刷新数据
  useEffect(() => {
    if (selectedView === 'overview' && user?.id && !searchParams.get('tab')) {
      loadDashboardData()
    }
  }, [selectedView, user?.id, searchParams])
  
  // 加载数据
  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  // 添加页面焦点监听，确保数据同步
  useEffect(() => {
    const handleFocus = () => {
      // 当页面重新获得焦点时，刷新数据（比如从其他标签页返回）
      if (user?.id && !searchParams.get('tab')) {
        loadDashboardData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user?.id, searchParams])

  // 判断是否显示OKR管理组件
  const showOKRManagement = searchParams.get('tab') === 'okr'

  // 计算总体进度（基于真实OKR数据）
  const overallProgress = okrs && okrs.length > 0 
    ? Math.round(okrs.reduce((sum, okr) => sum + (okr.progress || okr.progress_percentage || 0), 0) / okrs.length)
    : 0
    
  // 计算累计学习天数
  const getCumulativeStudyDays = () => {
    if (!user?.created_at) {
      // 如果没有创建时间，使用默认值（假设注册30天）
      return 30
    }
    try {
      // 计算从注册到现在的天数
      const registrationDate = new Date(user.created_at)
      const today = new Date()
      const diffTime = today.getTime() - registrationDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(1, diffDays) // 至少显示1天
    } catch (error) {
      console.error('计算累计学习天数失败:', error)
      return 30 // 默认显示30天
    }
  }
  
  if (loading) {
    return (
      <StudentOnlyRoute>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载仪表板数据中...</p>
              </div>
            </div>
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
                    { key: 'chat', label: 'AI对话', icon: '🤖' },
                    { key: 'resources', label: '推荐资源', icon: '🎯' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedView(tab.key as 'overview' | 'analytics' | 'chat' | 'resources')}
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
                            <div className="text-xl font-bold">{getCumulativeStudyDays()}天</div>
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

                  {/* 学习统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <div className="text-3xl font-bold text-gray-900">{chatSessions.length}</div>
                        <p className="text-sm text-gray-600">AI对话会话</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* OKR快速概览 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>我的OKR目标</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // 保存当前数据状态，以便返回时检查是否需要刷新
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
                      <div className="space-y-4">
                        {okrs.length === 0 ? (
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
                        {okrs.length > 3 && (
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* OKR类型分布 */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">目标类型分布</h3>
                          <div className="space-y-3">
                            {['personal', 'course', 'college'].map((category) => {
                              const categoryOKRs = okrs.filter(okr => okr.category === category)
                              const percentage = okrs.length > 0 ? (categoryOKRs.length / okrs.length) * 100 : 0
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
                              okrs.forEach(okr => {
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
                    </CardContent>
                  </Card>

                  {/* OKR完成质量分析 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>目标完成质量</CardTitle>
                      <CardDescription>
                        基于关键结果完成情况的目标质量评估
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {okrs.filter(okr => okr.keyResults && okr.keyResults.length > 0).slice(0, 3).map((okr) => {
                          const completedKRs = okr.keyResults.filter(kr => kr.status === 'completed').length
                          const totalKRs = okr.keyResults.length
                          const completionRate = totalKRs > 0 ? (completedKRs / totalKRs) * 100 : 0
                          
                          return (
                            <div key={okr.id} className="text-center">
                              <div className="relative w-24 h-24 mx-auto mb-3">
                                <svg className="w-24 h-24 transform -rotate-90">
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-200"
                                  />
                                  <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionRate / 100)}`}
                                    className={completionRate >= 80 ? 'text-green-500' : completionRate >= 60 ? 'text-yellow-500' : 'text-red-500'}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-sm font-bold">{Math.round(completionRate)}%</span>
                                </div>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">{okr.title}</h4>
                              <p className="text-xs text-gray-600">{completedKRs}/{totalKRs} 关键结果完成</p>
                            </div>
                          )
                        })}
                        {okrs.filter(okr => okr.keyResults && okr.keyResults.length > 0).length === 0 && (
                          <div className="col-span-3 text-center py-8">
                            <p className="text-gray-600">暂无关键结果数据</p>
                            <p className="text-sm text-gray-500">为OKR添加关键结果后可查看完成质量分析</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI助手记录 */}
              {selectedView === 'analytics' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>AI助手对话记录</CardTitle>
                      <CardDescription>
                        查看你与AI助手的互动历史和学习建议
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {chatSessions.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">🤖</div>
                            <p className="text-gray-600 mb-4">还没有AI对话记录</p>
                            <p className="text-sm text-gray-500">点击右下角的AI助手开始对话</p>
                          </div>
                        ) : (
                          chatSessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 mb-1">{session.title}</h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>类型: {session.session_type === 'general' ? '通用对话' : 
                                                session.session_type === 'okr_planning' ? 'OKR规划' :
                                                session.session_type === 'study_help' ? '学习辅助' : '职业指导'}</span>
                                    <span>消息: {session.message_count || 0}条</span>
                                    <span>{new Date(session.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <Badge className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {session.status === 'active' ? '活跃' : '已归档'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                        {chatSessions.length > 5 && (
                          <div className="text-center pt-4">
                            <Button variant="outline" size="sm">
                              查看更多对话记录
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* 基于OKR的学习建议 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">🎯</span>
                        个性化学习建议
                      </CardTitle>
                      <CardDescription>
                        根据你的OKR进度和完成情况，为你生成智能学习建议
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {okrs.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">📚</div>
                            <p className="text-gray-600 mb-4">还没有OKR目标</p>
                            <p className="text-sm text-gray-500 mb-4">创建OKR目标后，AI将为你生成个性化学习建议</p>
                            <Button onClick={() => {
                              sessionStorage.setItem('okr_page_timestamp', Date.now().toString())
                              router.push('/dashboard/student?tab=okr')
                            }}>
                              创建第一个OKR
                            </Button>
                          </div>
                        ) : (
                          okrs.map((okr) => {
                            const progress = okr.progress || okr.progress_percentage || 0
                            const needsAttention = progress < 30
                            const isOnTrack = progress >= 30 && progress < 80
                            const isExcellent = progress >= 80
                            
                            return (
                              <div key={okr.id} className="border rounded-lg p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">{okr.title}</h3>
                                    <div className="flex items-center space-x-2 mb-3">
                                      <Progress value={progress} className="flex-1" />
                                      <span className="text-sm font-medium">{progress}%</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={`p-4 rounded-lg ${
                                  needsAttention ? 'bg-red-50 border-l-4 border-l-red-500' :
                                  isOnTrack ? 'bg-yellow-50 border-l-4 border-l-yellow-500' :
                                  'bg-green-50 border-l-4 border-l-green-500'
                                }`}>
                                  <h4 className={`font-medium mb-2 ${
                                    needsAttention ? 'text-red-800' :
                                    isOnTrack ? 'text-yellow-800' :
                                    'text-green-800'
                                  }`}>
                                    {needsAttention ? '🚨 需要关注' :
                                     isOnTrack ? '⚡ 正常推进' :
                                     '🎉 表现优秀'}
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    {needsAttention && (
                                      <>
                                        <p>• 当前进度较慢，建议重新评估目标或增加投入时间</p>
                                        <p>• 可以尝试将大目标分解为更小的可执行步骤</p>
                                        <p>• 考虑寻求导师或同学的帮助和建议</p>
                                      </>
                                    )}
                                    {isOnTrack && (
                                      <>
                                        <p>• 进度良好，保持当前学习节奏</p>
                                        <p>• 可以考虑优化学习方法提高效率</p>
                                        <p>• 定期回顾和调整关键结果的具体指标</p>
                                      </>
                                    )}
                                    {isExcellent && (
                                      <>
                                        <p>• 进度优秀，已经建立了良好的学习习惯</p>
                                        <p>• 可以考虑设置更有挑战性的目标</p>
                                        <p>• 分享你的成功经验帮助其他同学</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {okr.keyResults && okr.keyResults.length > 0 && (
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-gray-700">关键结果建议:</h5>
                                    {okr.keyResults.map((kr) => {
                                      const krProgress = kr.progress || kr.progress_percentage || 0
                                      return (
                                        <div key={kr.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                          <span>{kr.title}</span>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">{kr.current_value}/{kr.target_value} {kr.unit}</span>
                                            <Badge className={krProgress >= 80 ? 'bg-green-100 text-green-800' : 
                                                            krProgress >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'}>
                                              {krProgress >= 80 ? '优秀' : krProgress >= 50 ? '正常' : '落后'}
                                            </Badge>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI对话记录 */}
              {selectedView === 'chat' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">🤖</span>
                        AI助手对话记录
                      </CardTitle>
                      <CardDescription>
                        查看你与AI助手的互动历史和学习建议
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {chatSessions.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">🤖</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有AI对话记录</h3>
                            <p className="text-gray-600 mb-6">点击右下角的AI助手开始对话，获取学习建议和答疑解惑</p>
                            <div className="flex justify-center space-x-4">
                              <div className="text-sm text-gray-500">
                                <p>📚 学习指导</p>
                                <p>🎯 目标规划</p>
                                <p>💡 问题解答</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* 对话统计 */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-blue-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600">{chatSessions.length}</div>
                                <div className="text-sm text-blue-800">总会话数</div>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600">
                                  {chatSessions.filter(s => s.status === 'active').length}
                                </div>
                                <div className="text-sm text-green-800">活跃会话</div>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                  {chatSessions.reduce((sum, s) => sum + (s.message_count || 0), 0)}
                                </div>
                                <div className="text-sm text-purple-800">总消息数</div>
                              </div>
                              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {new Set(chatSessions.map(s => s.session_type)).size}
                                </div>
                                <div className="text-sm text-yellow-800">对话类型</div>
                              </div>
                            </div>

                            {/* 对话列表 */}
                            <div className="space-y-3">
                              {chatSessions.map((session) => (
                                <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                                        <Badge className={
                                          session.session_type === 'general' ? 'bg-gray-100 text-gray-800' :
                                          session.session_type === 'okr_planning' ? 'bg-blue-100 text-blue-800' :
                                          session.session_type === 'study_help' ? 'bg-green-100 text-green-800' :
                                          'bg-purple-100 text-purple-800'
                                        }>
                                          {session.session_type === 'general' ? '通用对话' : 
                                           session.session_type === 'okr_planning' ? 'OKR规划' :
                                           session.session_type === 'study_help' ? '学习辅助' : 
                                           '职业指导'}
                                        </Badge>
                                        <Badge className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                          {session.status === 'active' ? '活跃' : '已归档'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                          <span className="font-medium">消息数:</span> {session.message_count || 0}条
                                        </div>
                                        <div>
                                          <span className="font-medium">创建时间:</span> {new Date(session.created_at).toLocaleDateString()}
                                        </div>
                                        <div>
                                          <span className="font-medium">最后活跃:</span> {
                                            session.last_message_at 
                                              ? new Date(session.last_message_at).toLocaleDateString()
                                              : '暂无'
                                          }
                                        </div>
                                        <div>
                                          <span className="font-medium">AI类型:</span> {
                                            session.session_type === 'okr_planning' ? 'OKR助手' : 
                                            session.session_type === 'study_help' ? '学习助手' :
                                            session.session_type === 'career_guidance' ? '职业助手' :
                                            session.ai_agent_type === 'student' ? '学生助手' : 
                                            session.ai_agent_type === 'teacher' ? '教师助手' : 
                                            '通用助手'
                                          }
                                        </div>
                                      </div>
                                    </div>
                                    <div className="ml-4 flex space-x-2">
                                      <Button variant="outline" size="sm">
                                        查看详情
                                      </Button>
                                      {session.status === 'active' && (
                                        <Button size="sm">
                                          继续对话
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 分页或加载更多 */}
                            {chatSessions.length >= 10 && (
                              <div className="text-center pt-4">
                                <Button variant="outline">
                                  加载更多对话记录
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 推荐资料 */}
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
                          },
                          {
                            id: '4',
                            title: 'Node.js后端开发',
                            description: '使用Node.js构建现代Web应用后端',
                            category: '后端开发',
                            difficulty: 'intermediate',
                            estimatedTime: '32小时',
                            rating: 4.6,
                            tags: ['Node.js', '后端', 'API设计'],
                            recommendReason: '全栈开发技能提升'
                          },
                          {
                            id: '5',
                            title: '项目管理基础',
                            description: '学习敏捷开发和项目管理方法',
                            category: '软技能',
                            difficulty: 'beginner',
                            estimatedTime: '16小时',
                            rating: 4.5,
                            tags: ['项目管理', '敏捷开发', '团队协作'],
                            recommendReason: '提升团队合作和项目执行能力'
                          },
                          {
                            id: '6',
                            title: 'Git版本控制实践',
                            description: '掌握Git和GitHub的专业使用方法',
                            category: '开发工具',
                            difficulty: 'beginner',
                            estimatedTime: '12小时',
                            rating: 4.8,
                            tags: ['Git', 'GitHub', '版本控制'],
                            recommendReason: '开发必备技能'
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
    <Suspense fallback={<div>Loading...</div>}>
      <StudentDashboardContent />
    </Suspense>
  )
}