'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/Navigation'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockTeacherInfo = mockData.teacherData.teacherInfo
const mockClassOverview = mockData.teacherData.classOverview
const mockStudentAlerts = mockData.teacherData.studentAlerts
const mockKnowledgePoints = mockData.teacherData.knowledgePoints
const mockOKRDistribution = mockData.teacherData.okrDistribution

export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState(mockTeacherInfo.classes[0])
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null)
  const router = useRouter()

  const handleLogout = () => {
    router.push('/login')
  }

  const handleSwitchRole = () => {
    router.push('/dashboard')
  }

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
    <div className="min-h-screen bg-gray-50">
      <Navigation 
         currentRole="teacher"
         currentPage="/teacher"
       />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>
    </div>
  )
}