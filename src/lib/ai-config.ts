/**
 * AI服务配置文件
 * 用于配置和管理AI工作流集成（n8n、Zapier等）
 */

// Dify 服务配置接口
export interface DifyConfig {
  apiKey: string
  baseUrl: string
  appId: string
  conversationId?: string
  knowledgeBaseId?: string
  enableKnowledgeBase?: boolean
}

// AI服务提供商配置
export interface AIServiceConfig {
  provider: 'n8n' | 'zapier' | 'custom' | 'openai' | 'claude' | 'dify'
  webhookUrl?: string
  apiKey?: string
  apiEndpoint?: string
  model?: string
  maxTokens?: number
  temperature?: number
  timeout?: number
  // N8N多工作流配置
  n8nWorkflows?: {
    chat: string           // 聊天对话工作流
    documentUpload: string // 文档上传工作流
    knowledgeSearch: string // 知识库搜索工作流
    qaGeneration: string   // Q&A生成工作流
    projectSummary: string // 项目智慧库工作流
    orgSummary: string     // 组织智慧库工作流
  }
  // Dify配置
  dify?: DifyConfig
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

// Dify API 请求数据结构
export interface DifyRequest {
  inputs: Record<string, any>
  query: string
  response_mode: 'streaming' | 'blocking'
  conversation_id?: string
  user: string
  auto_generate_name?: boolean
}

// Dify API 响应数据结构
export interface DifyResponse {
  event?: string
  task_id?: string
  id?: string
  message_id?: string
  conversation_id?: string
  mode?: string
  answer?: string
  metadata?: {
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
    retriever_resources?: Array<{
      position: number
      dataset_id: string
      dataset_name: string
      document_id: string
      document_name: string
      data_source_type: string
      segment_id: string
      score: number
      content: string
    }>
  }
  created_at?: number
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
  AI_WEBHOOK_URL: process.env.AI_WEBHOOK_URL,
  AI_WEBHOOK_URL_STATUS: process.env.AI_WEBHOOK_URL ? '已配置' : '未配置',
  AI_TIMEOUT: process.env.AI_TIMEOUT
})
// 环境变量AI配置
export const AI_CONFIG: AIServiceConfig = {
  provider: (process.env.AI_PROVIDER as any) || 'dify',
  webhookUrl: process.env.AI_WEBHOOK_URL || '',
  apiKey: process.env.AI_API_KEY || '',
  apiEndpoint: process.env.AI_API_ENDPOINT || '',
  model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.AI_TIMEOUT || '90000'),
  // N8N工作流端点配置（备用）
  n8nWorkflows: {
    chat: process.env.N8N_CHAT_WEBHOOK || process.env.AI_WEBHOOK_URL || '',
    documentUpload: process.env.N8N_DOCUMENT_UPLOAD_WEBHOOK || '',
    knowledgeSearch: process.env.N8N_KNOWLEDGE_SEARCH_WEBHOOK || '',
    qaGeneration: process.env.N8N_QA_GENERATION_WEBHOOK || '',
    projectSummary: process.env.N8N_PROJECT_SUMMARY_WEBHOOK || '',
    orgSummary: process.env.N8N_ORG_SUMMARY_WEBHOOK || ''
  },
  // Dify配置
  dify: {
    apiKey: process.env.DIFY_API_KEY || 'app-kCJGgAvqqvbfJV1AJ95HIYMz',
    baseUrl: process.env.DIFY_BASE_URL || 'https://dify.aipfuture.com/v1',
    appId: process.env.DIFY_APP_ID || 'app-kCJGgAvqqvbfJV1AJ95HIYMz',
    conversationId: process.env.DIFY_CONVERSATION_ID,
    knowledgeBaseId: process.env.DIFY_KNOWLEDGE_BASE_ID,
    enableKnowledgeBase: process.env.DIFY_ENABLE_KNOWLEDGE_BASE === 'true'
  }
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