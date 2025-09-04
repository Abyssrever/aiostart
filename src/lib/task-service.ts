/**
 * 智能任务管理服务
 * 管理n8n工作流生成的任务和处理队列
 */

import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 任务接口定义
export interface Task {
  id: string
  title: string
  description?: string
  assignee_id?: string
  creator_id: string
  project_id?: string
  organization_id?: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  metadata?: any
  tags?: string[]
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

// 处理队列任务接口
export interface ProcessingTask {
  id: string
  organization_id: string
  project_id: string
  user_id: string
  batch_date: string
  task_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  result?: any
  error_message?: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export class TaskService {
  private static instance: TaskService

  private constructor() {}

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService()
    }
    return TaskService.instance
  }

  /**
   * 创建新任务
   */
  async createTask(taskData: {
    title: string
    description?: string
    assignee_id?: string
    creator_id: string
    project_id?: string
    organization_id?: string
    task_type?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    due_date?: string
    estimated_hours?: number
    metadata?: any
    tags?: string[]
  }): Promise<Task> {
    try {
      const {
        title,
        description,
        assignee_id,
        creator_id,
        project_id,
        organization_id,
        task_type = 'general',
        priority = 'medium',
        due_date,
        estimated_hours,
        metadata = {},
        tags = []
      } = taskData

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          title,
          description,
          assignee_id,
          creator_id,
          project_id,
          organization_id,
          task_type,
          priority,
          status: 'pending',
          due_date,
          estimated_hours,
          metadata,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('创建任务失败:', error)
        throw new Error('创建任务失败')
      }

      console.log('✅ 任务创建成功:', task.id)
      return task

    } catch (error) {
      console.error('创建任务异常:', error)
      throw error
    }
  }

  /**
   * 获取用户任务列表
   */
  async getUserTasks(
    userId: string,
    options: {
      status?: string
      priority?: string
      projectId?: string
      organizationId?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ tasks: Task[], totalCount: number }> {
    try {
      const {
        status,
        priority,
        projectId,
        organizationId,
        limit = 20,
        offset = 0
      } = options

      // 构建查询
      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .or(`assignee_id.eq.${userId},creator_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // 应用过滤条件
      if (status) {
        query = query.eq('status', status)
      }

      if (priority) {
        query = query.eq('priority', priority)
      }

      if (projectId) {
        query = query.eq('project_id', projectId)
      } else if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      const { data: tasks, count, error } = await query

      if (error) {
        console.error('获取用户任务失败:', error)
        throw new Error('获取任务列表失败')
      }

      console.log(`📋 获取用户任务成功，共 ${count} 个任务`)

      return {
        tasks: tasks || [],
        totalCount: count || 0
      }

    } catch (error) {
      console.error('获取用户任务异常:', error)
      throw error
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    taskId: string,
    userId: string,
    newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    updates: {
      actual_hours?: number
      metadata?: any
    } = {}
  ): Promise<boolean> {
    try {
      // 验证用户权限
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('id, assignee_id, creator_id, status')
        .eq('id', taskId)
        .single()

      if (fetchError || !task) {
        throw new Error('任务不存在')
      }

      if (task.assignee_id !== userId && task.creator_id !== userId) {
        throw new Error('无权修改此任务')
      }

      // 准备更新数据
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // 根据状态设置时间戳
      if (newStatus === 'in_progress' && task.status === 'pending') {
        updateData.started_at = new Date().toISOString()
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      // 添加其他更新
      if (updates.actual_hours !== undefined) {
        updateData.actual_hours = updates.actual_hours
      }

      if (updates.metadata) {
        updateData.metadata = updates.metadata
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) {
        console.error('更新任务状态失败:', error)
        throw new Error('更新任务状态失败')
      }

      console.log('✅ 任务状态更新成功:', { taskId, newStatus })
      return true

    } catch (error) {
      console.error('更新任务状态异常:', error)
      throw error
    }
  }

  /**
   * 获取处理队列任务
   */
  async getProcessingQueue(
    organizationId?: string,
    projectId?: string,
    status?: string,
    limit: number = 50
  ): Promise<ProcessingTask[]> {
    try {
      let query = supabase
        .from('daily_processing_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (status) {
        query = query.eq('status', status)
      } else {
        // 默认只返回待处理和处理中的任务
        query = query.in('status', ['pending', 'processing'])
      }

      const { data: tasks, error } = await query

      if (error) {
        console.error('获取处理队列失败:', error)
        throw new Error('获取处理队列失败')
      }

      console.log(`📋 获取处理队列成功，共 ${tasks?.length || 0} 个任务`)
      return tasks || []

    } catch (error) {
      console.error('获取处理队列异常:', error)
      throw error
    }
  }

  /**
   * 创建处理队列任务
   */
  async createProcessingTask(taskData: {
    organization_id: string
    project_id: string
    user_id: string
    task_type?: string
    priority?: number
    batch_date?: string
  }): Promise<ProcessingTask> {
    try {
      const {
        organization_id,
        project_id,
        user_id,
        task_type = 'qa_generation',
        priority = 5,
        batch_date = new Date().toISOString().split('T')[0]
      } = taskData

      const { data: task, error } = await supabase
        .from('daily_processing_queue')
        .insert({
          organization_id,
          project_id,
          user_id,
          task_type,
          priority,
          batch_date,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        // 如果是唯一约束冲突，说明任务已存在
        if (error.code === '23505') {
          console.log('⚠️ 处理任务已存在，跳过创建')
          throw new Error('今日处理任务已存在')
        }
        
        console.error('创建处理任务失败:', error)
        throw new Error('创建处理任务失败')
      }

      console.log('✅ 处理任务创建成功:', task.id)
      return task

    } catch (error) {
      console.error('创建处理任务异常:', error)
      throw error
    }
  }

  /**
   * 更新处理队列任务状态
   */
  async updateProcessingTask(
    taskId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    result?: any,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'processing') {
        updateData.started_at = new Date().toISOString()
      } else if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString()
      }

      if (result) {
        updateData.result = result
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error } = await supabase
        .from('daily_processing_queue')
        .update(updateData)
        .eq('id', taskId)

      if (error) {
        console.error('更新处理任务失败:', error)
        throw new Error('更新处理任务失败')
      }

      console.log('✅ 处理任务状态更新成功:', { taskId, status })
      return true

    } catch (error) {
      console.error('更新处理任务异常:', error)
      throw error
    }
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStats(
    userId: string,
    projectId?: string,
    organizationId?: string
  ): Promise<{
    totalTasks: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
    overdueTasks: number
    tasksThisWeek: number
  }> {
    try {
      // 构建基础查询条件
      let baseFilter = `assignee_id.eq.${userId}`

      if (projectId) {
        baseFilter += `,project_id.eq.${projectId}`
      } else if (organizationId) {
        baseFilter += `,organization_id.eq.${organizationId}`
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, status, due_date, created_at')
        .or(baseFilter)

      if (error) {
        console.error('获取任务统计失败:', error)
        throw new Error('获取任务统计失败')
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const stats = {
        totalTasks: tasks?.length || 0,
        pendingTasks: tasks?.filter(t => t.status === 'pending').length || 0,
        inProgressTasks: tasks?.filter(t => t.status === 'in_progress').length || 0,
        completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
        overdueTasks: tasks?.filter(t => 
          t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
        ).length || 0,
        tasksThisWeek: tasks?.filter(t => new Date(t.created_at) > weekAgo).length || 0
      }

      console.log('📊 任务统计信息:', stats)
      return stats

    } catch (error) {
      console.error('获取任务统计异常:', error)
      throw error
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    try {
      // 验证权限
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('id, creator_id, assignee_id')
        .eq('id', taskId)
        .single()

      if (fetchError || !task) {
        throw new Error('任务不存在')
      }

      if (task.creator_id !== userId && task.assignee_id !== userId) {
        throw new Error('无权删除此任务')
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('删除任务失败:', error)
        throw new Error('删除任务失败')
      }

      console.log('✅ 任务删除成功:', taskId)
      return true

    } catch (error) {
      console.error('删除任务异常:', error)
      throw error
    }
  }

  /**
   * 获取下一个待处理的队列任务
   */
  async getNextProcessingTask(): Promise<ProcessingTask | null> {
    try {
      const { data: task, error } = await supabase
        .rpc('get_next_processing_task')

      if (error) {
        console.error('获取下一个处理任务失败:', error)
        return null
      }

      if (!task || task.length === 0) {
        console.log('📋 暂无待处理任务')
        return null
      }

      console.log('📋 获取到下一个处理任务:', task[0].task_id)
      return task[0]

    } catch (error) {
      console.error('获取下一个处理任务异常:', error)
      return null
    }
  }

  /**
   * 批量创建处理队列任务
   */
  async batchCreateProcessingTasks(
    organizationId?: string,
    projectId?: string
  ): Promise<number> {
    try {
      console.log('🔄 开始批量创建处理队列任务')

      // 构建查询：从聊天历史中找出需要处理的任务
      let query = `
        INSERT INTO daily_processing_queue (organization_id, project_id, user_id, batch_date)
        SELECT DISTINCT 
          COALESCE(ch.organization_id, '00000000-0000-0000-0000-000000000000'),
          COALESCE(ch.project_id, '00000000-0000-0000-0000-000000000001'),
          ch.user_id,
          CURRENT_DATE
        FROM chat_history ch
        WHERE ch.created_at >= CURRENT_DATE - INTERVAL '1 day'
      `

      const queryParams: any[] = []

      if (organizationId) {
        query += ` AND ch.organization_id = $${queryParams.length + 1}`
        queryParams.push(organizationId)
      }

      if (projectId) {
        query += ` AND ch.project_id = $${queryParams.length + 1}`
        queryParams.push(projectId)
      }

      query += ` ON CONFLICT (organization_id, project_id, user_id, batch_date) DO NOTHING`

      const { data: result, error } = await supabase.rpc('execute_sql', {
        sql_query: query,
        params: queryParams
      })

      if (error) {
        console.error('批量创建处理任务失败:', error)
        throw new Error('批量创建处理任务失败')
      }

      const createdCount = result?.length || 0
      console.log(`✅ 批量创建处理任务完成，创建 ${createdCount} 个任务`)
      return createdCount

    } catch (error) {
      console.error('批量创建处理任务异常:', error)
      throw error
    }
  }

  /**
   * 清理过期的处理队列任务
   */
  async cleanupExpiredTasks(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { data: deletedTasks, error } = await supabase
        .from('daily_processing_queue')
        .delete()
        .lt('batch_date', cutoffDate.toISOString().split('T')[0])
        .eq('status', 'completed')
        .select('id')

      if (error) {
        console.error('清理过期任务失败:', error)
        throw new Error('清理过期任务失败')
      }

      const deletedCount = deletedTasks?.length || 0
      console.log(`🧹 清理过期任务完成，删除 ${deletedCount} 个任务`)
      return deletedCount

    } catch (error) {
      console.error('清理过期任务异常:', error)
      throw error
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskById(taskId: string, userId: string): Promise<Task | null> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      if (error || !task) {
        return null
      }

      // 验证访问权限
      if (task.assignee_id !== userId && task.creator_id !== userId) {
        const { data: user } = await supabase
          .from('users')
          .select('role_type')
          .eq('id', userId)
          .single()

        if (!user || user.role_type !== 'admin') {
          return null
        }
      }

      return task

    } catch (error) {
      console.error('获取任务详情失败:', error)
      return null
    }
  }
}