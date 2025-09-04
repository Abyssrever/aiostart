/**
 * Dify AI服务集成
 * 专门处理与Dify API的交互
 */

import { AIRequest, AIResponse, DifyConfig, DifyRequest, DifyResponse } from './ai-config'

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

export class DifyService {
  private config: DifyConfig

  constructor(config: DifyConfig) {
    this.config = config
    this.validateConfig()
  }

  private validateConfig() {
    if (!this.config.apiKey) {
      throw new Error('Dify API Key未配置')
    }
    if (!this.config.baseUrl) {
      throw new Error('Dify Base URL未配置')
    }
    if (!this.config.appId) {
      throw new Error('Dify App ID未配置')
    }
  }

  /**
   * 发送聊天消息到Dify
   */
  async sendChatMessage(request: AIRequest): Promise<AIResponse> {
    try {
      console.log('🚀 调用Dify聊天API')
      console.log('📤 请求参数:', {
        message: request.message?.substring(0, 100) + '...',
        sessionType: request.sessionType,
        userId: request.userId
      })

      const difyRequest: DifyRequest = {
        inputs: this.buildInputs(request),
        query: request.message,
        response_mode: 'streaming', // 改为streaming模式，兼容Agent App
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
        signal: AbortSignal.timeout(90000) // 90秒超时
      })

      const responseTime = Date.now() - startTime
      console.log(`📊 Dify API响应: ${response.status} (${responseTime}ms)`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Dify API错误响应:', errorText)
        
        // 根据HTTP状态码提供更友好的错误信息
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
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        return await this.handleStreamResponse(response, responseTime)
      } else {
        // 处理普通JSON响应
        const data: DifyResponse = await response.json()
        console.log('📥 Dify响应数据:', {
          hasAnswer: !!data.answer,
          answerLength: data.answer?.length || 0,
          conversationId: data.conversation_id,
          tokensUsed: data.metadata?.usage?.total_tokens
        })

        return this.parseResponse(data, responseTime)
      }
    } catch (error) {
      console.error('❌ Dify API调用异常:', error)
      
      // 网络错误处理
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      }
      
      // 超时错误处理
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AI服务响应超时，请稍后重试')
      }
      
      throw error
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
      'okr_planning': '你是OKR目标管理专家，帮助学生制定、追踪和优化学习目标。请提供具体、可执行的建议。',
      'study_help': '你是专业的学习辅导AI，擅长编程、算法、项目实践等技术领域指导。请提供详细的学习建议和解决方案。',
      'career_guidance': '你是职业规划顾问，为学生提供求职、面试、职业发展等方面的专业建议。请结合当前就业市场情况给出建议。'
    }

    return prompts[sessionType as keyof typeof prompts] || prompts.general
  }

  /**
   * 解析Dify响应
   */
  private parseResponse(data: DifyResponse, responseTime: number): AIResponse {
    let content = '抱歉，AI服务暂时不可用，请稍后再试。'
    
    // 提取回答内容
    if (data.answer) {
      content = data.answer
    } else if (data.message_id) {
      // 如果没有answer但有message_id，可能是流式响应的一部分
      content = '收到您的消息，正在处理中...'
    }

    // 提取token使用量
    let tokensUsed = 0
    if (data.metadata?.usage) {
      tokensUsed = data.metadata.usage.total_tokens || 
                  (data.metadata.usage.prompt_tokens || 0) + 
                  (data.metadata.usage.completion_tokens || 0)
    }

    // 提取知识库检索结果
    const retrieverResources = data.metadata?.retriever_resources || []
    const hasKnowledgeBase = retrieverResources.length > 0

    return {
      content,
      success: true,
      tokensUsed: tokensUsed || Math.floor(content.length / 4),
      responseTime,
      confidence: hasKnowledgeBase ? 0.95 : 0.85, // 有知识库支持的回答置信度更高
      suggestions: [], // Dify暂不支持建议，可以后续扩展
      metadata: {
        source: 'dify-api',
        conversationId: data.conversation_id,
        messageId: data.message_id,
        timestamp: new Date().toISOString(),
        usage: data.metadata?.usage,
        retrieverResources: retrieverResources,
        hasKnowledgeBase,
        mode: data.mode || 'chat'
      }
    }
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(conversationId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/conversations/${conversationId}/messages`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`获取对话历史失败: ${response.status}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('获取Dify对话历史失败:', error)
      return []
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 发送一个简单的测试请求
      const testRequest: AIRequest = {
        message: 'hello',
        sessionType: 'general',
        metadata: {
          platform: 'qiming-star',
          timestamp: new Date().toISOString()
        }
      }

      await this.sendChatMessage(testRequest)
      return true
    } catch (error) {
      console.error('Dify健康检查失败:', error)
      return false
    }
  }

  /**
   * 获取应用信息
   */
  async getAppInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/parameters`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`获取应用信息失败: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('获取Dify应用信息失败:', error)
      return null
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
        const lines = buffer.split('\
')
        
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
}

// 导出单例实例
let difyServiceInstance: DifyService | null = null

export function getDifyService(config?: DifyConfig): DifyService {
  if (!difyServiceInstance && config) {
    difyServiceInstance = new DifyService(config)
  }
  
  if (!difyServiceInstance) {
    throw new Error('Dify服务未初始化，请先提供配置')
  }
  
  return difyServiceInstance
}