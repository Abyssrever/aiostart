import { NextRequest, NextResponse } from 'next/server'
import { AIServiceManager } from '@/lib/ai-service-manager'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 AI Chat API 被调用')
    
    const body = await request.json()
    const { message, sessionType = 'general', conversationHistory = [] } = body
    
    console.log('📤 收到请求:', { message, sessionType })
    
    // 使用AI服务管理器处理请求
    const aiManager = AIServiceManager.getInstance()
    
    const aiRequest = {
      message,
      sessionType,
      conversationHistory,
      metadata: {
        platform: 'qiming-star',
        timestamp: new Date().toISOString()
      }
    }
    
    const aiResponse = await aiManager.sendAIRequest(aiRequest)
    
    console.log('✅ AI响应成功:', aiResponse.content)
    
    return NextResponse.json({
      success: aiResponse.success !== false,
      content: aiResponse.content,
      tokensUsed: aiResponse.tokensUsed,
      responseTime: aiResponse.responseTime,
      error: aiResponse.error
    })
    
  } catch (error) {
    console.error('❌ AI Chat API 错误:', error)
    
    return NextResponse.json({
      success: false,
      content: '抱歉，AI服务暂时不可用，请稍后重试。',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}