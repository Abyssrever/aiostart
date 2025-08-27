'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  type?: 'text' | 'okr_suggestion' | 'resource_recommendation'
}

interface AIChatProps {
  sessionType?: 'okr_planning' | 'study_help' | 'general'
  onOKRSuggestion?: (suggestion: any) => void
}

export default function AIChat({ sessionType = 'general', onOKRSuggestion }: AIChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `你好 ${user?.name || '同学'}！我是你的AI学习伙伴 🤖\n\n我可以帮助你：\n• 制定和优化OKR目标\n• 分析学习进度和提供建议\n• 推荐学习资源和解答疑问\n• 生成个性化学习计划\n\n有什么我可以帮助你的吗？`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const callAIAPI = async (userMessage: string): Promise<Message> => {
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          message: userMessage,
          sessionType,
          conversationHistory: messages.slice(1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'AI服务调用失败')
      }

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString(),
        type: 'text'
      }
    } catch (error) {
      console.error('AI API调用失败:', error)
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，AI服务暂时不可用，请稍后重试。如果问题持续，请检查网络连接或联系技术支持。',
        timestamp: new Date().toLocaleTimeString(),
        type: 'text'
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const aiResponse = await callAIAPI(inputValue)
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('AI response error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '抱歉，我现在遇到了一些问题。请稍后再试，或者换个问题问我。',
        timestamp: new Date().toLocaleTimeString(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
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

  const getSessionTypeLabel = () => {
    switch (sessionType) {
      case 'okr_planning': return 'OKR规划助手'
      case 'study_help': return '学习辅助'
      case 'general': return '通用助手'
      default: return 'AI助手'
    }
  }

  const getSessionTypeIcon = () => {
    switch (sessionType) {
      case 'okr_planning': return '🎯'
      case 'study_help': return '📚'
      case 'general': return '🤖'
      default: return '💬'
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <span className="mr-2">{getSessionTypeIcon()}</span>
            {getSessionTypeLabel()}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {messages.length - 1} 条对话
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* 消息列表 */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className={
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-purple-100 text-purple-600'
                  }>
                    {message.role === 'user' ? '👤' : '🤖'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs text-gray-500">
                      {message.role === 'user' ? user?.name || '你' : 'AI助手'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {message.timestamp}
                    </span>
                  </div>
                  
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {/* OKR建议按钮 */}
                    {message.role === 'assistant' && 
                     message.content.includes('OKR') && 
                     sessionType === 'okr_planning' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => onOKRSuggestion?.({})}
                        >
                          采用这个OKR建议
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    🤖
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-gray-100 p-3 rounded-lg text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-gray-500">AI正在思考...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex space-x-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`向AI${getSessionTypeLabel()}提问...（按Enter发送，Shift+Enter换行）`}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="self-end"
            >
              {isLoading ? '发送中...' : '发送'}
            </Button>
          </div>
          
          {/* 快捷问题 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              '帮我制定一个学期的OKR',
              '分析我的学习进度',
              '推荐学习资源',
              '制定复习计划'
            ].map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInputValue(question)}
                disabled={isLoading}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}