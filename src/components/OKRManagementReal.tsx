'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Target, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { OKRServiceFixed, OKRWithKeyResults, NewOKR, NewKeyResult } from '@/lib/okr-service-fixed'
import { OKRServiceAPI } from '@/lib/okr-service-api'
import { useToast, ToastContainer } from '@/components/ui/toast'

// 动态选择服务：开发环境用Fixed服务，生产环境用API服务
const OKRService = process.env.NODE_ENV === 'development' ? OKRServiceFixed : OKRServiceAPI

interface OKRManagementRealProps {
  userRole?: 'student' | 'teacher' | 'admin'
  onDataChange?: () => void // 数据变化回调
}

export default function OKRManagementReal({ userRole = 'student', onDataChange }: OKRManagementRealProps) {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [okrs, setOkrs] = useState<OKRWithKeyResults[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOKR, setSelectedOKR] = useState<OKRWithKeyResults | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isKeyResultDialogOpen, setIsKeyResultDialogOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [newlyCreatedOKRId, setNewlyCreatedOKRId] = useState<string | null>(null)
  const [okrValidationError, setOkrValidationError] = useState<string>('')
  const [keyResultValidationError, setKeyResultValidationError] = useState<string>('')
  
  // 新OKR表单状态
  const [newOKR, setNewOKR] = useState<Partial<NewOKR>>({
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0], // 今天
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90天后
  })

  // 新关键结果表单状态
  const [newKeyResult, setNewKeyResult] = useState<Partial<NewKeyResult>>({
    title: '',
    description: '',
    target_value: 0,
    unit: ''
  })

  // 加载用户的OKR数据
  const loadOKRs = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const { data, error } = await OKRService.getUserOKRs(user.id)
      if (error) {
        console.error('加载OKR失败:', error)
      } else {
        setOkrs(data || [])
      }

      // 加载统计信息
      const { data: statsData } = await OKRService.getOKRStats(user.id)
      setStats(statsData)
    } catch (error) {
      console.error('加载OKR异常:', error)
    } finally {
      setLoading(false)
    }
  }

  // 创建新OKR
  const handleCreateOKR = async () => {
    if (!user?.id) return
    
    // 验证必填字段
    if (!newOKR.title?.trim()) {
      setOkrValidationError('请填写目标标题')
      showError('请输入目标标题', '目标标题不能为空')
      return
    }
    
    // 清除验证错误
    setOkrValidationError('')

    try {
      const okrData: NewOKR = {
        user_id: user.id,
        title: newOKR.title!,
        description: newOKR.description || '',
        category: newOKR.category || 'personal',
        priority: newOKR.priority || 'medium',
        status: newOKR.status || 'active',
        start_date: newOKR.start_date!,
        end_date: newOKR.end_date!
      }

      const { data, error } = await OKRService.createOKR(okrData)
      
      if (error) {
        console.error('创建OKR失败:', error)
        showError('创建OKR失败', '请检查网络连接后重试')
      } else if (data) {
        console.log('OKR创建成功:', data)
        
        // 创建新的OKR对象，包含空的关键结果数组
        const newOKRWithKeyResults: OKRWithKeyResults = {
          ...data,
          keyResults: []
        } as OKRWithKeyResults
        
        // 直接添加到当前OKR列表的顶部，避免重新加载
        setOkrs(prev => [newOKRWithKeyResults, ...prev])
        
        // 设置新创建的OKR ID用于高亮显示
        setNewlyCreatedOKRId(data.id)
        
        // 3秒后清除高亮效果
        setTimeout(() => {
          setNewlyCreatedOKRId(null)
        }, 3000)
        
        // 关闭对话框
        setIsCreateDialogOpen(false)
        
        // 重置表单状态并确保日期字段有值
        const today = new Date().toISOString().split('T')[0]
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        setNewOKR({
          title: '',
          description: '',
          category: 'personal',
          priority: 'medium',
          status: 'active',
          start_date: today,
          end_date: endDate
        })
        
        // 显示成功消息
        console.log('✅ OKR已添加到页面，无需刷新')
        
        // 重新加载统计信息
        if (user?.id) {
          const { data: statsData } = await OKRService.getOKRStats(user.id)
          setStats(statsData)
        }
        
        // 通知父组件数据发生变化
        onDataChange?.()
        
        // 显示成功提示
        success('OKR创建成功！', `新目标 "${data.title}" 已添加到列表中`)
      }
    } catch (error) {
      console.error('创建OKR异常:', error)
      showError('创建OKR失败', '系统异常，请重试')
    }
  }

  // 添加关键结果
  const handleCreateKeyResult = async () => {
    if (!selectedOKR?.id) return
    
    // 验证必填字段
    if (!newKeyResult.title?.trim()) {
      setKeyResultValidationError('请填写关键结果标题')
      showError('请输入关键结果标题', '关键结果标题不能为空')
      return
    }
    
    if (!newKeyResult.target_value || newKeyResult.target_value <= 0) {
      setKeyResultValidationError('请填写有效的目标值')
      showError('请输入有效的目标值', '目标值必须大于0')
      return
    }
    
    // 清除验证错误
    setKeyResultValidationError('')

    try {
      const keyResultData: NewKeyResult = {
        okr_id: selectedOKR.id,
        title: newKeyResult.title!,
        description: newKeyResult.description || '',
        target_value: newKeyResult.target_value || 0,
        unit: newKeyResult.unit || ''
      }

      const { data, error } = await OKRService.createKeyResult(keyResultData)
      
      if (error) {
        console.error('创建关键结果失败:', error)
        showError('创建关键结果失败', '请检查输入信息后重试')
      } else if (data) {
        console.log('关键结果创建成功:', data)
        
        // 直接更新对应OKR的关键结果列表，避免重新加载
        setOkrs(prev => prev.map(okr => {
          if (okr.id === selectedOKR?.id) {
            return {
              ...okr,
              keyResults: [...okr.keyResults, data]
            }
          }
          return okr
        }))
        
        // 关闭对话框并重置表单
        setIsKeyResultDialogOpen(false)
        setNewKeyResult({
          title: '',
          description: '',
          target_value: 0,
          unit: ''
        })
        
        // 重新加载统计信息
        if (user?.id) {
          const { data: statsData } = await OKRService.getOKRStats(user.id)
          setStats(statsData)
        }
        
        // 通知父组件数据发生变化
        onDataChange?.()
        
        console.log('✅ 关键结果已添加到页面，无需刷新')
      }
    } catch (error) {
      console.error('创建关键结果异常:', error)
      showError('创建关键结果失败', '系统异常，请重试')
    }
  }

  // 更新关键结果进度
  const handleUpdateKeyResultProgress = async (keyResultId: string, currentValue: number) => {
    console.log('前端开始更新进度:', { keyResultId, currentValue })
    
    try {
      const result = await OKRService.updateKeyResultProgress(keyResultId, currentValue)
      console.log('更新进度服务返回:', result)
      
      if (result.error) {
        console.error('更新进度失败:', result.error)
        showError('更新进度失败', '请检查数值后重试')
      } else {
        // 直接更新对应关键结果的进度，避免重新加载
        const validCurrentValue = Math.max(0, currentValue)
        setOkrs(prev => prev.map(okr => ({
          ...okr,
          keyResults: okr.keyResults.map(kr => {
            if (kr.id === keyResultId) {
              const progressPercentage = kr.target_value && kr.target_value > 0 
                ? Math.max(0, Math.min((validCurrentValue / kr.target_value) * 100, 100))
                : 0
              return {
                ...kr,
                current_value: validCurrentValue,
                progress: Math.round(progressPercentage),
                status: progressPercentage >= 100 ? 'completed' : 'active'
              }
            }
            return kr
          }),
          // 重新计算OKR整体进度
          progress: Math.round(okr.keyResults.reduce((sum, kr) => {
            if (kr.id === keyResultId) {
              const progressPercentage = kr.target_value && kr.target_value > 0 
                ? Math.max(0, Math.min((validCurrentValue / kr.target_value) * 100, 100))
                : 0
              return sum + progressPercentage
            }
            return sum + (kr.progress || 0)
          }, 0) / Math.max(1, okr.keyResults.length))
        })))
        
        // 重新加载统计信息
        if (user?.id) {
          const { data: statsData } = await OKRService.getOKRStats(user.id)
          setStats(statsData)
        }
        
        // 通知父组件数据发生变化
        onDataChange?.()
        
        console.log('✅ 进度已更新，无需刷新')
        success('进度更新成功', `当前进度: ${validCurrentValue}`)
      }
    } catch (error) {
      console.error('更新进度异常:', error)
      showError('更新进度失败', '系统异常，请重试')
    }
  }

  // 删除OKR
  const handleDeleteOKR = async (okrId: string) => {
    if (!confirm('确定要删除这个OKR吗？此操作不可撤销。')) return

    try {
      const { error } = await OKRService.deleteOKR(okrId)
      
      if (error) {
        console.error('删除OKR失败:', error)
        showError('删除OKR失败', '请稍后重试')
      } else {
        // 直接从列表中移除OKR，避免重新加载
        setOkrs(prev => prev.filter(okr => okr.id !== okrId))
        
        // 重新加载统计信息
        if (user?.id) {
          const { data: statsData } = await OKRService.getOKRStats(user.id)
          setStats(statsData)
        }
        
        // 通知父组件数据发生变化
        onDataChange?.()
        
        success('OKR删除成功', '目标已从列表中移除')
        console.log('✅ OKR已从页面移除，无需刷新')
      }
    } catch (error) {
      console.error('删除OKR异常:', error)
      showError('删除OKR失败', '系统异常，请重试')
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadOKRs()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载OKR数据中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OKR 目标管理</h1>
              <p className="text-gray-600 mt-2">制定目标，追踪进度，实现成长</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 active:bg-blue-800">
                  <Plus className="w-4 h-4 mr-2" />
                  创建新OKR
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>创建新的OKR目标</DialogTitle>
                  <DialogDescription>
                    设定一个具体、可衡量、有挑战性的目标
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">目标标题 *</Label>
                    <Input
                      id="title"
                      value={newOKR.title || ''}
                      onChange={(e) => {
                        setNewOKR(prev => ({ ...prev, title: e.target.value }))
                        if (okrValidationError) setOkrValidationError('')
                      }}
                      placeholder="例如：提升编程能力，为实习做准备"
                      className={okrValidationError ? 'border-red-500 focus:border-red-500' : ''}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">目标描述</Label>
                    <Textarea
                      id="description"
                      value={newOKR.description || ''}
                      onChange={(e) => setNewOKR(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="详细描述这个目标的意义和预期结果"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="objective_type">目标类型</Label>
                      <Select
                        value={newOKR.category || 'personal'}
                        onValueChange={(value: any) => setNewOKR(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">个人目标</SelectItem>
                          <SelectItem value="course">课程目标</SelectItem>
                          <SelectItem value="college">学院目标</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">优先级</Label>
                      <Select
                        value={newOKR.priority || 'medium'}
                        onValueChange={(value) => setNewOKR(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">低</SelectItem>
                          <SelectItem value="medium">中</SelectItem>
                          <SelectItem value="high">高</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {okrValidationError && (
                    <div className="text-red-600 text-sm font-medium mb-2">
                      {okrValidationError}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false)
                      setOkrValidationError('')
                    }}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleCreateOKR}
                      className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 active:bg-blue-800"
                    >
                      创建OKR
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">总OKR数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalOKRs}</div>
                <p className="text-sm text-green-600">活跃: {stats.activeOKRs}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">平均进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.averageProgress}%</div>
                <Progress value={stats.averageProgress} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">完成率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.completionRate}%</div>
                <p className="text-sm text-blue-600">已完成: {stats.completedOKRs}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">关键结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalKeyResults}</div>
                <p className="text-sm text-purple-600">已完成: {stats.completedKeyResults}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* OKR列表 */}
        <div className="space-y-6">
          {okrs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">还没有OKR目标</h3>
                  <p className="text-gray-600 mb-6">开始创建你的第一个OKR目标，规划学习和成长路径</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 active:bg-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建新OKR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            okrs.map((okr) => (
              <Card 
                key={okr.id} 
                className={`border-l-4 transition-all duration-500 ${
                  newlyCreatedOKRId === okr.id 
                    ? 'border-l-green-500 bg-green-50 shadow-lg scale-[1.02]' 
                    : 'border-l-blue-500'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        <span className="mr-3">{okr.title}</span>
                        <Badge className={`${okr.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          okr.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {okr.status === 'completed' ? '已完成' : okr.status === 'active' ? '进行中' : okr.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {okr.description}
                      </CardDescription>
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span>类型: {okr.category === 'personal' ? '个人' : okr.category === 'course' ? '课程' : '学院'}</span>
                        <span>截止: {new Date(okr.end_date).toLocaleDateString()}</span>
                        <span>创建: {new Date(okr.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{okr.progress}%</div>
                        <Progress value={okr.progress} className="w-20 mt-1" />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOKR(okr.id)}
                        className="hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all duration-150 active:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">关键结果 ({okr.keyResults?.length || 0})</h4>
                      <Dialog open={isKeyResultDialogOpen && selectedOKR?.id === okr.id} onOpenChange={setIsKeyResultDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOKR(okr)}
                            className="hover:bg-blue-50 active:scale-95 transition-all duration-150 active:bg-blue-100"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            添加关键结果
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>添加关键结果</DialogTitle>
                            <DialogDescription>
                              为 "{okr.title}" 添加一个可衡量的关键结果
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="kr-title">关键结果标题 *</Label>
                              <Input
                                id="kr-title"
                                value={newKeyResult.title || ''}
                                onChange={(e) => {
                                  setNewKeyResult(prev => ({ ...prev, title: e.target.value }))
                                  if (keyResultValidationError) setKeyResultValidationError('')
                                }}
                                placeholder="例如：完成3个个人项目"
                                className={keyResultValidationError ? 'border-red-500 focus:border-red-500' : ''}
                              />
                            </div>
                            <div>
                              <Label htmlFor="kr-description">详细描述</Label>
                              <Textarea
                                id="kr-description"
                                value={newKeyResult.description || ''}
                                onChange={(e) => setNewKeyResult(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="详细说明这个关键结果"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="kr-target">目标值</Label>
                                <Input
                                  id="kr-target"
                                  type="number"
                                  value={newKeyResult.target_value || 0}
                                  onChange={(e) => {
                                    setNewKeyResult(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))
                                    if (keyResultValidationError) setKeyResultValidationError('')
                                  }}
                                  className={keyResultValidationError ? 'border-red-500 focus:border-red-500' : ''}
                                />
                              </div>
                              <div>
                                <Label htmlFor="kr-unit">单位</Label>
                                <Input
                                  id="kr-unit"
                                  value={newKeyResult.unit || ''}
                                  onChange={(e) => setNewKeyResult(prev => ({ ...prev, unit: e.target.value }))}
                                  placeholder="个、小时、%"
                                />
                              </div>
                            </div>
                            {keyResultValidationError && (
                              <div className="text-red-600 text-sm font-medium mb-2">
                                {keyResultValidationError}
                              </div>
                            )}
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button variant="outline" onClick={() => {
                                setIsKeyResultDialogOpen(false)
                                setKeyResultValidationError('')
                              }}>
                                取消
                              </Button>
                              <Button 
                                onClick={handleCreateKeyResult}
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-150 active:bg-blue-800"
                              >
                                添加关键结果
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {okr.keyResults && okr.keyResults.length > 0 ? (
                      <div className="space-y-2">
                        {okr.keyResults.map((kr) => (
                          <div key={kr.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{kr.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{kr.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-sm text-gray-500">
                                  进度: {kr.current_value}/{kr.target_value} {kr.unit}
                                </span>
                                <Badge className={`${kr.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  kr.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                                  kr.status === 'at_risk' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                  {kr.status === 'completed' ? '已完成' : 
                                   kr.status === 'active' ? '进行中' : 
                                   kr.status === 'at_risk' ? '有风险' : '受阻'}
                                </Badge>
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-lg font-bold text-gray-900">{kr.progress}%</div>
                              <Progress value={kr.progress} className="w-16 mt-1" />
                              <div className="mt-2">
                                <Input
                                  type="number"
                                  placeholder="更新进度"
                                  className="w-20 text-xs"
                                  onBlur={(e) => {
                                    const value = parseFloat(e.target.value)
                                    if (!isNaN(value)) {
                                      handleUpdateKeyResultProgress(kr.id, value)
                                      e.target.value = ''
                                    }
                                  }}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const value = parseFloat((e.target as HTMLInputElement).value)
                                      if (!isNaN(value)) {
                                        handleUpdateKeyResultProgress(kr.id, value)
                                        ;(e.target as HTMLInputElement).value = ''
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-lg bg-gray-50">
                        <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">还没有添加关键结果</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Toast通知容器 */}
      <ToastContainer />
    </div>
  )
}