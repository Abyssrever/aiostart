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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navigation from '@/components/Navigation'
import FloatingAIAssistant from '@/components/FloatingAIAssistant'
import { mockData } from '@/data/mockData'

// 使用集中的mock数据
const mockOKRs = mockData.okrs
const mockChatSessions = mockData.chatSessions

type OKR = {
  id?: number
  title: string
  description: string
  deadline: string
  category: string
  priority: string
  keyResults: Array<{
    id?: number
    text: string
    target: number
    unit: string
  }>
}

export default function OKRManagement() {
  const [activeTab, setActiveTab] = useState<'management' | 'ai-history'>('management')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [okrs, setOkrs] = useState(mockOKRs)
  const [selectedOKR, setSelectedOKR] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [newOKR, setNewOKR] = useState<OKR>({
    title: '',
    description: '',
    deadline: '',
    category: 'academic',
    priority: 'medium',
    keyResults: [
      { text: '', target: 0, unit: '' },
      { text: '', target: 0, unit: '' },
      { text: '', target: 0, unit: '' }
    ]
  })
  const router = useRouter()

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-100 text-blue-800'
      case 'skill': return 'bg-green-100 text-green-800'
      case 'language': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOKRs = okrs.filter(okr => {
    const statusMatch = filterStatus === 'all' || okr.status === filterStatus
    const categoryMatch = filterCategory === 'all' || okr.category === filterCategory
    return statusMatch && categoryMatch
  })

  const handleCreateOKR = () => {
    const newId = Math.max(...okrs.map(o => o.id)) + 1
    const okrToCreate = {
      ...newOKR,
      id: newId,
      progress: 0,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      owner: '当前用户',
      keyResults: newOKR.keyResults.map((kr, index) => ({
        ...kr,
        id: newId * 10 + index,
        progress: 0,
        current: 0
      }))
    }
    setOkrs([...okrs, okrToCreate])
    setIsCreateDialogOpen(false)
    setNewOKR({
      title: '',
      description: '',
      deadline: '',
      category: 'academic',
      priority: 'medium',
      keyResults: [
        { text: '', target: 0, unit: '' },
        { text: '', target: 0, unit: '' },
        { text: '', target: 0, unit: '' }
      ]
    })
  }

  const handleUpdateKeyResult = (okrId: number, krId: number, newCurrent: number) => {
    setOkrs(okrs.map(okr => {
      if (okr.id === okrId) {
        const updatedKeyResults = okr.keyResults.map(kr => {
          if (kr.id === krId) {
            const progress = Math.min(100, Math.round((newCurrent / kr.target) * 100))
            return { ...kr, current: newCurrent, progress }
          }
          return kr
        })
        const avgProgress = Math.round(updatedKeyResults.reduce((acc, kr) => acc + kr.progress, 0) / updatedKeyResults.length)
        return { ...okr, keyResults: updatedKeyResults, progress: avgProgress }
      }
      return okr
    }))
  }

  const handleDeleteOKR = (okrId: number) => {
    setOkrs(okrs.filter(okr => okr.id !== okrId))
  }

  const handleStatusChange = (okrId: number, newStatus: string) => {
    setOkrs(okrs.map(okr => 
      okr.id === okrId ? { ...okr, status: newStatus } : okr
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentRole="student"
        currentPage="/okr"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 功能标签页 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'management', label: 'OKR管理', icon: '🎯' },
                { id: 'ai-history', label: 'AI历史记录', icon: '🤖' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'management' | 'ai-history')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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

        {/* OKR管理内容 */}
        {activeTab === 'management' && (
        <div>
        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="paused">已暂停</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="分类筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="academic">学术</SelectItem>
                <SelectItem value="skill">技能</SelectItem>
                <SelectItem value="language">语言</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <span className="mr-2">+</span>
                创建新OKR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>创建新的OKR</DialogTitle>
                <DialogDescription>
                  设定明确的目标和可衡量的关键结果
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">目标标题</Label>
                  <Input
                    id="title"
                    value={newOKR.title}
                    onChange={(e) => setNewOKR({...newOKR, title: e.target.value})}
                    placeholder="输入目标标题"
                  />
                </div>
                <div>
                  <Label htmlFor="description">目标描述</Label>
                  <Textarea
                    id="description"
                    value={newOKR.description}
                    onChange={(e) => setNewOKR({...newOKR, description: e.target.value})}
                    placeholder="详细描述这个目标"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select value={newOKR.category} onValueChange={(value) => setNewOKR({...newOKR, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">学术</SelectItem>
                        <SelectItem value="skill">技能</SelectItem>
                        <SelectItem value="language">语言</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">优先级</Label>
                    <Select value={newOKR.priority} onValueChange={(value) => setNewOKR({...newOKR, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">高</SelectItem>
                        <SelectItem value="medium">中</SelectItem>
                        <SelectItem value="low">低</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deadline">截止日期</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newOKR.deadline}
                      onChange={(e) => setNewOKR({...newOKR, deadline: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>关键结果 (Key Results)</Label>
                  <div className="space-y-3 mt-2">
                    {newOKR.keyResults.map((kr, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <Input
                            placeholder={`关键结果 ${index + 1}`}
                            value={kr.text}
                            onChange={(e) => {
                              const updated = [...newOKR.keyResults]
                              updated[index] = {...updated[index], text: e.target.value}
                              setNewOKR({...newOKR, keyResults: updated})
                            }}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="目标值"
                            value={kr.target || ''}
                            onChange={(e) => {
                              const updated = [...newOKR.keyResults]
                              updated[index] = {...updated[index], target: parseInt(e.target.value) || 0}
                              setNewOKR({...newOKR, keyResults: updated})
                            }}
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="单位"
                            value={kr.unit}
                            onChange={(e) => {
                              const updated = [...newOKR.keyResults]
                              updated[index] = {...updated[index], unit: e.target.value}
                              setNewOKR({...newOKR, keyResults: updated})
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateOKR} disabled={!newOKR.title || !newOKR.description}>
                    创建OKR
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总OKR数</p>
                  <p className="text-2xl font-bold text-gray-900">{okrs.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📋</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">进行中</p>
                  <p className="text-2xl font-bold text-green-600">{okrs.filter(o => o.status === 'active').length}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🎯</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均完成度</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(okrs.reduce((acc, okr) => acc + okr.progress, 0) / okrs.length)}%
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">📊</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">高优先级</p>
                  <p className="text-2xl font-bold text-red-600">{okrs.filter(o => o.priority === 'high').length}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">🔥</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OKR列表 */}
        <div className="space-y-4">
          {filteredOKRs.map((okr) => (
            <Card key={okr.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{okr.title}</CardTitle>
                      <Badge className={getCategoryColor(okr.category)}>
                        {okr.category === 'academic' ? '学术' : okr.category === 'skill' ? '技能' : '语言'}
                      </Badge>
                      <Badge className={getPriorityColor(okr.priority)}>
                        {okr.priority === 'high' ? '高优先级' : okr.priority === 'medium' ? '中优先级' : '低优先级'}
                      </Badge>
                      <Badge className={getStatusColor(okr.status)}>
                        {okr.status === 'active' ? '进行中' : okr.status === 'draft' ? '草稿' : okr.status === 'completed' ? '已完成' : '已暂停'}
                      </Badge>
                    </div>
                    <CardDescription>{okr.description}</CardDescription>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-purple-600 mb-1">{okr.progress}%</div>
                    <div className="text-sm text-gray-500">截止: {okr.deadline}</div>
                    <div className="text-xs text-gray-400">创建: {okr.createdAt}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={okr.progress} className="h-2" />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="mr-2">🎯</span>
                      关键结果进度
                    </h4>
                    {okr.keyResults.map((kr) => (
                      <div key={kr.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{kr.text}</span>
                          <span className="text-xs text-gray-600">{kr.progress}%</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress value={kr.progress} className="flex-1 h-1" />
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={kr.current}
                              onChange={(e) => handleUpdateKeyResult(okr.id, kr.id, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-xs"
                              min="0"
                              max={kr.target}
                            />
                            <span className="text-xs text-gray-500">/ {kr.target} {kr.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex space-x-2">
                      <Select value={okr.status} onValueChange={(value) => handleStatusChange(okr.id, value)}>
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">草稿</SelectItem>
                          <SelectItem value="active">进行中</SelectItem>
                          <SelectItem value="paused">暂停</SelectItem>
                          <SelectItem value="completed">完成</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        编辑
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteOKR(okr.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOKRs.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无OKR</h3>
              <p className="text-gray-600 mb-4">开始创建你的第一个OKR，设定明确的目标和关键结果</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                创建新OKR
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
        )}

        {/* AI历史记录 */}
        {activeTab === 'ai-history' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="mr-2">🤖</span>
                  AI对话历史记录
                </CardTitle>
                <CardDescription>
                  查看你与AI助手的所有对话记录，回顾OKR制定过程中的问答
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mockChatSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🤖</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">暂无AI对话记录</h3>
                    <p className="text-gray-600 mb-4">开始与AI助手对话，这里将显示你们的聊天历史</p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      开始对话
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 会话列表 */}
                    <div className="lg:col-span-1">
                      <h3 className="font-medium text-gray-900 mb-4">对话会话</h3>
                      <div className="space-y-2">
                        {mockChatSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedSession?.id === session.id
                                ? 'bg-purple-50 border-purple-200'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {session.title}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {session.date}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {session.preview}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {session.messageCount} 条消息
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {session.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 对话详情 */}
                    <div className="lg:col-span-2">
                      {selectedSession ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-gray-900">
                              {selectedSession.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {selectedSession.messageCount} 条消息
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {selectedSession.date} · {selectedSession.duration}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {selectedSession.messages.map((message, index) => (
                              <div key={index} className="flex space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                  message.role === 'user'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-purple-100 text-purple-600'
                                }`}>
                                  {message.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-sm text-gray-900">
                                      {message.role === 'user' ? '你' : 'Claude'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {message.timestamp}
                                    </span>
                                  </div>
                                  <div className={`p-3 rounded-lg ${
                                    message.role === 'user'
                                      ? 'bg-blue-50 border border-blue-100'
                                      : 'bg-gray-50 border border-gray-100'
                                  }`}>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {message.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 text-4xl mb-4">💬</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个对话会话</h3>
                          <p className="text-gray-600">点击左侧的会话来查看详细的对话内容</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* 悬浮AI助手 */}
      <FloatingAIAssistant chatHistory={mockChatSessions.flatMap(session => session.messages)} />
    </div>
  )
}