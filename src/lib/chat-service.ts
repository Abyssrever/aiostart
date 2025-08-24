'use client'

import { supabase, supabaseAdmin, Database } from './supabase'

// 开发环境使用admin客户端绕过RLS
const dbClient = process.env.NODE_ENV === 'development' ? supabaseAdmin : supabase

// 类型定义
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type NewChatSession = Database['public']['Tables']['chat_sessions']['Insert']
export type NewChatMessage = Database['public']['Tables']['chat_messages']['Insert']

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

// 聊天服务
export class ChatService {
  // 获取用户的聊天会话
  static async getUserChatSessions(userId: string): Promise<{ data: ChatSession[] | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取聊天会话失败:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('获取聊天会话异常:', error)
      return { data: null, error }
    }
  }

  // 获取单个会话及其消息
  static async getChatSessionWithMessages(sessionId: string): Promise<{ data: ChatSessionWithMessages | null; error: any }> {
    try {
      // 获取会话信息
      const { data: session, error: sessionError } = await dbClient
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        return { data: null, error: sessionError }
      }

      // 获取消息
      const { data: messages, error: messagesError } = await dbClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        return { data: null, error: messagesError }
      }

      const sessionWithMessages: ChatSessionWithMessages = {
        ...session,
        messages: messages || []
      }

      return { data: sessionWithMessages, error: null }
    } catch (error) {
      console.error('获取会话详情异常:', error)
      return { data: null, error }
    }
  }

  // 创建新的聊天会话
  static async createChatSession(sessionData: NewChatSession): Promise<{ data: ChatSession | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single()

      if (error) {
        console.error('创建聊天会话失败:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('创建聊天会话异常:', error)
      return { data: null, error }
    }
  }

  // 添加消息到会话
  static async addMessageToSession(messageData: NewChatMessage): Promise<{ data: ChatMessage | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        console.error('添加消息失败:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('添加消息异常:', error)
      return { data: null, error }
    }
  }

  // 发送消息并获取AI回复
  static async sendMessage(
    sessionId: string, 
    userMessage: string,
    userId: string
  ): Promise<{ data: { userMessage: ChatMessage; aiMessage: ChatMessage } | null; error: any }> {
    try {
      // 1. 获取会话信息和历史消息
      const { data: sessionData, error: sessionError } = await this.getChatSessionWithMessages(sessionId)
      if (sessionError) {
        console.warn('获取会话历史失败，将不使用历史上下文:', sessionError)
      }

      // 2. 添加用户消息
      const { data: userMsg, error: userMsgError } = await this.addMessageToSession({
        session_id: sessionId,
        message_type: 'user',
        content: userMessage
      })

      if (userMsgError || !userMsg) {
        return { data: null, error: userMsgError }
      }

      // 3. 准备AI上下文
      const sessionContext = {
        sessionId: sessionId,
        sessionType: sessionData?.session_type || 'general',
        conversationHistory: sessionData?.messages?.slice(-10).map(msg => ({
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.created_at
        })) || []
      }

      // 4. 生成AI回复
      const startTime = Date.now()
      const aiResponse = await this.generateAIResponse(userMessage, userId, sessionContext)
      const responseTime = Date.now() - startTime

      // 5. 添加AI回复消息
      const { data: aiMsg, error: aiMsgError } = await this.addMessageToSession({
        session_id: sessionId,
        message_type: 'assistant',
        content: aiResponse,
        response_time_ms: responseTime,
        tokens_used: Math.floor(aiResponse.length / 4) // 粗略估算token使用量
      })

      if (aiMsgError || !aiMsg) {
        return { data: null, error: aiMsgError }
      }

      // 6. 更新会话的最后消息时间
      await dbClient
        .from('chat_sessions')
        .update({ 
          last_message_at: new Date().toISOString(),
          message_count: (sessionData?.message_count || 0) + 2
        })
        .eq('id', sessionId)

      return { 
        data: { 
          userMessage: userMsg, 
          aiMessage: aiMsg 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('发送消息异常:', error)
      return { data: null, error }
    }
  }

  // AI回复接口 - 集成AI服务管理器
  static async generateAIResponse(
    userMessage: string, 
    userId?: string, 
    sessionContext?: { 
      sessionType?: 'general' | 'okr_planning' | 'study_help' | 'career_guidance',
      sessionId?: string,
      conversationHistory?: any[]
    }
  ): Promise<string> {
    try {
      // 动态导入AI服务管理器，避免服务端渲染问题
      const { AIServiceManager } = await import('./ai-service-manager')
      const aiManager = AIServiceManager.getInstance()
      
      // 构造AI请求
      const aiRequest = {
        message: userMessage,
        userId: userId,
        sessionId: sessionContext?.sessionId,
        sessionType: sessionContext?.sessionType || 'general',
        conversationHistory: sessionContext?.conversationHistory || [],
        metadata: {
          platform: 'qiming-star',
          timestamp: new Date().toISOString()
        }
      }
      
      // 调用AI服务
      const aiResponse = await aiManager.sendAIRequest(aiRequest)
      return aiResponse.content
      
    } catch (error) {
      console.error('AI服务调用失败:', error)
      
      // 降级到临时回复逻辑
      console.log('使用临时回复逻辑作为降级方案')
      return await this.generateTemporaryResponse(userMessage, userId)
    }
  }

  // 预留的外部AI服务调用方法（n8n webhook等）
  static async callExternalAI(request: any): Promise<string> {
    // TODO: 实现n8n webhook调用
    // const response = await fetch('YOUR_N8N_WEBHOOK_URL', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // })
    // return await response.json()
    
    throw new Error('外部AI服务未配置')
  }

  // 临时回复逻辑（待AI服务接入后删除）
  static async generateTemporaryResponse(userMessage: string, userId?: string): Promise<string> {
    // 模拟AI响应延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))

    const message = userMessage.toLowerCase()
    
    if (message.includes('okr') || message.includes('目标')) {
      return `关于OKR目标管理的建议：\n\n1. 目标要具体可衡量\n2. 设置有挑战性但可实现的目标\n3. 定期回顾和调整\n4. 专注过程而非结果\n\n需要帮助制定具体目标吗？`
    }
    
    if (message.includes('学习') || message.includes('编程')) {
      return `编程学习建议：\n\n📚 理论学习：选择语言深入\n🛠️ 实践练习：每天写代码\n🎯 项目实战：完成真实项目\n\n需要推荐学习资源吗？`
    }
    
    if (message.includes('时间') || message.includes('管理')) {
      return `时间管理策略：\n\n⏰ 时间块管理\n📋 优先级排序\n🔄 定期回顾优化\n\n具体哪方面需要帮助？`
    }
    
    return `我理解你的问题。作为AI助手，建议：\n\n1. 明确具体目标\n2. 制定行动计划\n3. 保持持续学习\n4. 定期反思调整\n\n有什么需要详细了解的吗？`
  }

  // 获取或创建会话
  static async getOrCreateSession(
    userId: string, 
    sessionType: 'general' | 'okr_planning' | 'study_help' | 'career_guidance' = 'general'
  ): Promise<{ data: ChatSession | null; error: any }> {
    try {
      // 尝试获取最近的同类型会话
      const { data: existingSessions, error: fetchError } = await dbClient
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('session_type', sessionType)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) {
        return { data: null, error: fetchError }
      }

      // 如果存在最近的会话，返回它
      if (existingSessions && existingSessions.length > 0) {
        return { data: existingSessions[0], error: null }
      }

      // 否则创建新会话
      const sessionTitle = this.getSessionTitle(sessionType)
      const { data, error } = await this.createChatSession({
        user_id: userId,
        title: sessionTitle,
        session_type: sessionType,
        ai_agent_type: 'student' // 默认使用学生AI
      })

      return { data, error }
    } catch (error) {
      console.error('获取或创建会话异常:', error)
      return { data: null, error }
    }
  }

  // 根据会话类型获取标题
  static getSessionTitle(sessionType: string): string {
    const titles = {
      'general': '通用AI助手对话',
      'okr_planning': 'OKR目标规划对话',
      'study_help': '学习辅助对话', 
      'career_guidance': '职业规划对话'
    }
    return titles[sessionType as keyof typeof titles] || '新的对话'
  }

  // 归档会话
  static async archiveSession(sessionId: string): Promise<{ error: any }> {
    try {
      const { error } = await dbClient
        .from('chat_sessions')
        .update({ status: 'archived' })
        .eq('id', sessionId)

      return { error }
    } catch (error) {
      console.error('归档会话异常:', error)
      return { error }
    }
  }

  // 删除会话
  static async deleteSession(sessionId: string): Promise<{ error: any }> {
    try {
      const { error } = await dbClient
        .from('chat_sessions')
        .update({ status: 'deleted' })
        .eq('id', sessionId)

      return { error }
    } catch (error) {
      console.error('删除会话异常:', error)
      return { error }
    }
  }
}