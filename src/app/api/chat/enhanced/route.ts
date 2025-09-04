import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'
import { ChatService } from '@/lib/chat-service'

export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'ai-chat')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    console.log('🚀 增强版AI聊天API被调用')

    const body = await request.json()
    const {
      chatInput,
      user_id,
      project_id,
      organization_id,
      sessionId,
      sessionType = 'general',
      conversationHistory = [],
      userProfile
    } = body

    console.log('📤 收到聊天请求:', {
      chatInput: chatInput?.substring(0, 50) + '...',
      user_id,
      project_id,
      organization_id
    })

    if (!chatInput || !user_id) {
      return NextResponse.json(
        { error: '缺少必要参数: chatInput, user_id' },
        { status: 400 }
      )
    }

    // 直接调用n8n工作流
    const n8nWebhookUrl = process.env.AI_WEBHOOK_URL
    if (!n8nWebhookUrl) {
      throw new Error('N8N webhook URL未配置')
    }

    console.log('🔄 调用N8N工作流:', n8nWebhookUrl)
    
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput,
          user_id,
          project_id: project_id || null,
          organization_id: organization_id || null
        }),
        signal: AbortSignal.timeout(15000) // 15秒超时，快速触发备用机制
      })

      if (!n8nResponse.ok) {
        throw new Error(`N8N工作流调用失败: ${n8nResponse.status}`)
      }

      const n8nResult = await n8nResponse.json()
      console.log('✅ N8N工作流响应:', n8nResult)

      // 返回AI回复
      return NextResponse.json({
        success: true,
        content: n8nResult.output || n8nResult.content || '抱歉，我暂时无法处理您的请求',
        responseTime: Date.now()
      })
    } catch (n8nError) {
      console.warn('⚠️ N8N工作流调用失败，使用备用响应:', n8nError instanceof Error ? n8nError.message : n8nError)
      
      // 备用AI响应机制
      const fallbackResponse = `我是AI助手，收到了您的消息："${chatInput.length > 50 ? chatInput.substring(0, 50) + '...' : chatInput}"。

目前AI工作流服务暂时不可用，这是一个测试响应。实际部署时，这里会连接到您的n8n工作流来处理更复杂的AI对话功能。

我可以帮助您回答问题、提供建议或协助完成任务。请问还有什么其他需要帮助的吗？`

      // 返回备用回复
      return NextResponse.json({
        success: true,
        content: fallbackResponse,
        responseTime: Date.now(),
        fallback: true
      })
    }

  } catch (error) {
    console.error('❌ 增强版AI聊天API错误:', error)
    
    return NextResponse.json({
      success: false,
      content: '抱歉，AI服务暂时不可用，请稍后重试。',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// GET方法：获取聊天历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const projectId = searchParams.get('project_id')
    const organizationId = searchParams.get('organization_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      )
    }

    console.log('📋 获取聊天历史:', {
      userId,
      projectId,
      organizationId,
      limit
    })

    const result = await ChatService.getUserChatSessions(userId)
    const history = result.data || []

    return NextResponse.json({
      success: true,
      data: history,
      totalCount: history.length
    })

  } catch (error) {
    console.error('❌ 获取聊天历史API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取聊天历史失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// DELETE方法：删除聊天记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversation_id')
    const userId = searchParams.get('user_id')

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数: conversation_id, user_id' },
        { status: 400 }
      )
    }

    console.log('🗑️ 删除聊天记录:', { conversationId, userId })

    // 使用ChatService删除聊天历史
    const success = await ChatService.deleteSession(conversationId)

    if (!success) {
      return NextResponse.json(
        { error: '删除聊天记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '聊天记录删除成功'
    })

  } catch (error) {
    console.error('❌ 删除聊天记录API错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '删除聊天记录失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}