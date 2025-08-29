'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { Bot, User, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AIMessageProps {
  message: {
    id: string
    message_type: 'user' | 'assistant' | 'system' | null
    content: string
    created_at: string
  }
  isStreaming?: boolean
  streamingContent?: string
}

const AIMessage: React.FC<AIMessageProps> = ({ 
  message, 
  isStreaming = false, 
  streamingContent = '' 
}) => {
  const [copied, setCopied] = useState(false)
  const [displayContent, setDisplayContent] = useState('')
  
  const isUser = message.message_type === 'user'
  const content = isStreaming ? streamingContent : message.content

  // 流式显示效果
  useEffect(() => {
    if (isStreaming && streamingContent) {
      let i = 0
      const timer = setInterval(() => {
        if (i < streamingContent.length) {
          setDisplayContent(streamingContent.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
        }
      }, 20) // 每20ms显示一个字符

      return () => clearInterval(timer)
    } else {
      setDisplayContent(content)
    }
  }, [isStreaming, streamingContent, content])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start max-w-[85%] ${
        isUser ? 'flex-row-reverse space-x-reverse space-x-3' : 'space-x-3'
      }`}>
        {/* 头像 */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-blue-500 text-white border-2 border-blue-300' 
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-2 border-purple-300'
        }`}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
        
        {/* 消息内容 */}
        <div className="relative group">
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
          }`}>
            {isUser ? (
              // 用户消息 - 纯文本
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {displayContent}
              </p>
            ) : (
              // AI消息 - Markdown渲染
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    // 自定义组件样式
                    h1: ({ children }) => (
                      <h1 className="text-lg font-bold mb-2 text-purple-600">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-md font-bold mb-2 text-purple-600">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-bold mb-1 text-purple-600">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-sm mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-sm mb-2 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm">{children}</li>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className={`block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto ${className}`}>
                          {children}
                        </code>
                      )
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-purple-200 pl-3 text-sm italic text-gray-600 my-2">
                        {children}
                      </blockquote>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-purple-600">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-purple-600">{children}</em>
                    )
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            )}
            
            {/* 时间戳 */}
            <p className={`text-xs mt-2 flex items-center justify-between ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}>
              <span>
                {new Date(message.created_at).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {/* 复制按钮 - 只在AI消息上显示 */}
              {!isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-gray-600"
                  onClick={copyToClipboard}
                  title="复制消息"
                >
                  {copied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIMessage