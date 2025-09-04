'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { CheckSquare, Clock, AlertCircle, Play, Pause, Square, RefreshCw } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  task_type: 'ai_processing' | 'okr_analysis' | 'knowledge_extraction' | 'general'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  due_date?: string
  assigned_to: string
  project_id?: string
  organization_id?: string
  metadata?: any
  progress_percentage: number
  estimated_duration?: number
  actual_duration?: number
}

interface TaskManagerProps {
  projectId?: string
  organizationId?: string
  taskType?: string
}

export default function TaskManager({ projectId, organizationId, taskType }: TaskManagerProps) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: taskType || 'general' as Task['task_type'],
    priority: 'medium' as Task['priority'],
    due_date: ''
  })

  // 获取任务列表
  const fetchTasks = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        assigned_to: user.id,
        limit: '50',
        sort_by: sortBy
      })
      
      if (projectId) params.append('project_id', projectId)
      if (organizationId) params.append('organization_id', organizationId)
      if (taskType) params.append('task_type', taskType)

      const response = await fetch(`/api/tasks?${params}`)
      const data = await response.json()

      if (data.success && data.tasks) {
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('获取任务列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建新任务
  const createTask = async () => {
    if (!user?.id || !newTask.title.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          assigned_to: user.id,
          project_id: projectId,
          organization_id: organizationId,
          status: 'pending',
          progress_percentage: 0
        })
      })

      const data = await response.json()
      
      if (data.success && data.task) {
        setTasks(prev => [data.task, ...prev])
        setNewTask({
          title: '',
          description: '',
          task_type: taskType || 'general' as Task['task_type'],
          priority: 'medium',
          due_date: ''
        })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('创建任务失败:', error)
    }
  }

  // 更新任务状态
  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
            : task
        ))
      }
    } catch (error) {
      console.error('更新任务状态失败:', error)
    }
  }

  // 删除任务
  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
      const response = await fetch(`/api/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  // 筛选任务
  useEffect(() => {
    let filtered = [...tasks]

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus)
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority)
    }

    setFilteredTasks(filtered)
  }, [tasks, filterStatus, filterPriority])

  useEffect(() => {
    fetchTasks()
  }, [user?.id, projectId, organizationId, taskType, sortBy])

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" />
      case 'completed': return <CheckSquare className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      default: return <Square className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'in_progress': return '进行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'paused': return '暂停'
      default: return status
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'urgent': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeText = (type: Task['task_type']) => {
    switch (type) {
      case 'ai_processing': return 'AI处理'
      case 'okr_analysis': return 'OKR分析'
      case 'knowledge_extraction': return '知识提取'
      case 'general': return '通用任务'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  }

  return (
    <div className="space-y-6">
      {/* 头部操作区 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">任务管理</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => fetchTasks()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? '取消' : '创建任务'}
          </Button>
        </div>
      </div>

      {/* 任务统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-sm text-gray-500">总任务</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-500">{taskStats.pending}</div>
            <div className="text-sm text-gray-500">等待中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{taskStats.inProgress}</div>
            <div className="text-sm text-gray-500">进行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{taskStats.completed}</div>
            <div className="text-sm text-gray-500">已完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{taskStats.failed}</div>
            <div className="text-sm text-gray-500">失败</div>
          </CardContent>
        </Card>
      </div>

      {/* 创建任务表单 */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>创建新任务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="任务标题"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              />
              <Select
                value={newTask.task_type}
                onValueChange={(value: Task['task_type']) => 
                  setNewTask(prev => ({ ...prev, task_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">通用任务</SelectItem>
                  <SelectItem value="ai_processing">AI处理</SelectItem>
                  <SelectItem value="okr_analysis">OKR分析</SelectItem>
                  <SelectItem value="knowledge_extraction">知识提取</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="任务描述（可选）"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newTask.priority}
                onValueChange={(value: Task['priority']) => 
                  setNewTask(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低优先级</SelectItem>
                  <SelectItem value="medium">中优先级</SelectItem>
                  <SelectItem value="high">高优先级</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                取消
              </Button>
              <Button onClick={createTask} disabled={!newTask.title.trim()}>
                创建任务
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选和排序 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="pending">等待中</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="paused">暂停</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="优先级筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有优先级</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">创建时间</SelectItem>
                <SelectItem value="updated_at">更新时间</SelectItem>
                <SelectItem value="due_date">截止时间</SelectItem>
                <SelectItem value="priority">优先级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>任务列表 ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无任务，请创建新任务
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getTypeText(task.task_type)}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      {task.progress_percentage > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${task.progress_percentage}%` }}
                          ></div>
                        </div>
                      )}
                      
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>创建: {formatDate(task.created_at)}</span>
                        <span>更新: {formatDate(task.updated_at)}</span>
                        {task.due_date && (
                          <span className="text-orange-600">
                            截止: {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(task.status)}
                      </Badge>
                      
                      <Select 
                        value={task.status} 
                        onValueChange={(value: Task['status']) => updateTaskStatus(task.id, value)}
                      >
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">等待</SelectItem>
                          <SelectItem value="in_progress">进行</SelectItem>
                          <SelectItem value="completed">完成</SelectItem>
                          <SelectItem value="paused">暂停</SelectItem>
                          <SelectItem value="failed">失败</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}