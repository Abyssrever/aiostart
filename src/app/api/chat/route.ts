import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    console.log('Chat API called with action:', action)

    switch (action) {
      case 'sendMessage':
        return await handleSendMessage(data)
      case 'createSession':
        return await handleCreateSession(data)
      case 'getSession':
        return await handleGetSession(data)
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function handleSendMessage(data: any) {
  const { sessionId, userMessage, userId, sessionType } = data

  try {
    // 1. 添加用户消息到数据库
    const userMessageData = {
      session_id: sessionId,
      message_type: 'user' as const,
      content: userMessage,
      metadata: {},
      tokens_used: null,
      response_time_ms: null
    }

    const { data: userMsgResult, error: userMsgError } = await supabaseAdmin
      .from('chat_messages')
      .insert(userMessageData)
      .select()
      .single()

    if (userMsgError) {
      throw new Error(`Failed to insert user message: ${userMsgError.message}`)
    }

    // 2. 调用AI服务获取回复
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        sessionType: sessionType || 'general',
        conversationHistory: []
      })
    })

    const aiResult = await aiResponse.json()
    const aiContent = aiResult.success ? aiResult.content : '抱歉，AI服务暂时不可用。'

    // 3. 添加AI回复到数据库
    const aiMessageData = {
      session_id: sessionId,
      message_type: 'assistant' as const,
      content: aiContent,
      metadata: aiResult.metadata || {},
      tokens_used: aiResult.tokensUsed || null,
      response_time_ms: aiResult.responseTime || null
    }

    const { data: aiMsgResult, error: aiMsgError } = await supabaseAdmin
      .from('chat_messages')
      .insert(aiMessageData)
      .select()
      .single()

    if (aiMsgError) {
      throw new Error(`Failed to insert AI message: ${aiMsgError.message}`)
    }

    // 4. 数据库触发器会自动更新会话的最后消息时间和消息计数
    // 只需手动更新 updated_at 字段
    await supabaseAdmin
      .from('chat_sessions')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    return NextResponse.json({
      success: true,
      userMessage: userMsgResult,
      aiMessage: aiMsgResult
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function handleCreateSession(data: any) {
  const { userId, sessionType, title } = data

  try {
    const sessionData = {
      user_id: userId,
      session_type: sessionType || 'general',
      title: title || `${sessionType || 'general'} 会话`,
      status: 'active',
      ai_agent_type: 'general'
    }

    const { data: session, error } = await supabaseAdmin
      .from('chat_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

async function handleGetSession(data: any) {
  const { sessionId } = data

  try {
    // 获取会话信息
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`)
    }

    // 获取会话消息
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      throw new Error(`Failed to get messages: ${messagesError.message}`)
    }

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        messages: messages || []
      }
    })

  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}