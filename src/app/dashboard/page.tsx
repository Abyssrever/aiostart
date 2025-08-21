'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/Navigation'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockStudentInfo = mockData.users.student
const mockOKRs = mockData.okrs
const mockLearningAnalytics = mockData.learningAnalytics
const mockRecommendedResources = mockData.recommendedResources
const mockChatHistory = mockData.chatHistory

export default function Dashboard() {
  const [selectedOKR, setSelectedOKR] = useState<number | null>(null)
  const [editingOKR, setEditingOKR] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [activeTab, setActiveTab] = useState<'okr' | 'analytics' | 'resources' | 'chat'>('okr')
  const router = useRouter()

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage = { role: 'user' as const, content: newMessage }
    const aiResponse = { 
      role: 'assistant' as const, 
      content: getAIResponse(newMessage)
    }

    setMessages([...messages, userMessage, aiResponse])
    setNewMessage('')
  }

  const getAIResponse = (message: string): string => {
    const responses = [
      '根据你的学习进度，我建议你继续专注于算法练习，这将有助于提升你的编程思维能力。',
      '你在前端开发方面表现不错！建议深入学习TypeScript，这将让你的代码更加健壮。',
      '从你的OKR完成情况来看，你的学习节奏很好。保持这种状态，同时注意劳逸结合。',
      '我注意到你的英语学习进度稍慢，建议每天抽出30分钟进行英语阅读练习。',
      '基于你的专业背景，我推荐你关注一些开源项目，这将有助于提升你的实战经验。'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleLogout = () => {
    router.push('/login')
  }

  const handleSwitchToTeacher = () => {
    router.push('/teacher')
  }

  const handleSwitchToAdmin = () => {
    router.push('/admin')
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'skill': return 'bg-green-100 text-green-800'
      case 'language': return 'bg-purple-100 text-purple-800'
      case 'technical': return 'bg-orange-100 text-orange-800'
      case 'career': return 'bg-pink-100 text-pink-800'
      case 'management': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600'
      case 'intermediate': return 'text-yellow-600'
      case 'advanced': return 'text-red-600'
      case 'mixed': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
         currentRole="student"
         currentPage="/dashboard"
       />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 学生信息概览卡片 */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{mockStudentInfo.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{mockStudentInfo.name}</h2>
                    <p className="text-gray-600">{mockStudentInfo.major} • {mockStudentInfo.grade}</p>
                    <p className="text-sm text-gray-500">学号: {mockStudentInfo.studentId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm text-gray-600">GPA</p>
                      <p className="text-2xl font-bold text-green-600">{mockStudentInfo.gpa}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">学分</p>
                      <p className="text-2xl font-bold text-blue-600">{mockStudentInfo.credits}/{mockStudentInfo.totalCredits}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'okr', label: 'OKR管理', icon: '🎯' },
              { key: 'analytics', label: '学习分析', icon: '📊' },
              { key: 'resources', label: '推荐资源', icon: '📚' },
              { key: 'chat', label: 'AI助手', icon: '🤖' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'okr' | 'analytics' | 'resources' | 'chat')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主要内容区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* OKR管理 */}
            {activeTab === 'okr' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">我的OKR</h2>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push('/okr')}>管理OKR</Button>
                    <Button>新建OKR</Button>
                  </div>
                </div>
                {mockOKRs.map((okr) => (
                  <Card key={okr.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center">
                             {okr.title}
                             <Badge className={`ml-2 ${getCategoryColor(okr.category)}`}>
                               {okr.category === 'academic' ? '学术' : okr.category === 'skill' ? '技能' : '语言'}
                             </Badge>
                           </CardTitle>
                          <CardDescription>{okr.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{okr.progress}%</div>
                          <div className="text-sm text-gray-500">截止: {okr.deadline}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={okr.progress} className="h-2" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">关键结果:</h4>
                          {okr.keyResults.map((kr, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{kr.text}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600">{kr.current}/{kr.target}</span>
                                <Progress value={kr.progress} className="w-16 h-1" />
                                <span className="text-xs font-medium">{kr.progress}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 学习分析 */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="mr-2">📊</span>
                      学习数据分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{mockLearningAnalytics.weeklyStudyTime[mockLearningAnalytics.weeklyStudyTime.length - 1].hours}h</div>
                        <p className="text-sm text-gray-600">本周学习时长</p>
                        <p className="text-xs text-green-600">较上周增加 2h</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{mockLearningAnalytics.subjectProgress.length}</div>
                        <p className="text-sm text-gray-600">学习科目</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{mockLearningAnalytics.skillRadar.length}</div>
                        <p className="text-sm text-gray-600">技能维度</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">学科学习时长分布</h3>
                      {mockLearningAnalytics.subjectProgress.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{subject.subject}</p>
                            <p className="text-sm text-gray-600">进度: {subject.progress}%</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-100 text-blue-800">
                              {subject.grade}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">优势能力</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockLearningAnalytics.skillRadar.filter(skill => skill.score >= 80).map((skill, index) => (
                          <div key={index} className="flex items-center p-2 bg-green-50 rounded-lg">
                            <span className="mr-2">✅</span>
                            <span className="text-green-800">{skill.skill} ({skill.score}分)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-600">待提升领域</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockLearningAnalytics.skillRadar.filter(skill => skill.score < 80).map((skill, index) => (
                          <div key={index} className="flex items-center p-2 bg-orange-50 rounded-lg">
                            <span className="mr-2">🎯</span>
                            <span className="text-orange-800">{skill.skill} ({skill.score}分)</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* 推荐资源 */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="mr-2">📚</span>
                      个性化学习资源推荐
                    </CardTitle>
                    <CardDescription>
                      基于你的学习进度和兴趣为你推荐合适的学习资源
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockRecommendedResources.map((resource) => (
                        <div key={resource.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            </div>
                            <Badge className={getCategoryColor(resource.type)}>
                              {resource.type === 'course' ? '课程' : resource.type === 'book' ? '书籍' : '练习'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>⭐ {resource.rating}</span>
                              <span>⏱️ {resource.estimatedTime}</span>
                              <span className={`font-medium ${getDifficultyColor(resource.difficulty)}`}>
                                {resource.difficulty === 'beginner' ? '初级' : 
                                 resource.difficulty === 'intermediate' ? '中级' : 
                                 resource.difficulty === 'advanced' ? '高级' : '混合'}
                              </span>
                            </div>
                            <Button size="sm" variant="outline">
                              开始学习
                            </Button>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            推荐原因: {resource.recommendReason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI助手聊天 */}
            {activeTab === 'chat' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">🤖</span>
                    AI学习助手
                  </CardTitle>
                  <CardDescription>
                    智能学习助手，为你提供个性化的学习指导和答疑
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 flex flex-col">
                    <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          <p>👋 你好！我是你的AI学习助手</p>
                          <p className="text-sm mt-2">你可以问我关于学习、OKR管理、职业规划等任何问题</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-white border'
                              }`}>
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="输入你的问题..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        发送
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧信息区域 */}
          <div className="space-y-6">
            {/* 聊天历史 - 只在聊天标签页显示 */}
            {activeTab === 'chat' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">💬</span>
                    聊天记录
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {mockChatHistory.map((chat) => (
                      <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
                            {chat.type === 'user' ? '用户提问' : 'AI回答'}
                          </h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            {chat.type === 'user' ? '提问' : '回答'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{chat.content}</p>
                        <p className="text-xs text-gray-400 mt-2">{chat.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 快速统计 - 在非聊天标签页显示 */}
            {activeTab !== 'chat' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">📈</span>
                    快速统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">活跃OKR</span>
                      <span className="font-semibold">{mockOKRs.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">平均完成度</span>
                      <span className="font-semibold text-green-600">
                        {Math.round(mockOKRs.reduce((acc, okr) => acc + okr.progress, 0) / mockOKRs.length)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">本周学习</span>
                      <span className="font-semibold text-blue-600">{mockLearningAnalytics.weeklyStudyTime.reduce((total, week) => total + week.hours, 0)}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">AI对话</span>
                      <span className="font-semibold">{mockChatHistory.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 今日建议 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">💡</span>
                  今日建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">📚 建议今天完成10道算法题，保持学习节奏</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">🎯 你的前端开发OKR进度稍慢，建议加快TypeScript学习</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-800">🌟 本周学习时长超过平均值，继续保持！</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}