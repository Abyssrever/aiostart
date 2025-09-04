import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/task-service'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

const taskService = TaskService.getInstance()

// POST: 创建新任务
export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'task-create')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    console.log('📝 任务创建API被调用')

    const body = await request.json()
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
    } = body

    if (!title || !creator_id) {
      return NextResponse.json(
        { error: '缺少必要参数: title, creator_id' },
        { status: 400 }
      )
    }

    console.log('📤 创建任务:', {
      title,
      creator_id,
      assignee_id,
      task_type,
      priority
    })

    const task = await taskService.createTask({
      title,
      description,
      assignee_id,
      creator_id,
      project_id,
      organization_id,
      task_type,
      priority,
      due_date,
      estimated_hours,
      metadata,
      tags
    })

    return NextResponse.json({
      success: true,
      data: task,
      message: '任务创建成功'
    })

  } catch (error) {
    console.error('❌ 任务创建API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '任务创建失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// GET: 获取任务列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('project_id')
    const organizationId = searchParams.get('organization_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      )
    }

    console.log('📋 获取任务列表:', {
      userId,
      status,
      priority,
      projectId,
      organizationId,
      limit,
      offset
    })

    const result = await taskService.getUserTasks(userId, {
      status: status || undefined,
      priority: priority || undefined,
      projectId: projectId || undefined,
      organizationId: organizationId || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result.tasks,
      pagination: {
        total: result.totalCount,
        limit,
        offset,
        hasMore: result.totalCount > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ 获取任务列表API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取任务列表失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// PATCH: 更新任务状态
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      task_id,
      user_id,
      status,
      actual_hours,
      metadata
    } = body

    if (!task_id || !user_id || !status) {
      return NextResponse.json(
        { error: '缺少必要参数: task_id, user_id, status' },
        { status: 400 }
      )
    }

    console.log('🔄 更新任务状态:', {
      task_id,
      user_id,
      status,
      actual_hours
    })

    const success = await taskService.updateTaskStatus(
      task_id,
      user_id,
      status,
      {
        actual_hours,
        metadata
      }
    )

    if (!success) {
      return NextResponse.json(
        { error: '更新任务状态失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '任务状态更新成功'
    })

  } catch (error) {
    console.error('❌ 更新任务状态API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '更新任务状态失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// DELETE: 删除任务
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')
    const userId = searchParams.get('user_id')

    if (!taskId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数: task_id, user_id' },
        { status: 400 }
      )
    }

    console.log('🗑️ 删除任务:', { taskId, userId })

    const success = await taskService.deleteTask(taskId, userId)

    if (!success) {
      return NextResponse.json(
        { error: '删除任务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '任务删除成功'
    })

  } catch (error) {
    console.error('❌ 删除任务API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '删除任务失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}