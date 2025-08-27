'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { X, Send, Minimize2, Maximize2, RotateCcw } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
}

interface AIDialogWindowProps {
  isOpen: boolean
  onClose: () => void
  initialMessages?: Message[]
}

const AIDialogWindow: React.FC<AIDialogWindowProps> = ({ 
  isOpen, 
  onClose, 
  initialMessages = [] 
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // 模拟AI回复
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `我理解您的问题："${userMessage.content}"。这是一个很好的问题，让我为您详细解答...\n\n作为您的AI助手，我建议您可以从以下几个方面来考虑这个问题：\n\n1. 首先分析问题的核心要素\n2. 制定合理的解决方案\n3. 逐步实施并监控效果\n\n如果您需要更具体的建议，请告诉我更多详细信息。`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
        isMinimized 
          ? 'w-96 h-16' 
          : 'w-full max-w-4xl h-full max-h-[90vh]'
      }`}>
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">AI</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">启明星 AI 助手</h2>
              {!isMinimized && (
                <p className="text-sm text-purple-100">智能学习伙伴，随时为您答疑解惑</p>
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
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-2"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-2"
              onClick={onClose}
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
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">开始对话</h3>
                    <p className="text-sm">我是启明星AI助手，有什么可以帮助您的吗？</p>
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-gray-400">您可以问我：</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                              onClick={() => setInputValue('如何制定有效的学习计划？')}>学习计划</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                              onClick={() => setInputValue('OKR目标设定有什么技巧？')}>OKR技巧</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs cursor-pointer hover:bg-purple-100"
                              onClick={() => setInputValue('如何提高学习效率？')}>学习效率</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`flex items-start space-x-3 max-w-[80%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* 头像 */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                        }`}>
                          {message.type === 'user' ? '👤' : '🤖'}
                        </div>
                        
                        {/* 消息内容 */}
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                          <p className={`text-xs mt-2 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* 加载指示器 */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3 max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                          🤖
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                启明星AI助手 · 智能学习伙伴 · 仅供参考，请结合实际情况判断
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIDialogWindow