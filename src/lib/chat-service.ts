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
  static async addMessageToSession(messageData: NewChatMessage & { user_id?: string }): Promise<{ data: ChatMessage | null; error: any }> {
    try {
      // 转换字段名：message_type -> role，但保留message_type用于前端显示
      const adaptedData = {
        ...messageData,
        role: messageData.message_type
        // 不移除message_type字段，让前端可以正确识别消息类型
      };
      
      // 确保有user_id字段
      if (!adaptedData.user_id && messageData.session_id) {
        // 从session获取user_id
        const { data: session } = await dbClient
          .from('chat_sessions')
          .select('user_id')
          .eq('id', messageData.session_id)
          .single();
          
        if (session) {
          adaptedData.user_id = session.user_id;
        }
      }

      const { data, error } = await dbClient
        .from('chat_messages')
        .insert(adaptedData)
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
        user_id: userId,
        role: 'user',
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
          role: msg.role === 'user' ? 'user' : 'assistant', // 使用role字段而不是message_type
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
        user_id: userId,
        role: 'assistant',
        message_type: 'assistant',
        content: aiResponse,
        response_time_ms: responseTime,
        tokens_used: Math.floor(aiResponse.length / 4) // 粗略估算token使用量
      })

      if (aiMsgError || !aiMsg) {
        return { data: null, error: aiMsgError }
      }

      // 6. 数据库触发器会自动更新会话的最后消息时间和消息计数
      // 无需手动更新，触发器已处理

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

  // AI回复接口 - 通过API路由调用AI服务
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
      console.log('🤖 调用AI服务生成回复 - 通过API路由')
      console.log('📤 用户消息:', userMessage)
      
      // 使用API路由调用AI服务，确保在服务端环境中执行
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          sessionType: sessionContext?.sessionType || 'general',
          conversationHistory: sessionContext?.conversationHistory || []
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ AI回复成功:', data.content)
        return data.content
      } else {
        // 如果服务返回了内容（即使success为false），直接返回内容而不是抛出错误
        if (data.content) {
          console.warn('⚠️ AI服务部分失败，但返回了响应:', data.content)
          return data.content
        }
        throw new Error(data.error || 'AI服务调用失败')
      }
      
    } catch (error) {
      console.error('❌ AI服务调用失败:', error)
      
      // 降级到临时回复逻辑
      console.log('⚠️ 使用降级回复逻辑')
      return await this.generateTemporaryResponse(userMessage, userId)
    }
  }

  // 直接AI对话方法 - 通过API路由调用
  static async directAIChat(
    userMessage: string,
    sessionType: 'general' | 'okr_planning' | 'study_help' | 'career_guidance' = 'general',
    conversationHistory: any[] = [],
    sessionId?: string,
    userId?: string,
    userProfile?: any
  ): Promise<string> {
    console.log('🚀 直接AI对话模式 - 通过API路由')
    
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          sessionType,
          conversationHistory,
          sessionId,
          userId,
          userProfile
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.content
      } else {
        // 如果服务返回了内容（即使success为false），直接返回内容而不是抛出错误
        if (data.content) {
          console.warn('⚠️ AI服务部分失败，但返回了响应:', data.content)
          return data.content
        }
        throw new Error(data.error || 'AI服务调用失败')
      }
      
    } catch (error) {
      console.error('❌ API调用失败:', error)
      return await this.generateTemporaryResponse(userMessage, 'temp-user')
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

  // 降级回复逻辑（当N8N服务不可用时使用）
  static async generateTemporaryResponse(userMessage: string, userId?: string): Promise<string> {
    console.log('⚠️ 使用降级回复逻辑 - N8N服务可能不可用')
    
    // 简短的降级回复，提示用户稍后重试
    return `抱歉，AI服务暂时不可用，请稍后重试。\n\n如果问题持续，请联系技术支持。\n\n您的问题："${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`
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
        session_type: sessionType
        // 暂时移除 ai_agent_type 字段，直到数据库添加该列
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
