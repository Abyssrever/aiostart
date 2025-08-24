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
   * N8N工作流调用
   */
  private async callN8nWebhook(request: AIRequest): Promise<AIResponse> {
    if (!this.config.webhookUrl) {
      throw new Error('N8N webhook URL未配置')
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          ...request,
          config: this.getSessionConfig(request.sessionType)
        }),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      })

      if (!response.ok) {
        throw new Error(`N8N webhook调用失败: ${response.status}`)
      }

      const data = await response.json()
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
   * 解析N8N响应
   */
  private parseN8nResponse(data: any): AIResponse {
    // 根据N8N工作流的返回格式解析响应
    // 这个格式需要根据实际的N8N工作流来调整
    return {
      content: data.response || data.message || data.content || '抱歉，无法生成回复',
      tokensUsed: data.tokensUsed || 0,
      confidence: data.confidence || 0.8,
      suggestions: data.suggestions || [],
      metadata: data.metadata || {}
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