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

<<<<<<< HEAD
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
=======
  const simulateAIResponse = async (userMessage: string): Promise<Message> => {
    // 模拟AI响应延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    const responses: Record<string, string[]> = {
      okr_planning: [
        `基于你的学习目标，我建议制定以下OKR：\n\n**目标(O)**: 提升编程技能\n\n**关键结果(KR)**:\n1. 完成3个完整的项目作品\n2. 学会至少2门新的编程语言\n3. 在GitHub上获得100+ stars\n\n这个OKR符合SMART原则，你觉得怎么样？`,
        `让我们一起分析你当前的OKR完成情况：\n\n根据你的进度数据，我发现：\n• 你在技术学习方面进展很好 ✅\n• 但在项目实践上可能需要加强 ⚠️\n\n建议调整策略：将更多时间分配给实际项目开发。`,
        `基于你的专业方向，我推荐这样的学习路径：\n\n**第一阶段(1-2个月)**: 巩固基础\n- 数据结构与算法强化\n- 设计模式学习\n\n**第二阶段(3-4个月)**: 实战项目\n- 全栈Web项目\n- 移动端应用开发\n\n**第三阶段(5-6个月)**: 深度学习\n- 选择一个技术栈深入研究`
      ],
      study_help: [
        `看起来你在这个知识点上遇到了困难。让我为你分析一下：\n\n**问题诊断**: ${userMessage}\n\n**解决建议**:\n1. 先回顾相关的基础概念\n2. 通过具体示例加深理解\n3. 多做相关练习题巩固\n\n我可以为你推荐一些优质的学习资源，需要吗？`,
        `这是一个很好的问题！让我帮你梳理一下思路：\n\n**核心概念**: [从你的问题中提取]\n**应用场景**: 在实际项目中的使用\n**相关知识点**: 需要同时掌握的概念\n\n建议你先掌握基础理论，再通过实践加深理解。`,
        `根据你的学习进度分析，我建议：\n\n**优势领域**: 继续保持\n**待加强领域**: 需要重点关注\n**学习建议**: 个性化学习计划\n\n我已经为你生成了详细的学习计划，要查看吗？`
      ],
      general: [
        `这是个很棒的想法！让我来帮你分析一下可行性和实施步骤。\n\n基于你目前的情况，我建议这样安排...\n\n需要我为你制定详细的行动计划吗？`,
        `我理解你的想法。基于我对你学习情况的了解，这里有几个建议：\n\n1. 首先确定优先级\n2. 分解成具体的行动步骤\n3. 设定明确的时间节点\n\n你希望从哪个方面开始呢？`,
        `让我为你提供一些参考思路：\n\n**短期目标**: 立即可以开始的行动\n**中期规划**: 1-3个月的安排\n**长期愿景**: 学期或学年的大目标\n\n需要我帮你转化为具体的OKR吗？`
      ]
    }

    const categoryResponses = responses[sessionType] || responses.general
    const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)]
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toLocaleTimeString(),
      type: 'text'
>>>>>>> bcb66815474adaa2f542b639cde27c0e04e13652
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
<<<<<<< HEAD
      const aiResponse = await callAIAPI(inputValue)
=======
      const aiResponse = await simulateAIResponse(inputValue)
>>>>>>> bcb66815474adaa2f542b639cde27c0e04e13652
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