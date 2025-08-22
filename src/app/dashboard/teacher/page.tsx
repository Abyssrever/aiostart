'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/Navigation'
import OKRManagement from '@/components/OKRManagement'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { TeacherOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockTeacherInfo = mockData.teacherData.teacherInfo
const mockClassOverview = mockData.teacherData.classOverview
const mockStudentAlerts = mockData.teacherData.studentAlerts
const mockKnowledgePoints = mockData.teacherData.knowledgePoints
const mockOKRDistribution = mockData.teacherData.okrDistribution
const mockChatSessions = mockData.chatSessions

function TeacherDashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedClass, setSelectedClass] = useState(mockTeacherInfo.classes[0])
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-history'>('overview')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const router = useRouter()

  // 检查URL参数来确定当前标签页
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'okr') {
      setActiveTab('overview')
    }
  }, [searchParams])

  // 判断是否显示OKR管理组件
  const showOKRManagement = searchParams.get('tab') === 'okr'

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return 'ℹ️'
      default: return '📋'
    }
  }

  return (
    <TeacherOnlyRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 如果是OKR标签页，直接显示OKR管理组件 */}
          {showOKRManagement ? (
            <OKRManagement userRole="teacher" />
          ) : (
            <>
              {/* 班级选择器 */}
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">选择班级：</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {mockTeacherInfo.classes.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 班级概览卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">班级总人数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{mockClassOverview.totalStudents}</div>
                    <p className="text-sm text-green-600">活跃学生: {mockClassOverview.activeStudents}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">平均OKR进度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{mockClassOverview.averageOKRProgress}%</div>
                    <Progress value={mockClassOverview.averageOKRProgress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">平均成绩</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{mockClassOverview.averageGrade}</div>
                    <p className="text-sm text-blue-600">较上月 +2.3</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">出勤率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{mockClassOverview.attendanceRate}%</div>
                    <p className="text-sm text-green-600">作业完成率: {mockClassOverview.assignmentCompletionRate}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* 功能标签页 */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'overview', label: '班级概览', icon: '📊' },
                      { id: 'ai-history', label: 'AI历史记录', icon: '🤖' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'ai-history')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* 班级概览内容 */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 学生预警列表 */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <span className="mr-2">🚨</span>
                          学生预警与干预建议
                        </CardTitle>
                        <CardDescription>
                          AI自动识别需要关注的学生，并提供个性化干预建议
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockStudentAlerts.map((alert) => (
                            <div 
                              key={alert.id} 
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                selectedAlert === alert.id ? 'ring-2 ring-green-500' : 'hover:shadow-md'
                              }`}
                              onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {alert.studentName} ({alert.studentId})
                                      </h3>
                                      <p className="text-sm text-gray-600">日期: {alert.date}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-800 mb-2">{alert.message}</p>
                                  
                                  {selectedAlert === alert.id && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                      <h4 className="font-medium text-green-800 mb-2">AI建议的干预措施：</h4>
                                      <ul className="space-y-1">
                                        <li className="text-sm text-green-700 flex items-start">
                                          <span className="mr-2 mt-0.5">•</span>
                                          根据学生情况制定个性化学习计划
                                        </li>
                                        <li className="text-sm text-green-700 flex items-start">
                                          <span className="mr-2 mt-0.5">•</span>
                                          安排一对一辅导或同伴互助
                                        </li>
                                        <li className="text-sm text-green-700 flex items-start">
                                          <span className="mr-2 mt-0.5">•</span>
                                          定期跟踪学习进度并及时调整策略
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <Badge className={getSeverityColor(alert.severity)}>
                                  {alert.severity === 'high' ? '高优先级' : 
                                   alert.severity === 'medium' ? '中优先级' : '低优先级'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 右侧统计面板 */}
                  <div className="space-y-6">
                    {/* OKR进度分布 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">OKR进度分布</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockOKRDistribution.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                <span className="text-sm text-gray-700">{item.range}</span>
                              </div>
                              <span className="text-sm font-medium">{item.count}人</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 知识点掌握情况 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">知识点掌握情况</CardTitle>
                        <CardDescription>需要重点关注的知识点</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockKnowledgePoints.map((point, index) => (
                            <div key={index}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">{point.name}</span>
                                <span className="text-sm text-gray-600">{point.masteryRate}%</span>
                              </div>
                              <Progress value={point.masteryRate} className="mb-1" />
                              <p className="text-xs text-red-600">{point.strugglingCount}名学生需要帮助</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* AI历史记录 */}
              {activeTab === 'ai-history' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">AI对话历史</h3>
                        <span className="text-sm text-gray-500">{mockChatSessions.length} 个会话</span>
                      </div>
                    </div>
                    
                    {mockChatSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-3">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.524A11.956 11.956 0 010 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-lg">还没有对话记录</p>
                        <p className="text-gray-400 text-sm mt-1">开始与AI助手对话吧</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {mockChatSessions.map((session) => (
                          <div 
                            key={session.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 group"
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-150 truncate">
                                  {session.title}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {session.lastMessage}
                                </p>
                                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                                  <span>{new Date(session.timestamp).toLocaleDateString('zh-CN', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                  <span>{session.messageCount} 条消息</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    {session.category}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* 悬浮AI助手 */}
        <FloatingAIAssistant
          chatHistory={mockChatSessions.flatMap(session =>
          session.messages.map(msg => ({
          ...msg,
          id: msg.id?.toString() || crypto.randomUUID(),
          type: msg.type as "user" | "ai",
        })))}/>
         
         {/* 对话详情弹窗 */}
         {selectedSession && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
               {/* 弹窗头部 */}
               <div className="flex items-center justify-between p-6 border-b border-gray-200">
                 <div>
                   <h2 className="text-xl font-semibold text-gray-900">{selectedSession.title}</h2>
                   <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                     <span>{new Date(selectedSession.timestamp).toLocaleDateString('zh-CN', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric',
                       hour: '2-digit',
                       minute: '2-digit'
                     })}</span>
                     <span>{selectedSession.messageCount} 条消息</span>
                     <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                       {selectedSession.category}
                     </span>
                   </div>
                 </div>
                 <button
                   onClick={() => setSelectedSession(null)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                 >
                   <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               {/* 对话内容 */}
               <div className="flex-1 overflow-y-auto p-6">
                 <div className="space-y-6">
                   {selectedSession.messages.map((message: any) => (
                     <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                         <div className="flex items-center mb-2">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                             message.type === 'user' ? 'bg-blue-500' : 'bg-purple-500'
                           }`}>
                             {message.type === 'user' ? 'U' : 'AI'}
                           </div>
                           <span className="ml-3 text-sm text-gray-500">
                             {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                               hour: '2-digit',
                               minute: '2-digit'
                             })}
                           </span>
                         </div>
                         <div className={`p-4 rounded-lg ${
                           message.type === 'user' 
                             ? 'bg-blue-500 text-white' 
                             : 'bg-gray-100 text-gray-900'
                         }`}>
                           <div className="text-sm whitespace-pre-wrap leading-relaxed">
                             {message.content}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
               
               {/* 弹窗底部 */}
               <div className="p-6 border-t border-gray-200 bg-gray-50">
                 <div className="flex items-center justify-between">
                   <div className="text-sm text-gray-500">
                     共 {selectedSession.messageCount} 条消息
                   </div>
                   <button
                     onClick={() => setSelectedSession(null)}
                     className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-150"
                   >
                     关闭
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </TeacherOnlyRoute>
  )
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeacherDashboardContent />
    </Suspense>
  )
}
