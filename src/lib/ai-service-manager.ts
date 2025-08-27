/**
 * AI服务管理器
 * 统一管理不同AI服务提供商的接入
 */

import { AIServiceConfig, AIRequest, AIResponse, AIServiceStatus, AI_CONFIG, SESSION_AI_CONFIGS } from './ai-config'

export class AIServiceManager {
  private static instance: AIServiceManager
  private config: AIServiceConfig
  private serviceStatus: AIServiceStatus = AIServiceStatus.AVAILABLE

  private constructor() {
    this.config = AI_CONFIG
    // 调试输出配置信息
    console.log('🔧 AI服务管理器初始化配置:', {
      provider: this.config.provider,
      webhookUrl: this.config.webhookUrl ? '已配置' : '未配置',
      hasApiKey: !!this.config.apiKey,
      timeout: this.config.timeout
    })
  }

  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager()
    }
    return AIServiceManager.instance
  }

  /**
   * 发送AI请求（主要入口）
   */
  async sendAIRequest(request: AIRequest): Promise<AIResponse> {
    try {
      // 检查服务状态
      if (this.serviceStatus !== AIServiceStatus.AVAILABLE) {
        throw new Error(`AI服务当前不可用: ${this.serviceStatus}`)
      }

      const startTime = Date.now()

      // 根据配置选择不同的AI服务
      let response: AIResponse

      switch (this.config.provider) {
        case 'n8n':
          response = await this.callN8nWebhook(request)
          break
        case 'zapier':
          response = await this.callZapierWebhook(request)
          break
        case 'openai':
          response = await this.callOpenAI(request)
          break
        case 'claude':
          response = await this.callClaude(request)
          break
        default:
          response = await this.callCustomAPI(request)
      }

      // 添加响应时间
      response.responseTime = Date.now() - startTime

      return response
    } catch (error) {
      console.error('AI服务请求失败:', error)
      throw error
    }
  }

  /**
   * N8N工作流调用 - 适配启明星平台格式
   */
  private async callN8nWebhook(request: AIRequest): Promise<AIResponse> {
    if (!this.config.webhookUrl) {
      throw new Error('N8N webhook URL未配置')
    }

    try {
      // 构建N8N期望的请求格式
      const n8nRequest = {
        userMessage: request.message,
        userId: request.userId,
        sessionId: request.sessionId,
        sessionType: request.sessionType || 'general',
        userProfile: request.userProfile,
        conversationHistory: request.conversationHistory || [],
        metadata: request.metadata
      }

      console.log('🚀 调用N8N工作流:', this.config.webhookUrl)
      console.log('📤 请求数据:', n8nRequest)

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'QimingStar-Platform/1.0',
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8'
        },
        body: JSON.stringify(n8nRequest),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      })

      console.log(`📊 N8N响应状态: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`N8N webhook失败: ${response.status}`, errorText)
        throw new Error(`N8N webhook调用失败: ${response.status} - ${errorText}`)
      }

      const responseText = await response.text()
      console.log('📥 N8N原始响应:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
        console.log('📥 N8N解析后数据:', data)
      } catch (error) {
        console.log('⚠️ N8N响应不是JSON格式，直接使用文本内容')
        data = { response: responseText }
      }
      
      return this.parseN8nResponse(data)
    } catch (error) {
      console.error('N8N webhook调用异常:', error)
      throw error
    }
  }

  /**
   * Zapier webhook调用
   */
  private async callZapierWebhook(request: AIRequest): Promise<AIResponse> {
    // TODO: 实现Zapier webhook调用逻辑
    throw new Error('Zapier集成尚未实现')
  }

  /**
   * OpenAI API调用
   */
  private async callOpenAI(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API Key未配置')
    }

    try {
      const messages = [
        {
          role: 'system',
          content: this.getSessionConfig(request.sessionType).systemPrompt
        }
      ]

      // 添加对话历史
      if (request.conversationHistory) {
        messages.push(...request.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })))
      }

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: request.message
      })

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        }),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      })

      if (!response.ok) {
        throw new Error(`OpenAI API调用失败: ${response.status}`)
      }

      const data = await response.json()
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage.total_tokens,
        metadata: data
      }
    } catch (error) {
      console.error('OpenAI API调用异常:', error)
      throw error
    }
  }

  /**
   * Claude API调用
   */
  private async callClaude(request: AIRequest): Promise<AIResponse> {
    // TODO: 实现Claude API调用逻辑
    throw new Error('Claude集成尚未实现')
  }

  /**
   * 自定义API调用
   */
  private async callCustomAPI(request: AIRequest): Promise<AIResponse> {
    if (!this.config.apiEndpoint) {
      throw new Error('自定义API端点未配置')
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      })

      if (!response.ok) {
        throw new Error(`自定义API调用失败: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('自定义API调用异常:', error)
      throw error
    }
  }

  /**
   * 解析N8N响应 - 适配启明星平台
   */
  private parseN8nResponse(data: any): AIResponse {
    console.log('🔍 解析N8N响应:', data)
    
    // 根据您的N8N工作流返回格式：{"response": "内容"}
    let content = '抱歉，AI服务暂时不可用，请稍后再试。'
    
    if (data && typeof data === 'object') {
      // 优先使用response字段（您的N8N工作流返回格式）
      if (data.response) {
        content = data.response
      } else if (data.responds) {
        // 处理N8N工作流返回的responds字段
        content = data.responds
      } else if (data.content) {
        content = data.content
      } else if (data.message) {
        content = data.message
      } else if (typeof data === 'string') {
        content = data
      }
    }
    
    console.log('✅ 解析出的AI回复:', content)
    
    return {
      content: content,
      tokensUsed: data.tokensUsed || Math.floor(content.length / 4), // 粗略估算
      responseTime: data.responseTime || 0,
      confidence: data.confidence || 0.9,
      suggestions: data.suggestions || [],
      metadata: {
        source: 'n8n-workflow',
        timestamp: new Date().toISOString(),
        ...data.metadata
      }
    }
  }

  /**
   * 获取会话类型对应的AI配置
   */
  private getSessionConfig(sessionType?: string) {
    return SESSION_AI_CONFIGS[sessionType as keyof typeof SESSION_AI_CONFIGS] || SESSION_AI_CONFIGS.general
  }

  /**
   * 更新AI服务配置
   */
  updateConfig(newConfig: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): AIServiceStatus {
    return this.serviceStatus
  }

  /**
   * 设置服务状态
   */
  setServiceStatus(status: AIServiceStatus) {
    this.serviceStatus = status
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      // 发送简单的测试请求
      const testRequest: AIRequest = {
        message: 'test',
        metadata: {
          platform: 'qiming-star',
          timestamp: new Date().toISOString()
        }
      }

      await this.sendAIRequest(testRequest)
      this.serviceStatus = AIServiceStatus.AVAILABLE
      return true
    } catch (error) {
      this.serviceStatus = AIServiceStatus.ERROR
      return false
    }
  }
}