'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/Navigation'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { AdminOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockAdminInfo = mockData.adminData.adminInfo
const mockCollegeOverview = mockData.adminData.collegeOverview
const mockGradeData = mockData.adminData.gradeData
const mockMajorData = mockData.adminData.majorData
const mockResourceData = mockData.adminData.resourceData
const mockAIRecommendations = mockData.adminData.aiRecommendations
const mockChatSessions = mockData.chatSessions

export default function AdminDashboard() {
  const { user } = useAuth()
  const [selectedView, setSelectedView] = useState<'overview' | 'grades' | 'majors' | 'resources' | 'ai-history'>('overview')
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const router = useRouter()

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'high': return <Badge className="bg-red-100 text-red-800">高负荷</Badge>
      case 'normal': return <Badge className="bg-green-100 text-green-800">正常</Badge>
      case 'low': return <Badge className="bg-blue-100 text-blue-800">低使用</Badge>
      default: return <Badge>未知</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-blue-500 bg-blue-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  return (
    <AdminOnlyRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 视图切换器 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'overview', label: '总览' },
              { key: 'grades', label: '年级分析' },
              { key: 'majors', label: '专业分析' },
              { key: 'resources', label: '资源管理' },
              { key: 'ai-history', label: 'AI历史记录' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedView(tab.key as 'overview' | 'grades' | 'majors' | 'resources' | 'ai-history')}
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

        {/* 学院整体概览 */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">在校学生总数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{mockCollegeOverview.totalStudents.toLocaleString()}</div>
                  <p className="text-sm text-green-600">教师: {mockCollegeOverview.totalTeachers}人</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">平均GPA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{mockCollegeOverview.averageGPA}</div>
                  <p className="text-sm text-blue-600">较去年 +0.08</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">就业率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{mockCollegeOverview.employmentRate}%</div>
                  <p className="text-sm text-green-600">毕业率: {mockCollegeOverview.graduationRate}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">OKR完成率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{mockCollegeOverview.averageOKRCompletion}%</div>
                  <Progress value={mockCollegeOverview.averageOKRCompletion} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* AI智能建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🤖</span>
                  AI智能分析与建议
                </CardTitle>
                <CardDescription>
                  基于全院数据分析的智能建议和优化方案
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAIRecommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${
                        getPriorityColor(rec.priority)
                      } ${selectedRecommendation === rec.id ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
                      onClick={() => setSelectedRecommendation(selectedRecommendation === rec.id ? null : rec.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {rec.priority === 'high' ? '高优先级' : '中优先级'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <p className="text-sm text-blue-600 mb-3">预期影响: {rec.impact}</p>
                      
                      {selectedRecommendation === rec.id && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-2">建议采取的行动：</h4>
                          <ul className="space-y-1">
                            {rec.actions.map((action, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <span className="mr-2 mt-0.5">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 年级分析视图 */}
        {selectedView === 'grades' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockGradeData.map((grade) => (
              <Card key={grade.grade}>
                <CardHeader>
                  <CardTitle>{grade.grade}</CardTitle>
                  <CardDescription>{grade.studentCount}名学生</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">平均GPA</p>
                      <p className="text-2xl font-bold">{grade.averageGPA}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">挂科率</p>
                      <p className="text-2xl font-bold text-red-600">{(100 - grade.passRate).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">OKR完成率</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">优秀率</span>
                      <span className="text-sm font-medium">{grade.excellentRate}%</span>
                    </div>
                    <Progress value={grade.excellentRate} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 专业分析视图 */}
        {selectedView === 'majors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockMajorData.map((major) => (
              <Card key={major.major}>
                <CardHeader>
                  <CardTitle>{major.major}</CardTitle>
                  <CardDescription>{major.studentCount}名学生</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">平均薪资</p>
                      <p className="text-xl font-bold">¥{major.averageSalary}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">就业率</p>
                      <p className="text-xl font-bold text-green-600">{major.employmentRate}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">主要就业企业</p>
                    <div className="flex flex-wrap gap-1">
                      {major.topEmployers.map((company) => (
                        <Badge key={company} variant="outline" className="text-xs">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 资源管理视图 */}
        {selectedView === 'resources' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>资源使用情况与优化建议</CardTitle>
                <CardDescription>实时监控学院各类资源的使用状况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockResourceData.map((resource, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{resource.resource}</h3>
                          <p className="text-sm text-gray-600">容量: {resource.capacity}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getUtilizationColor(resource.utilization)}`}>
                              {resource.utilization}%
                            </p>
                            <p className="text-xs text-gray-500">使用率</p>
                          </div>
                          {getStatusBadge(resource.status)}
                        </div>
                      </div>
                      <div className="mb-3">
                        <Progress value={resource.utilization} />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">AI建议: </span>
                          {resource.suggestion}
                        </p>
                      </div>
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
                  查看你与AI助手的所有对话记录，回顾管理过程中的问答
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
    </AdminOnlyRoute>
  )
}