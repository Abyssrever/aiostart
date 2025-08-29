'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, Minimize2, Maximize2, RotateCcw, Bot } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { ChatService, ChatMessage, ChatSession } from '@/lib/chat-service'
import AIMessage from '@/components/AIMessage'

interface AIDialogWindowRealProps {
  isOpen: boolean
  onClose: () => void
  sessionType?: 'general' | 'okr_planning' | 'study_help' | 'career_guidance'
}

const AIDialogWindowReal: React.FC<AIDialogWindowRealProps> = ({ 
  isOpen, 
  onClose, 
  sessionType = 'general'
}) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // 加载或创建会话
  const loadSession = async () => {
    if (!user?.id) return

    setSessionLoading(true)
    try {
      const { data: session, error } = await ChatService.getOrCreateSession(user.id, sessionType)
      
      if (error) {
        console.error('加载会话失败:', error)
        return
      }

      if (session) {
        setCurrentSession(session)
        
        // 加载会话消息
        const { data: sessionWithMessages, error: messagesError } = await ChatService.getChatSessionWithMessages(session.id)
        
        if (messagesError) {
          console.error('加载消息失败:', messagesError)
        } else if (sessionWithMessages) {
          setMessages(sessionWithMessages.messages || [])
        }
      }
    } catch (error) {
      console.error('加载会话异常:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  // 当会话打开时加载数据
  useEffect(() => {
    if (isOpen) {
      if (user?.id) {
        // 用户已登录，加载数据库会话
        loadSession()
      } else {
        // 用户未登录，从localStorage加载临时会话
        loadTemporarySession()
      }
    }
  }, [isOpen, user?.id, sessionType])
  
  // 加载临时会话（未登录用户）
  const loadTemporarySession = () => {
    setSessionLoading(true)
    try {
      const key = `temp_chat_${sessionType}`
      const savedMessages = localStorage.getItem(key)
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.error('加载临时会话失败:', error)
    } finally {
      setSessionLoading(false)
    }
  }
  
  // 保存临时会话（未登录用户）
  const saveTemporarySession = (newMessages: ChatMessage[]) => {
    try {
      const key = `temp_chat_${sessionType}`
      localStorage.setItem(key, JSON.stringify(newMessages))
    } catch (error) {
      console.error('保存临时会话失败:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    setIsLoading(true)
    const userMessageContent = inputValue.trim()
    setInputValue('')

    try {
      // 如果有session，使用数据库方式；否则使用直接AI对话
      if (currentSession && user?.id) {
        // 先立即显示用户消息
        const tempUserMessage: ChatMessage = {
          id: Date.now().toString(),
          session_id: currentSession.id,
          user_id: user.id,
          role: 'user' as const,
          message_type: 'user' as const,
          content: userMessageContent,
          metadata: {},
          tokens_used: null,
          response_time_ms: null,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempUserMessage])

        const { data, error } = await ChatService.sendMessage(
          currentSession.id,
          userMessageContent,
          user.id
        )

        if (error) {
          console.error('发送消息失败:', error)
          // 恢复输入内容，移除临时显示的用户消息
          setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id))
          setInputValue(userMessageContent)
          return
        }

        if (data) {
          // 替换临时用户消息为数据库版本，并添加AI消息
          setMessages(prev => {
            const withoutTemp = prev.filter(msg => msg.id !== tempUserMessage.id)
            return [...withoutTemp, data.userMessage, data.aiMessage]
          })
        }
      } else {
        // 添加用户消息到UI（临时显示）
        const tempUserMessage: ChatMessage = {
          id: Date.now().toString(),
          session_id: 'temp',
          user_id: user?.id || 'temp-user',
          role: 'user' as const,
          message_type: 'user' as const,
          content: userMessageContent,
          metadata: {},
          tokens_used: null,
          response_time_ms: null,
          created_at: new Date().toISOString()
        }
        const updatedMessages = [...messages, tempUserMessage]
        setMessages(updatedMessages)
        
        // 保存临时会话（未登录用户）
        if (!user?.id) {
          saveTemporarySession(updatedMessages)
        }

        console.log('🚀 发送消息给AI:', userMessageContent)
        
        // 开始流式响应
        setIsStreaming(true)
        setStreamingMessage('')
        
        try {
          // 直接调用AI，跳过数据库
          const aiReply = await ChatService.directAIChat(
            userMessageContent,
            sessionType,
            messages.map(msg => ({
              role: msg.message_type === 'user' ? 'user' : 'assistant',
              content: msg.content,
              timestamp: msg.created_at
            })),
            currentSession?.id || `temp-${sessionType}-${Date.now()}`, // sessionId
            user?.id,  // userId
            user ? {   // userProfile
              name: user.name,
              email: user.email,
              roles: user.roles,
              student_id: user.student_id,
              grade: user.grade,
              major: user.major,
              class_name: user.class_name
            } : undefined
          )

          console.log('✅ 收到AI回复:', aiReply)

          // 流式显示AI回复
          let currentText = ''
          const chars = aiReply.split('')
          
          for (let i = 0; i < chars.length; i++) {
            currentText += chars[i]
            setStreamingMessage(currentText)
            
            // 控制流式显示速度
            await new Promise(resolve => setTimeout(resolve, 30))
          }
          
          // 流式显示完成后，添加正式消息并清除流式状态
          setTimeout(() => {
            const aiMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              session_id: 'temp',
              user_id: user?.id || 'temp-user',
              role: 'assistant' as const,
              message_type: 'assistant' as const,
              content: aiReply,
              metadata: {},
              tokens_used: null,
              response_time_ms: null,
              created_at: new Date().toISOString()
            }
            
            setMessages(prev => {
              const newMessages = [...prev, aiMessage]
              // 保存临时会话（未登录用户）
              if (!user?.id) {
                saveTemporarySession(newMessages)
              }
              return newMessages
            })
            setIsStreaming(false)
            setStreamingMessage('')
          }, 500)
          
        } catch (streamError) {
          console.error('流式响应处理失败:', streamError)
          setIsStreaming(false)
          setStreamingMessage('')
          throw streamError // 重新抛出异常，让外层catch处理
        }
      }
    } catch (error) {
      console.error('❌ AI对话失败:', error)
      
      // 确保清除流式状态
      setIsStreaming(false)
      setStreamingMessage('')
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: 'temp',
        user_id: user?.id || 'temp-user',
        role: 'assistant' as const,
        message_type: 'assistant' as const,
        content: '抱歉，AI服务暂时不可用，请稍后重试。',
        metadata: {},
        tokens_used: null,
        response_time_ms: null,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      
      // 如果是直接模式，恢复输入内容
      if (!currentSession || !user?.id) {
        setInputValue(userMessageContent)
      }
      
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearMessages = async () => {
    if (!confirm('确定要清空当前对话吗？')) return

    try {
      if (currentSession && user?.id) {
        // 已登录用户：归档当前会话并创建新会话
        await ChatService.archiveSession(currentSession.id)
        
        const { data: newSession, error } = await ChatService.getOrCreateSession(user.id, sessionType)
        
        if (error) {
          console.error('创建新会话失败:', error)
          return
        }

        if (newSession) {
          setCurrentSession(newSession)
          setMessages([])
        }
      } else {
        // 未登录用户：清空localStorage中的临时会话
        const key = `temp_chat_${sessionType}`
        localStorage.removeItem(key)
        setMessages([])
      }
    } catch (error) {
      console.error('清空对话失败:', error)
    }
  }

  const getSessionTitle = () => {
    const titles = {
      'general': '通用AI助手',
      'okr_planning': 'OKR规划助手', 
      'study_help': '学习辅助AI',
      'career_guidance': '职业规划顾问'
    }
    return titles[sessionType] || '启明星 AI 助手'
  }

  const getSessionDescription = () => {
    const descriptions = {
      'general': '智能学习伙伴，随时为您答疑解惑',
      'okr_planning': '帮助您制定和管理OKR目标',
      'study_help': '专业学习指导和问题解答',
      'career_guidance': '职业发展规划和建议'
    }
    return descriptions[sessionType] || '智能学习伙伴，随时为您答疑解惑'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized 
          ? 'w-96 h-16' 
          : 'w-full max-w-4xl h-full max-h-[85vh]'
      } mb-8`}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{getSessionTitle()}</h2>
              {!isMinimized && (
                <p className="text-sm text-purple-100">{getSessionDescription()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isMinimized && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 p-2"
                onClick={clearMessages}
                title="清空对话"
                disabled={messages.length === 0}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-2"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "最大化窗口" : "最小化窗口"}
              aria-label={isMinimized ? "最大化窗口" : "最小化窗口"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-2"
              onClick={onClose}
              title="关闭对话窗口"
              aria-label="关闭对话窗口"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 对话内容 */}
        {!isMinimized && (
          <div className="flex flex-col h-full">
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {sessionLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p>加载对话中...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">开始对话</h3>
                    <p className="text-sm mb-4">{getSessionDescription()}</p>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">您可以问我：</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {sessionType === 'okr_planning' ? (
                          <>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('如何制定有效的OKR目标？')}>OKR制定</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('怎样追踪OKR进度？')}>进度追踪</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('OKR目标拆解技巧')}>目标拆解</span>
                          </>
                        ) : sessionType === 'study_help' ? (
                          <>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('如何提高编程学习效率？')}>学习方法</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('推荐一些编程学习资源')}>学习资源</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('项目实战经验分享')}>项目实战</span>
                          </>
                        ) : sessionType === 'career_guidance' ? (
                          <>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('如何准备技术面试？')}>面试准备</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('职业发展路径规划')}>职业规划</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('实习求职建议')}>求职指导</span>
                          </>
                        ) : (
                          <>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('如何制定有效的学习计划？')}>学习计划</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('时间管理技巧分享')}>时间管理</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                                  onClick={() => setInputValue('如何保持学习动力？')}>学习动力</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <AIMessage 
                      key={message.id} 
                      message={message}
                    />
                  ))}
                  
                  {/* 流式消息显示 */}
                  {isStreaming && (
                    <AIMessage
                      message={{
                        id: 'streaming',
                        message_type: 'assistant',
                        content: '',
                        created_at: new Date().toISOString()
                      }}
                      isStreaming={true}
                      streamingContent={streamingMessage}
                    />
                  )}
                  
                  {/* 加载指示器 */}
                  {isLoading && !isStreaming && (
                    <div className="flex justify-start mb-4">
                      <div className="flex items-start space-x-3 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* 输入区域 */}
            <div className="border-t bg-gray-50 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入对话内容 (按 Shift+Enter 键换行)"
                    className="resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading || sessionLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || sessionLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {getSessionTitle()} · 智能学习伙伴 · 仅供参考，请结合实际情况判断
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDialogWindowReal