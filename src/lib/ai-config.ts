/**
 * AI服务配置文件
 * 用于配置和管理AI工作流集成（n8n、Zapier等）
 */

// AI服务提供商配置
export interface AIServiceConfig {
  provider: 'n8n' | 'zapier' | 'custom' | 'openai' | 'claude'
  webhookUrl?: string
  apiKey?: string
  apiEndpoint?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
}

// AI请求数据结构
export interface AIRequest {
  message: string
  userId?: string
  sessionId?: string
  sessionType?: 'general' | 'okr_planning' | 'study_help' | 'career_guidance'
  userProfile?: {
    name?: string
    role?: string
    grade?: string
    major?: string
  }
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  metadata?: {
    platform: string
    timestamp: string
    clientInfo?: any
  }
}

// AI响应数据结构
export interface AIResponse {
  content: string
  success?: boolean
  error?: string
  tokensUsed?: number
  responseTime?: number
  confidence?: number
  suggestions?: string[]
  metadata?: any
}

// 默认AI服务配置
export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  provider: 'n8n',
  timeout: 30000, // 30秒超时
  maxTokens: 2000,
  temperature: 0.7
}

// 调试环境变量
console.log('🌍 环境变量调试:', {
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_WEBHOOK_URL: process.env.AI_WEBHOOK_URL ? '已配置' : '未配置',
  AI_TIMEOUT: process.env.AI_TIMEOUT
})
// 环境变量AI配置
export const AI_CONFIG: AIServiceConfig = {
  provider: (process.env.AI_PROVIDER as any) || 'n8n',
  webhookUrl: process.env.AI_WEBHOOK_URL || '',
  apiKey: process.env.AI_API_KEY || '',
  apiEndpoint: process.env.AI_API_ENDPOINT || '',
  model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.AI_TIMEOUT || '30000')
}

// 会话类型对应的AI Agent配置
export const SESSION_AI_CONFIGS = {
  'general': {
    systemPrompt: '你是启明星教育平台的AI助手，专注于为学生提供学习指导和生活建议。',
    model: 'general-assistant',
    temperature: 0.7
  },
  'okr_planning': {
    systemPrompt: '你是OKR目标管理专家，帮助学生制定、追踪和优化学习目标。',
    model: 'okr-specialist', 
    temperature: 0.6
  },
  'study_help': {
    systemPrompt: '你是专业的学习辅导AI，擅长编程、算法、项目实践等技术领域指导。',
    model: 'study-tutor',
    temperature: 0.5
  },
  'career_guidance': {
    systemPrompt: '你是职业规划顾问，为学生提供求职、面试、职业发展等方面的专业建议。',
    model: 'career-advisor',
    temperature: 0.6
  }
}

// AI服务状态枚举
export enum AIServiceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy', 
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

// AI服务监控配置
export interface AIServiceHealth {
  status: AIServiceStatus
  responseTime: number
  successRate: number
  lastCheck: string
  errorMessage?: string
}