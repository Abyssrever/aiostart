import { NextRequest, NextResponse } from 'next/server'
import { AI_CONFIG } from '@/lib/ai-config'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 测试Dify API集成')
    
    const body = await request.json()
    const { message = 'Hello, this is a test message' } = body
    
    // 检查Dify配置
    if (!AI_CONFIG.dify?.apiKey || !AI_CONFIG.dify?.baseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Dify配置不完整',
        config: {
          hasApiKey: !!AI_CONFIG.dify?.apiKey,
          hasBaseUrl: !!AI_CONFIG.dify?.baseUrl,
          hasAppId: !!AI_CONFIG.dify?.appId
        }
      }, { status: 400 })
    }
    
    console.log('📋 Dify配置检查:', {
      provider: AI_CONFIG.provider,
      baseUrl: AI_CONFIG.dify.baseUrl,
      hasApiKey: !!AI_CONFIG.dify.apiKey,
      appId: AI_CONFIG.dify.appId
    })
    
    // 创建Dify服务实例（使用优化版本支持Agent App）
    const { getDifyServiceV2 } = await import('@/lib/dify-service-v2')
    const difyService = getDifyServiceV2(AI_CONFIG.dify)
    
    // 构建测试请求
    const testRequest = {
      message,
      sessionType: 'general' as const,
      userId: 'test-user',
      userProfile: {
        name: '测试用户',
        role: 'student'
      },
      metadata: {
        platform: 'qiming-star',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('📤 发送测试请求:', testRequest)
    
    // 调用Dify API
    const startTime = Date.now()
    const response = await difyService.sendChatMessage(testRequest)
    const totalTime = Date.now() - startTime
    
    console.log('✅ Dify API测试成功')
    
    return NextResponse.json({
      success: true,
      message: 'Dify API测试成功',
      response: {
        content: response.content,
        tokensUsed: response.tokensUsed,
        responseTime: totalTime,
        metadata: response.metadata
      },
      config: {
        provider: AI_CONFIG.provider,
        baseUrl: AI_CONFIG.dify.baseUrl,
        appId: AI_CONFIG.dify.appId
      }
    })
    
  } catch (error) {
    console.error('❌ Dify API测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : undefined,
      config: {
        provider: AI_CONFIG.provider,
        hasApiKey: !!AI_CONFIG.dify?.apiKey,
        baseUrl: AI_CONFIG.dify?.baseUrl,
        appId: AI_CONFIG.dify?.appId
      }
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 健康检查端点
    console.log('🔍 Dify服务健康检查')
    
    if (!AI_CONFIG.dify?.apiKey || !AI_CONFIG.dify?.baseUrl) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Dify配置不完整',
        config: {
          hasApiKey: !!AI_CONFIG.dify?.apiKey,
          hasBaseUrl: !!AI_CONFIG.dify?.baseUrl,
          hasAppId: !!AI_CONFIG.dify?.appId
        }
      }, { status: 503 })
    }
    
    const { getDifyServiceV2 } = await import('@/lib/dify-service-v2')
    const difyService = getDifyServiceV2(AI_CONFIG.dify)
    const isHealthy = await difyService.healthCheck()
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Dify服务运行正常',
        timestamp: new Date().toISOString(),
        config: {
          provider: AI_CONFIG.provider,
          baseUrl: AI_CONFIG.dify.baseUrl,
          appId: AI_CONFIG.dify.appId
        }
      })
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Dify服务健康检查失败',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
  } catch (error) {
    console.error('❌ Dify健康检查失败:', error)
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}