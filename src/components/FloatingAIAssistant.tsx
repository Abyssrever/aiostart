'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, MessageCircle, Minimize2, Maximize2 } from 'lucide-react'
import AIDialogWindow from './AIDialogWindow'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
}

interface FloatingAIAssistantProps {
  chatHistory: ChatMessage[]
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({ chatHistory }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 确保在客户端渲染时初始化位置
  useEffect(() => {
    setIsClient(true)
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  }, [])

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen && !isMinimized) return // 如果面板打开且未最小化，不允许拖拽
    
    setIsDragging(true)
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  // 处理拖拽移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      
      // 限制在窗口范围内
      const maxX = window.innerWidth - 60
      const maxY = window.innerHeight - 60
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const togglePanel = () => {
    if (!isDragging) {
      // 直接打开AI对话窗口而不是历史记录面板
      setIsDialogOpen(true)
    }
  }

  const toggleHistoryPanel = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const minimizePanel = () => {
    setIsMinimized(true)
  }

  const maximizePanel = () => {
    setIsMinimized(false)
  }

  const closePanel = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  // 只在客户端渲染
  if (!isClient) {
    return null
  }

  return (
    <>
      {/* 悬浮按钮 */}
      <div
        ref={buttonRef}
        className={`fixed z-50 transition-all duration-200 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${isOpen && !isMinimized ? 'opacity-50' : 'opacity-100'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onClick={togglePanel}
      >
        <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-110">
          <MessageCircle className="w-6 h-6 text-white" />
          {chatHistory.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{chatHistory.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* 历史记录面板 */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 z-30"
          style={{
            transform: 'translateX(-10px)'
          }}
        >
          <Button
            size="sm"
            variant="outline"
            className="mb-2 bg-white shadow-lg border-purple-200 text-purple-600 hover:bg-purple-50"
            onClick={toggleHistoryPanel}
          >
            查看历史记录
          </Button>
        </div>
      )}

      {/* 历史记录详细面板 */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-4 z-40 transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${Math.max(10, Math.min(position.x - 350, window.innerWidth - 410))}px`,
            top: `${Math.max(10, Math.min(position.y - 400, window.innerHeight - 450))}px`,
            width: isMinimized ? '300px' : '400px',
            height: isMinimized ? '60px' : '440px'
          }}
        >
          <Card className="w-full h-full shadow-2xl border-2 border-purple-200">
            <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <span className="mr-2">🤖</span>
                  AI对话记录
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                    onClick={() => setIsDialogOpen(true)}
                    title="开始新对话"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                    onClick={isMinimized ? maximizePanel : minimizePanel}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                    onClick={closePanel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {!isMinimized && (
              <CardContent className="p-4 h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>暂无对话记录</p>
                        <p className="text-sm mt-2">开始与AI助手对话吧！</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mb-4">
                        <Button
                          onClick={() => setIsDialogOpen(true)}
                          className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          开始新对话
                        </Button>
                      </div>
                      {chatHistory.map((chat) => (
                        <div key={chat.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                             onClick={() => setIsDialogOpen(true)}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                chat.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              <h3 className="font-medium text-sm text-gray-900">
                                {chat.type === 'user' ? '用户' : 'AI助手'}
                              </h3>
                            </div>
                            <Badge variant="outline" className={`text-xs ${
                              chat.type === 'user' ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'
                            }`}>
                              {chat.type === 'user' ? '提问' : '回答'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 line-clamp-3">{chat.content}</p>
                          <p className="text-xs text-gray-400">{chat.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* AI对话窗口 */}
      <AIDialogWindow
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialMessages={chatHistory.map(chat => ({
          id: chat.id,
          type: chat.type,
          content: chat.content,
          timestamp: chat.timestamp
        }))}
      />
    </>
  )
}

export default FloatingAIAssistant