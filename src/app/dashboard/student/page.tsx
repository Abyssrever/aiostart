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
import { StudentOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockStudentInfo = mockData.users.student
const mockOKRs = mockData.okrs
const mockChatSessions = mockData.chatSessions

function StudentDashboardContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'resources' | 'ai-history'>('overview')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const router = useRouter()

  // 检查URL参数来确定当前标签页
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'okr') {
      setSelectedView('overview')
    }
  }, [searchParams])

  // 判断是否显示OKR管理组件
  const showOKRManagement = searchParams.get('tab') === 'okr'

  // 计算总体进度（基于OKR数据）
  const overallProgress = Math.round(mockOKRs.reduce((sum, okr) => sum + okr.progress, 0) / mockOKRs.length)
  
  // 计算当前等级（基于GPA）
  const getCurrentLevel = (gpa: number) => {
    if (gpa >= 3.7) return '优秀'
    if (gpa >= 3.0) return '良好'
    if (gpa >= 2.5) return '中等'
    return '待提升'
  }

  return (
    <StudentOnlyRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 如果是OKR标签页，直接显示OKR管理组件 */}
          {showOKRManagement ? (
            <OKRManagement userRole="student" />
          ) : (
            <>
              {/* 视图切换器 */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                  {[
                    { key: 'overview', label: '学习概览' },
                    { key: 'analytics', label: '学习分析' },
                    { key: 'resources', label: '推荐资源' },
                    { key: 'ai-history', label: 'AI历史记录' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedView(tab.key as 'overview' | 'analytics' | 'resources' | 'ai-history')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedView === tab.key
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
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
                        <h1 className="text-2xl font-bold mb-2">欢迎回来，{mockStudentInfo.name}！</h1>
                        <p className="text-purple-100 mb-4">
                          {mockStudentInfo.major} · {mockStudentInfo.grade} · {mockStudentInfo.class}
                        </p>
                        <div className="flex items-center space-x-6">
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">总体进度</div>
                            <div className="text-xl font-bold">{overallProgress}%</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">坚持学习</div>
                            <div className="text-xl font-bold">40天</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-blue-100">GPA</div>
                            <div className="text-xl font-bold">{mockStudentInfo.gpa}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-purple-100">学分进度</div>
                        <div className="text-lg font-semibold">{mockStudentInfo.credits}/{mockStudentInfo.totalCredits}</div>
                        <Progress 
                          value={(mockStudentInfo.credits / mockStudentInfo.totalCredits) * 100} 
                          className="mt-2 w-32"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 学习统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">本周学习时长</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">36h</div>
                        <p className="text-sm text-green-600">较上周 +4h</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">完成任务</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">12/15</div>
                        <p className="text-sm text-blue-600">完成率 80%</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">学习连续天数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">23天</div>
                        <p className="text-sm text-purple-600">保持良好习惯！</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">AI对话次数</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{mockChatSessions.length}</div>
                        <p className="text-sm text-gray-600">本月总计</p>
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
                          onClick={() => router.push('/dashboard/student?tab=okr')}
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
                        {mockOKRs.slice(0, 3).map((okr) => (
                          <div key={okr.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{okr.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{okr.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <Badge className={
                                  okr.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }>
                                  {okr.priority === 'high' ? '高优先级' : '中优先级'}
                                </Badge>
                                <span className="text-sm text-gray-500">截止: {okr.deadline}</span>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-2xl font-bold text-gray-900">{okr.progress}%</div>
                              <Progress value={okr.progress} className="w-20 mt-1" />
                            </div>
                          </div>
                        ))}
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
                      <CardTitle>学习数据分析</CardTitle>
                      <CardDescription>
                        基于你的学习行为和成绩数据生成的个性化分析报告
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 学习时间趋势 */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">每周学习时长趋势</h3>
                          <div className="space-y-2">
                            {mockData.learningAnalytics.weeklyStudyTime.map((week, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{week.week}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${(week.hours / 50) * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{week.hours}h</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 科目进度 */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-900">各科目学习进度</h3>
                          <div className="space-y-3">
                            {mockData.learningAnalytics.subjectProgress.map((subject, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{subject.subject}</span>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline">{subject.grade}</Badge>
                                    <span className="text-sm text-gray-600">{subject.progress}%</span>
                                  </div>
                                </div>
                                <Progress value={subject.progress} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 能力雷达图 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>能力评估雷达图</CardTitle>
                      <CardDescription>
                        基于学习表现和项目完成情况的综合能力评估
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mockData.learningAnalytics.skillRadar.map((skill, index) => (
                          <div key={index} className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="transparent"
                                  strokeDasharray={`${2 * Math.PI * 36}`}
                                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - skill.score / 100)}`}
                                  className="text-blue-600"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold">{skill.score}</span>
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900">{skill.skill}</p>
                          </div>
                        ))}
                      </div>
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
                        <span className="mr-2">🎯</span>
                        个性化学习资源推荐
                      </CardTitle>
                      <CardDescription>
                        基于你的学习目标和进度，AI为你精选的学习资源
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockData.recommendedResources.map((resource) => (
                          <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                <span className="font-medium">⭐ {resource.rating}</span>
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

                            <Button className="w-full" size="sm">
                              开始学习
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI历史记录 */}
              {selectedView === 'ai-history' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <span className="mr-2">🤖</span>
                        AI对话历史记录
                      </CardTitle>
                      <CardDescription>
                        查看你与AI助手的所有对话记录，回顾学习过程中的问答
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mockChatSessions.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-6xl mb-4">🤖</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无AI对话记录</h3>
                          <p className="text-gray-600 mb-4">开始与AI助手对话，这里将显示你们的聊天历史</p>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            开始对话
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mockChatSessions.map((session) => (
                            <div key={session.id} className="border rounded-lg overflow-hidden">
                              <div 
                                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setSelectedSession(selectedSession === session.id ? null : session.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-medium text-gray-900">{session.title}</h3>
                                    <p className="text-sm text-gray-600">{session.messages.length} 条消息</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      {session.category}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{session.timestamp}</span>
                                    <div className={`transform transition-transform ${
                                      selectedSession === session.id ? 'rotate-180' : ''
                                    }`}>
                                      ▼
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {selectedSession === session.id && (
                                <div className="p-4 space-y-3 bg-white">
                                  {session.messages.map((message, index) => (
                                    <div key={index} className={`flex ${
                                      message.type === 'user' ? 'justify-end' : 'justify-start'
                                    }`}>
                                      <div className={`max-w-[80%] p-3 rounded-lg ${
                                        message.type === 'user' 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-100 text-gray-900'
                                      }`}>
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className={`text-xs mt-1 ${
                                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                          {message.timestamp}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
            }))
          )}
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