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
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { StudentOnlyRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockStudentInfo = mockData.users.student
const mockOKRs = mockData.okrs
const mockLearningAnalytics = mockData.learningAnalytics
const mockRecommendedResources = mockData.recommendedResources
const mockChatSessions = mockData.chatSessions

export default function Dashboard() {
  const { user } = useAuth()
  const [selectedOKR, setSelectedOKR] = useState<number | null>(null)
  const [editingOKR, setEditingOKR] = useState<number | null>(null)
  const [selectedView, setSelectedView] = useState<'overview' | 'learning' | 'resources' | 'ai-history'>('overview')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const router = useRouter()

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
    <StudentOnlyRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

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
              { key: 'ai-history', label: 'AI历史记录', icon: '🤖' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  switch(tab.key) {
                    case 'okr':
                      setSelectedView('overview');
                      break;
                    case 'analytics':
                      setSelectedView('learning');
                      break;
                    case 'resources':
                      setSelectedView('resources');
                      break;
                    case 'ai-history':
                      setSelectedView('ai-history');
                      break;
                  }
                }}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedView === tab.key
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
            {selectedView === 'overview' && (
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
            {selectedView === 'learning' && (
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
            {selectedView === 'resources' && (
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

            {/* AI历史记录 */}
            {selectedView === 'ai-history' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="mr-2">🤖</span>
                      AI对话历史
                    </CardTitle>
                    <CardDescription>
                      查看你与AI助手的所有对话记录，回顾学习过程中的问答
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mockChatSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🤖</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">还没有对话记录</h3>
                        <p className="text-gray-600 mb-4">开始与AI助手对话吧</p>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                          开始对话
                        </Button>
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
                  </CardContent>
                </Card>
              </div>
            )}

          </div>

          {/* 右侧信息区域 */}
          <div className="space-y-6">
            {/* 快速统计 */}
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
                    <span className="font-semibold">{mockChatSessions.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
     </StudentOnlyRoute>
   )
}