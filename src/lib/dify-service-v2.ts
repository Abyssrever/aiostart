/**
 * Dify AI服务集成 - 优化版本
 * 支持Agent App的流式响应
 */

import { AIRequest, AIResponse } from './ai-config'

export interface DifyConfig {
  baseUrl: string
  apiKey: string
  appId: string
  timeout?: number
  maxRetries?: number
}

interface DifyRequest {
  inputs: Record<string, any>
  query: string
  response_mode: 'streaming' | 'blocking'
  user: string
  auto_generate_name: boolean
  conversation_id?: string
}

interface DifyStreamEvent {
  event: string
  conversation_id?: string
  message_id?: string
  answer?: string
  metadata?: {
    usage?: {
      total_tokens?: number
      prompt_tokens?: number
      completion_tokens?: number
    }
    retriever_resources?: Array<{
      document_name: string
      content: string
      score: number
      dataset_name: string
    }>
  }
}

export class DifyServiceV2 {
  private config: DifyConfig

  constructor(config: DifyConfig) {
    this.config = {
      timeout: 90000,
      maxRetries: 3,
      ...config
    }
  }

  /**
   * 发送聊天消息
   */
  async sendChatMessage(request: AIRequest): Promise<AIResponse> {
    console.log('🚀 调用Dify API (流式模式)')
    console.log('📤 请求数据:', {
      message: request.message.substring(0, 100) + '...',
      sessionType: request.sessionType,
      userId: request.userId,
      hasHistory: !!request.conversationHistory?.length
    })

    try {
      const difyRequest: DifyRequest = {
        inputs: this.buildInputs(request),
        query: request.message,
        response_mode: 'streaming', // 使用流式模式支持Agent App
        user: request.userId || `user_${Date.now()}`,
        auto_generate_name: false
      }

      // 如果有会话ID，添加到请求中
      if (request.sessionId) {
        difyRequest.conversation_id = request.sessionId
      }

      const startTime = Date.now()
      const response = await fetch(`${this.config.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'QimingStar-Platform/1.0'
        },
        body: JSON.stringify(difyRequest),
        signal: AbortSignal.timeout(this.config.timeout || 90000)
      })

      const responseTime = Date.now() - startTime
      console.log(`📊 Dify API响应: ${response.status} (${responseTime}ms)`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Dify API错误响应:', errorText)
        
        let errorMessage = 'AI服务调用失败'
        if (response.status === 401) {
          errorMessage = 'AI服务认证失败，请检查API密钥'
        } else if (response.status === 429) {
          errorMessage = 'AI服务请求过于频繁，请稍后重试'
        } else if (response.status === 500) {
          errorMessage = 'AI服务内部错误，请稍后重试'
        }
        
        throw new Error(`${errorMessage}: ${response.status}`)
      }

      // 处理流式响应
      return await this.handleStreamResponse(response, responseTime)

    } catch (error) {
      console.error('❌ Dify API调用异常:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI服务响应超时，请稍后重试')
      }
      
      throw error
    }
  }

  /**
   * 处理流式响应
   */
  private async handleStreamResponse(response: Response, responseTime: number): Promise<AIResponse> {
    console.log('📡 处理Dify流式响应')
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取流式响应')
    }

    let fullContent = ''
    let conversationId = ''
    let messageId = ''
    let tokensUsed = 0
    let retrieverResources: any[] = []

    try {
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()
            if (jsonStr === '[DONE]') continue
            if (!jsonStr) continue

            try {
              const data: DifyStreamEvent = JSON.parse(jsonStr)
              
              console.log('📦 流式事件:', data.event, data.answer ? `(${data.answer.length}字符)` : '')
              
              // 处理不同类型的流式数据
              switch (data.event) {
                case 'message':
                case 'agent_message':
                  if (data.answer) {
                    fullContent += data.answer
                  }
                  if (data.conversation_id) conversationId = data.conversation_id
                  if (data.message_id) messageId = data.message_id
                  break
                  
                case 'message_end':
                  if (data.metadata?.usage?.total_tokens) {
                    tokensUsed = data.metadata.usage.total_tokens
                  }
                  if (data.metadata?.retriever_resources) {
                    retrieverResources = data.metadata.retriever_resources
                  }
                  break
                  
                case 'workflow_started':
                case 'workflow_finished':
                case 'node_started':
                case 'node_finished':
                  // Agent工作流事件，记录但不处理内容
                  break
                  
                default:
                  console.log('🔍 未知事件类型:', data.event)
              }
            } catch (parseError) {
              console.warn('解析流式数据失败:', parseError, 'JSON:', jsonStr.substring(0, 100))
            }
          }
        }
      }

      // 处理剩余的buffer
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6).trim()
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const data: DifyStreamEvent = JSON.parse(jsonStr)
            if (data.answer) {
              fullContent += data.answer
            }
          } catch (parseError) {
            console.warn('解析最后数据失败:', parseError)
          }
        }
      }

    } finally {
      reader.releaseLock()
    }

    console.log('📥 流式响应完成:', {
      contentLength: fullContent.length,
      conversationId,
      tokensUsed,
      hasRetrieverResources: retrieverResources.length > 0
    })

    if (!fullContent.trim()) {
      console.warn('⚠️ 未收到有效内容，可能是Agent配置问题')
      fullContent = '抱歉，我暂时无法处理您的请求。请稍后重试，或联系管理员检查AI服务配置。'
    }

    return {
      content: fullContent,
      tokensUsed,
      responseTime,
      metadata: {
        conversationId,
        messageId,
        retrieverResources,
        provider: 'dify',
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 构建Dify输入参数
   */
  private buildInputs(request: AIRequest): Record<string, any> {
    const inputs: Record<string, any> = {}

    // 用户资料
    if (request.userProfile) {
      inputs.user_name = request.userProfile.name || ''
      inputs.user_role = request.userProfile.role || ''
      inputs.user_grade = request.userProfile.grade || ''
      inputs.user_major = request.userProfile.major || ''
    }

    // 会话类型
    inputs.session_type = request.sessionType || 'general'

    // 对话历史（最近5条）
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      const recentHistory = request.conversationHistory.slice(-5)
      inputs.conversation_history = recentHistory
        .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
        .join('\n')
    }

    // 会话类型特定的系统提示
    inputs.system_prompt = this.getSystemPrompt(request.sessionType)

    // 元数据
    if (request.metadata) {
      inputs.platform = request.metadata.platform || 'qiming-star'
      inputs.timestamp = request.metadata.timestamp || new Date().toISOString()
    }

    return inputs
  }

  /**
   * 根据会话类型获取系统提示
   */
  private getSystemPrompt(sessionType?: string): string {
    const prompts = {
      'general': '你是启明星教育平台的AI助手，专注于为学生提供学习指导和生活建议。请用友好、专业的语气回答问题。',
      'learning': '你是启明星教育平台的学习助手，专门帮助学生解决学习问题，提供学习方法和知识点解释。',
      'homework': '你是启明星教育平台的作业辅导助手，帮助学生理解题目、提供解题思路，但不直接给出答案。',
      'career': '你是启明星教育平台的职业规划助手，为学生提供专业选择、职业发展和就业指导建议。',
      'mental': '你是启明星教育平台的心理健康助手，为学生提供情感支持和心理健康建议，但不能替代专业心理咨询。'
    }

    return prompts[sessionType as keyof typeof prompts] || prompts.general
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🔍 Dify服务健康检查')
      
      const response = await fetch(`${this.config.baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'QimingStar-Platform-HealthCheck/1.0'
        },
        body: JSON.stringify({
          inputs: {},
          query: 'health check',
          response_mode: 'streaming',
          user: 'health-check',
          auto_generate_name: false
        }),
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      // 只要能连接到API就认为是健康的
      return response.status === 200 || response.status === 400 // 400可能是参数问题，但服务是可用的
    } catch (error) {
      console.error('健康检查失败:', error)
      return false
    }
  }
}

// 单例模式
let difyServiceInstance: DifyServiceV2 | null = null

export function getDifyServiceV2(config: DifyConfig): DifyServiceV2 {
  if (!difyServiceInstance) {
    difyServiceInstance = new DifyServiceV2(config)
  }
  return difyServiceInstance
}