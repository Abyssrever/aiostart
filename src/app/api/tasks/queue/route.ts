import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/task-service'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

const taskService = TaskService.getInstance()

// GET: 获取处理队列状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('📋 获取处理队列:', {
      organizationId,
      projectId,
      status,
      limit
    })

    const queueTasks = await taskService.getProcessingQueue(
      organizationId || undefined,
      projectId || undefined,
      status || undefined,
      limit
    )

    // 按状态分组统计
    const stats = {
      pending: queueTasks.filter(t => t.status === 'pending').length,
      processing: queueTasks.filter(t => t.status === 'processing').length,
      completed: queueTasks.filter(t => t.status === 'completed').length,
      failed: queueTasks.filter(t => t.status === 'failed').length,
      total: queueTasks.length
    }

    return NextResponse.json({
      success: true,
      data: queueTasks,
      stats,
      message: `获取到 ${queueTasks.length} 个队列任务`
    })

  } catch (error) {
    console.error('❌ 获取处理队列API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取处理队列失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// POST: 创建处理队列任务
export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'queue-create')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    console.log('🔄 创建处理队列任务API被调用')

    const body = await request.json()
    const {
      organization_id,
      project_id,
      user_id,
      task_type = 'qa_generation',
      priority = 5,
      batch_date,
      batch_mode = false
    } = body

    if (batch_mode) {
      // 批量创建模式
      console.log('📦 批量创建处理队列任务')
      
      const createdCount = await taskService.batchCreateProcessingTasks(
        organization_id,
        project_id
      )

      return NextResponse.json({
        success: true,
        message: `批量创建完成，共创建 ${createdCount} 个任务`,
        data: {
          createdCount,
          batch_mode: true
        }
      })
    } else {
      // 单个任务创建模式
      if (!organization_id || !project_id || !user_id) {
        return NextResponse.json(
          { error: '缺少必要参数: organization_id, project_id, user_id' },
          { status: 400 }
        )
      }

      console.log('📝 创建单个处理队列任务')

      const task = await taskService.createProcessingTask({
        organization_id,
        project_id,
        user_id,
        task_type,
        priority,
        batch_date
      })

      return NextResponse.json({
        success: true,
        data: task,
        message: '处理队列任务创建成功'
      })
    }

  } catch (error) {
    console.error('❌ 创建处理队列任务API错误:', error)
    
    // 特殊处理重复任务错误
    if (error instanceof Error && error.message.includes('已存在')) {
      return NextResponse.json({
        success: false,
        error: '今日处理任务已存在',
        code: 'TASK_EXISTS'
      }, { status: 409 })
    }
    
    return NextResponse.json({
      success: false,
      error: '创建处理队列任务失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// PATCH: 更新处理队列任务状态
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      task_id,
      status,
      result,
      error_message
    } = body

    if (!task_id || !status) {
      return NextResponse.json(
        { error: '缺少必要参数: task_id, status' },
        { status: 400 }
      )
    }

    console.log('🔄 更新处理队列任务状态:', {
      task_id,
      status,
      hasResult: !!result,
      hasError: !!error_message
    })

    const success = await taskService.updateProcessingTask(
      task_id,
      status,
      result,
      error_message
    )

    if (!success) {
      return NextResponse.json(
        { error: '更新处理队列任务失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '处理队列任务状态更新成功'
    })

  } catch (error) {
    console.error('❌ 更新处理队列任务API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '更新处理队列任务失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}