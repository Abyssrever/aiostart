'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Home,
  Target,
  BarChart3,
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar, 
  Award,
  Settings,
  UserCheck,
  GraduationCap,
  Shield,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { mockData } from '@/data/mockData'

// OKR管理组件
const OKRManagement: React.FC = () => {
  const mockOKRs = mockData.okrs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">OKR管理</h2>
          <p className="text-gray-600">管理您的目标和关键结果</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>新建OKR</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总目标数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOKRs.length}</div>
            <p className="text-xs text-muted-foreground">活跃目标</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOKRs.filter(okr => okr.progress >= 100).length}</div>
            <p className="text-xs text-muted-foreground">完成的目标</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均进度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockOKRs.reduce((acc, okr) => acc + okr.progress, 0) / mockOKRs.length)}%
            </div>
            <p className="text-xs text-muted-foreground">整体完成度</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的OKR列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockOKRs.map((okr) => (
              <div key={okr.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge variant={okr.progress >= 100 ? 'default' : 'secondary'}>
                      {okr.category}
                    </Badge>
                    <h3 className="font-medium">{okr.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{okr.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>进度</span>
                    <span className="font-medium">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className="h-2" />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>截止日期: {okr.deadline}</span>
                  <Badge variant="outline" className="text-xs">
                    {okr.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 学生仪表板组件
const StudentOverview: React.FC = () => {
  const mockOKRs = mockData.okrs
  const mockLearningAnalytics = mockData.learningAnalytics
  const mockRecommendedResources = mockData.recommendedResources

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习进度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(mockLearningAnalytics.subjectProgress.reduce((acc, curr) => acc + curr.progress, 0) / mockLearningAnalytics.subjectProgress.length)}%</div>
            <Progress value={mockLearningAnalytics.subjectProgress.reduce((acc, curr) => acc + curr.progress, 0) / mockLearningAnalytics.subjectProgress.length} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              本月完成 {mockLearningAnalytics.subjectProgress.filter(subject => subject.progress >= 80).length} 门课程
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OKR目标</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOKRs.length}</div>
            <p className="text-xs text-muted-foreground">活跃目标数量</p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {mockOKRs.filter(okr => okr.progress >= 100).length} 已完成
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockLearningAnalytics.weeklyStudyTime.reduce((total, week) => total + week.hours, 0)}h</div>
            <p className="text-xs text-muted-foreground">本周学习时长</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>推荐学习资源</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockRecommendedResources.slice(0, 4).map((resource) => (
              <div key={resource.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{resource.title}</h4>
                  <p className="text-xs text-gray-500">{resource.type}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {resource.difficulty}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 教师仪表板组件
const TeacherOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理学生</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">活跃学生数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">授课课程</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">本学期课程</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待批改</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">待处理作业</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5</div>
            <p className="text-xs text-muted-foreground">班级平均分</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近提交的作业</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { student: '张三', assignment: '数学作业第5章', time: '2小时前', status: '已提交' },
                { student: '李四', assignment: '英语阅读理解', time: '4小时前', status: '已提交' },
                { student: '王五', assignment: '物理实验报告', time: '6小时前', status: '已提交' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.student}</p>
                    <p className="text-xs text-gray-500">{item.assignment}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">{item.status}</Badge>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>课程安排</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { course: '高等数学', time: '09:00-10:30', room: 'A101', students: 45 },
                { course: '线性代数', time: '14:00-15:30', room: 'B203', students: 38 },
                { course: '概率统计', time: '16:00-17:30', room: 'C305', students: 42 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.course}</p>
                    <p className="text-xs text-gray-500">{item.time} · {item.room}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.students}人
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 管理员仪表板组件
const AdminOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+12% 较上月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,923</div>
            <p className="text-xs text-muted-foreground">本周活跃</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统性能</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">系统可用性</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">存储使用</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <Progress value={67} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">2.1TB / 3.2TB</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>用户活动统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">学生用户</span>
                <div className="flex items-center space-x-2">
                  <Progress value={75} className="w-20" />
                  <span className="text-sm font-medium">2,134</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">教师用户</span>
                <div className="flex items-center space-x-2">
                  <Progress value={60} className="w-20" />
                  <span className="text-sm font-medium">567</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">管理员</span>
                <div className="flex items-center space-x-2">
                  <Progress value={30} className="w-20" />
                  <span className="text-sm font-medium">146</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: 'info', message: '用户登录成功', time: '10:30:25', user: 'student@example.com' },
                { type: 'warning', message: '系统负载较高', time: '10:25:12', user: 'system' },
                { type: 'success', message: '数据备份完成', time: '10:20:08', user: 'system' },
                { type: 'error', message: '登录失败尝试', time: '10:15:33', user: 'unknown' },
              ].map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={log.type === 'error' ? 'destructive' : 
                              log.type === 'warning' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {log.type}
                    </Badge>
                    <div>
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-gray-500">{log.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 主要的统一仪表板组件
interface UnifiedDashboardProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ 
  activeTab = 'overview', 
  onTabChange 
}) => {
  const { user, hasRole } = useAuth()

  if (!user) {
    return null
  }

  // 根据角色确定欢迎信息和图标
  const getRoleConfig = () => {
    if (hasRole('admin')) {
      return {
        title: '管理员控制台',
        description: '系统管理和数据监控',
        icon: Shield,
        color: 'from-purple-500 to-violet-600',
        textColor: 'text-purple-100'
      }
    } else if (hasRole('teacher')) {
      return {
        title: '教师工作台',
        description: '管理您的学生和课程',
        icon: GraduationCap,
        color: 'from-green-500 to-emerald-600',
        textColor: 'text-green-100'
      }
    } else {
      return {
        title: '学生学习中心',
        description: '欢迎回来！继续您的学习之旅',
        icon: GraduationCap,
        color: 'from-blue-500 to-indigo-600',
        textColor: 'text-blue-100'
      }
    }
  }

  const roleConfig = getRoleConfig()
  const RoleIcon = roleConfig.icon

  // 根据角色渲染对应的总览组件
  const renderOverview = () => {
    if (hasRole('admin')) {
      return <AdminOverview />
    } else if (hasRole('teacher')) {
      return <TeacherOverview />
    } else {
      return <StudentOverview />
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <Card className={`bg-gradient-to-r ${roleConfig.color} text-white`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RoleIcon className="w-6 h-6" />
            <span>{roleConfig.title}</span>
          </CardTitle>
          <CardDescription className={roleConfig.textColor}>
            {roleConfig.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 标签页导航 */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsContent value="overview" className="mt-0">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="okr" className="mt-0">
          <OKRManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UnifiedDashboard