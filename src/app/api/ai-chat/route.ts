import { NextRequest, NextResponse } from 'next/server'
import { AIServiceManager } from '@/lib/ai-service-manager'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'
import { aiCache } from '@/lib/ai-cache'
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'ai-chat')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }
    
    console.log('🚀 AI Chat API 被调用')
    
    const body = await request.json()
    const { message, sessionType = 'general', conversationHistory = [], sessionId, userId, userProfile } = body
    
    console.log('📤 收到请求:', { message, sessionType, sessionId, userId })
    
    // 分析对话上下文和用户意图
    const conversationContext = analyzeConversationContext(message, conversationHistory)
    
    // 检查OKR相关意图（结合上下文）
    const okrIntent = await analyzeOKRIntent(message, userId, conversationContext)
    
    // 检查缓存（OKR相关消息不缓存，保证实时性）
    const cachedResponse = !okrIntent.isOKRRelated ? aiCache.get(message, sessionType) : null
    if (cachedResponse) {
      return NextResponse.json({
        message: cachedResponse,
        cached: true,
        tokensUsed: 0,
        timestamp: new Date().toISOString()
      })
    }
    
    // 搜索相关知识库内容
    const knowledgeContext = await searchKnowledgeBase(message)
    
    // 生成智能建议
    const smartSuggestions = await generateSmartSuggestions(message, userId, knowledgeContext)
    
    // 使用AI服务管理器处理请求
    const aiManager = AIServiceManager.getInstance()
    
    const aiRequest = {
      message,
      sessionType,
      conversationHistory,
      sessionId,
      userId,
      userProfile,
      metadata: {
        platform: 'qiming-star',
        timestamp: new Date().toISOString(),
        knowledgeContext: knowledgeContext,
        smartSuggestions: smartSuggestions,
        conversationContext: conversationContext
      }
    }
    
    console.log('🤖 当前AI提供商:', aiManager['config'].provider)
    
    let aiResponse
    let okrResult = null
    
    // 如果是OKR相关请求，先处理OKR操作
    if (okrIntent.isOKRRelated) {
      okrResult = await handleOKROperation(message, userId, okrIntent)
      
      // 增强AI请求，包含OKR操作结果
      aiRequest.metadata = {
        ...aiRequest.metadata,
        okrIntent: okrIntent,
        okrResult: okrResult
      } as any
      
      // 添加OKR上下文到消息中
      const contextMessage = `用户消息: ${message}
      
OKR操作结果: ${okrResult?.success ? '成功' : '失败'}
${(okrResult as any)?.message || ''}
${(okrResult as any)?.aiResponse || ''}

${knowledgeContext.hasResults ? `相关知识库内容:\n${knowledgeContext.results.map(r => `- ${r.title}: ${r.content.substring(0, 200)}...`).join('\n')}` : ''}

请基于这个OKR操作结果和相关知识库内容，用友好自然的方式回复用户。`
      
      aiRequest.message = contextMessage
    } else if (knowledgeContext.hasResults || smartSuggestions.hasSuggestions) {
      // 为非OKR消息添加知识库上下文和智能建议
      const enhancedMessage = `用户问题: ${message}

${knowledgeContext.hasResults ? `相关知识库内容:
${knowledgeContext.results.map(r => `- ${r.title}: ${r.content.substring(0, 300)}...`).join('\n')}` : ''}

${smartSuggestions.hasSuggestions ? `智能学习建议:
${smartSuggestions.suggestions.map(s => `• ${s}`).join('\n')}` : ''}

请基于以上内容回答用户问题，并提供有用的学习建议。如果有智能建议，请自然地融入到回答中。`
      
      aiRequest.message = enhancedMessage
    }
    
    aiResponse = await aiManager.sendAIRequest(aiRequest)
    
    console.log('✅ AI响应成功:', aiResponse.content)
    
    // 缓存成功的AI响应（OKR相关的不缓存）
    if (aiResponse.success !== false && aiResponse.content && !okrIntent.isOKRRelated) {
      aiCache.set(message, aiResponse.content, sessionType)
    }
    
    return NextResponse.json({
      success: aiResponse.success !== false,
      content: aiResponse.content,
      tokensUsed: aiResponse.tokensUsed,
      responseTime: aiResponse.responseTime,
      error: aiResponse.error,
      cached: false,
      okrResult: okrResult // 包含OKR操作结果
    })
    
  } catch (error) {
    console.error('❌ AI Chat API 错误:', error)
    
    return NextResponse.json({
      success: false,
      content: '抱歉，AI服务暂时不可用，请稍后重试。',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 对话上下文分析函数
function analyzeConversationContext(message: string, conversationHistory: any[]) {
  const recentMessages = conversationHistory.slice(-5) // 最近5条消息
  
  // 分析对话主题
  const topics: string[] = []
  const keywords: string[] = []
  
  recentMessages.forEach(msg => {
    const content = msg.content?.toLowerCase() || ''
    
    // 提取主题
    if (content.includes('okr') || content.includes('目标')) topics.push('目标管理')
    if (content.includes('学习') || content.includes('教程')) topics.push('学习')
    if (content.includes('项目') || content.includes('开发')) topics.push('项目开发')
    if (content.includes('算法') || content.includes('编程')) topics.push('编程技术')
    
    // 提取关键词
    const words = content.split(/\s+/).filter((w: string) => w.length > 2)
    keywords.push(...words.slice(0, 3))
  })
  
  // 分析当前消息与历史的关联性
  const currentLower = message.toLowerCase()
  const isFollowUp = topics.some(topic => {
    const topicWords = topic.split('').slice(0, 2)
    return topicWords.some((word: string) => currentLower.includes(word))
  })
  
  // 检测是否是进度更新的跟进
  const isProgressUpdate = recentMessages.some(msg => 
    (msg.content?.includes('创建') || msg.content?.includes('目标')) &&
    (currentLower.includes('完成') || currentLower.includes('进度'))
  )
  
  return {
    recentTopics: [...new Set(topics)],
    keywords: [...new Set(keywords)].slice(0, 10),
    isFollowUp,
    isProgressUpdate,
    conversationLength: conversationHistory.length,
    hasContext: conversationHistory.length > 0
  }
}

// OKR意图识别函数（增强版）
async function analyzeOKRIntent(message: string, userId?: string, context?: any) {
  const lowerMessage = message.toLowerCase()
  
  // OKR相关关键词
  const okrKeywords = [
    '目标', 'okr', 'OKR', '计划', '学习计划',
    '创建', '制定', '设定', '建立',
    '完成', '达成', '进度', '更新', '汇报', '提交',
    '查看', '状态', '进展', '怎么样', '如何',
    '建议', '推荐', '改进', '优化'
  ]
  
  let isOKRRelated = okrKeywords.some(keyword => lowerMessage.includes(keyword))
  
  // 基于上下文增强判断
  if (!isOKRRelated && context?.hasContext) {
    // 如果最近讨论了目标管理，且当前消息可能是跟进
    if (context.recentTopics.includes('目标管理') && context.isProgressUpdate) {
      isOKRRelated = true
    }
    
    // 如果是明显的进度汇报
    if (context.isProgressUpdate || 
        (lowerMessage.includes('完成') && lowerMessage.match(/\d+/))) {
      isOKRRelated = true
    }
  }
  
  if (!isOKRRelated) {
    return { isOKRRelated: false }
  }
  
  // 分析具体意图
  const createKeywords = ['创建', '制定', '设定', '建立', '目标', 'okr', '学习计划', '计划']
  const updateKeywords = ['完成', '达成', '进度', '更新', '汇报', '提交']
  const queryKeywords = ['查看', '状态', '进展', '怎么样', '如何']
  const suggestKeywords = ['建议', '推荐', '如何', '怎样', '改进', '优化']
  
  let action = 'suggest'
  let confidence = 0
  
  const createScore = createKeywords.filter(k => lowerMessage.includes(k)).length
  let updateScore = updateKeywords.filter(k => lowerMessage.includes(k)).length
  let queryScore = queryKeywords.filter(k => lowerMessage.includes(k)).length
  const suggestScore = suggestKeywords.filter(k => lowerMessage.includes(k)).length
  
  // 结合上下文调整分数
  if (context?.isProgressUpdate) {
    updateScore += 2 // 如果是进度跟进，增加更新分数
  }
  
  if (context?.recentTopics.includes('目标管理')) {
    queryScore += 1 // 如果最近讨论了目标，增加查询分数
  }
  
  const maxScore = Math.max(createScore, updateScore, queryScore, suggestScore)
  
  if (updateScore === maxScore) {
    action = 'update'
    confidence = Math.min(updateScore * 0.25 + (context?.isProgressUpdate ? 0.3 : 0), 0.95)
  } else if (createScore === maxScore) {
    action = 'create'
    confidence = Math.min(createScore * 0.3, 0.9)
  } else if (queryScore === maxScore) {
    action = 'query'
    confidence = Math.min(queryScore * 0.3 + (context?.hasContext ? 0.1 : 0), 0.9)
  } else {
    action = 'suggest'
    confidence = Math.min(suggestScore * 0.3, 0.9)
  }
  
  return {
    isOKRRelated: true,
    action,
    confidence,
    originalMessage: message
  }
}

// OKR操作处理函数
async function handleOKROperation(message: string, userId: string, intent: any) {
  if (!userId) {
    return {
      success: false,
      message: '用户身份验证失败',
      error: 'User ID is required for OKR operations'
    }
  }
  
  try {
    switch (intent.action) {
      case 'create':
        return await createOKRFromIntent(message, userId)
      case 'update':
        return await updateOKRProgress(message, userId)
      case 'query':
        return await getOKRStatus(userId)
      default:
        return await parseOKRIntent(message, userId)
    }
  } catch (error) {
    console.error('OKR操作处理失败:', error)
    return {
      success: false,
      message: '抱歉，OKR操作暂时无法完成，请稍后重试',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 复制ai-okr API中的核心函数
async function parseOKRIntent(message: string, userId: string) {
  const intent = analyzeMessage(message)
  
  return {
    success: true,
    intent,
    suggestions: generateSuggestions(intent, message)
  }
}

function analyzeMessage(message: string) {
  const lowerMessage = message.toLowerCase()
  
  // 创建OKR的关键词
  const createKeywords = ['创建', '制定', '设定', '建立', '学习计划']
  const updateKeywords = ['完成了', '达成了', '做了', '提交了', '汇报', '我完成', '已完成']
  const queryKeywords = ['查看', '状态', '进展', '怎么样', '如何', '我的', '目标进度']
  const suggestKeywords = ['建议', '推荐', '如何', '怎样', '改进']

  // 计算意图匹配度
  let createScore = 0
  let updateScore = 0
  let queryScore = 0
  let suggestScore = 0

  createKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) createScore++
  })
  updateKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) updateScore++
  })
  queryKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) queryScore++
  })
  suggestKeywords.forEach(keyword => {
    if (lowerMessage.includes(keyword)) suggestScore++
  })

  // 确定主要意图
  const maxScore = Math.max(createScore, updateScore, queryScore, suggestScore)
  let action = 'suggest'
  let confidence = 0

  if (maxScore > 0) {
    if (createScore === maxScore) {
      action = 'create'
      confidence = Math.min(createScore * 0.3, 0.9)
    } else if (updateScore === maxScore) {
      action = 'update'
      confidence = Math.min(updateScore * 0.3, 0.9)
    } else if (queryScore === maxScore) {
      action = 'query'
      confidence = Math.min(queryScore * 0.3, 0.9)
    } else {
      action = 'suggest'
      confidence = Math.min(suggestScore * 0.3, 0.9)
    }
  }

  // 解析OKR数据
  const data: any = {}
  
  if (action === 'create') {
    data.objective = extractObjective(message)
    data.keyResults = extractKeyResults(message)
  } else if (action === 'update') {
    data.progress = extractProgress(message)
  }

  return { action, confidence, data }
}

async function createOKRFromIntent(message: string, userId: string) {
  const intent = analyzeMessage(message)
  
  if (intent.action !== 'create' || !intent.data?.objective) {
    return {
      success: false,
      error: '无法从消息中识别OKR创建意图',
      suggestion: '请尝试这样描述："我想制定本学期提升编程能力的学习目标"'
    }
  }

  try {
    // 创建OKR
    const { data: okr, error: okrError } = await supabase
      .from('okrs')
      .insert({
        user_id: userId,
        title: intent.data.objective,
        description: `通过AI助手创建: ${message}`,
        category: 'personal',
        priority: 'medium',
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progress: 0
      })
      .select()
      .single()

    if (okrError) {
      console.error('创建OKR失败:', okrError)
      return { success: false, error: '创建OKR失败' }
    }

    // 创建关键结果
    const keyResultsToCreate = intent.data.keyResults || []
    let createdKeyResults = []
    
    if (keyResultsToCreate.length > 0) {
      const keyResultsData = keyResultsToCreate.map((kr: any) => ({
        okr_id: okr.id,
        title: kr.title,
        description: kr.description || '',
        target_value: kr.targetValue || 100,
        current_value: 0,
        unit: kr.unit || ''
      }))

      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .insert(keyResultsData)
        .select()

      if (!krError && keyResults) {
        createdKeyResults = keyResults
      }
    }

    return {
      success: true,
      message: 'OKR创建成功！',
      data: {
        okr: okr,
        keyResults: createdKeyResults
      },
      aiResponse: generateOKRCreatedResponse(okr, createdKeyResults)
    }

  } catch (error) {
    console.error('创建OKR异常:', error)
    return { success: false, error: '创建OKR失败' }
  }
}

async function updateOKRProgress(message: string, userId: string) {
  const intent = analyzeMessage(message)
  
  if (intent.action !== 'update' || !intent.data?.progress) {
    return {
      success: false,
      error: '无法识别进度更新信息',
      suggestion: '请尝试这样描述："我完成了3道算法题"或"Java学习进度到了70%"'
    }
  }

  try {
    // 获取用户的活跃OKR
    const { data: okrs, error: okrError } = await supabase
      .from('okrs')
      .select('id, title, key_results(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (okrError || !okrs || okrs.length === 0) {
      return {
        success: false,
        error: '未找到活跃的OKR',
        suggestion: '请先创建一个OKR，然后再更新进度'
      }
    }

    // 智能匹配最相关的关键结果
    const progress = intent.data.progress
    let bestMatch = null
    let bestScore = 0

    for (const okr of okrs) {
      for (const kr of okr.key_results) {
        const score = calculateMatchScore(message, kr.title, kr.description)
        if (score > bestScore) {
          bestScore = score
          bestMatch = kr
        }
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return {
        success: false,
        error: '无法匹配到相关的关键结果',
        suggestion: '请确保进度描述与您的OKR相关',
        availableKeyResults: okrs.flatMap(okr => 
          okr.key_results.map(kr => kr.title)
        )
      }
    }

    // 更新关键结果进度
    const newValue = progress.currentValue || 0
    const progressPercentage = Math.min((newValue / (bestMatch.target_value || 100)) * 100, 100)

    const { data: updatedKR, error: updateError } = await supabase
      .from('key_results')
      .update({
        current_value: newValue
      })
      .eq('id', bestMatch.id)
      .select()
      .single()

    if (updateError) {
      console.error('更新进度失败:', updateError)
      return { success: false, error: '更新进度失败' }
    }

    return {
      success: true,
      message: '进度更新成功！',
      data: updatedKR,
      aiResponse: generateProgressUpdateResponse(bestMatch, updatedKR)
    }

  } catch (error) {
    console.error('更新进度异常:', error)
    return { success: false, error: '更新进度失败' }
  }
}

async function getOKRStatus(userId: string) {
  try {
    const { data: okrs, error } = await supabase
      .from('okrs')
      .select('*, key_results(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return { success: false, error: '获取OKR状态失败' }
    }

    return {
      success: true,
      data: okrs,
      summary: generateOKRSummary(okrs)
    }

  } catch (error) {
    console.error('获取OKR状态异常:', error)
    return { success: false, error: '获取OKR状态失败' }
  }
}

// 辅助函数
function extractObjective(message: string): string {
  const patterns = [
    /我想要?(.+?)(?:，|。|$)/,
    /我希望(.+?)(?:，|。|$)/,
    /目标是(.+?)(?:，|。|$)/,
    /制定(.+?)(?:的|计划|目标)/
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }
  
  return message.length > 100 ? message.substring(0, 100) + '...' : message
}

function extractKeyResults(message: string): Array<any> {
  const keyResults = []
  
  // 查找数字相关的目标
  const numberPattern = /(\d+)([个件次分天周月]|小时|道题|项目)/g
  let match
  while ((match = numberPattern.exec(message)) !== null) {
    keyResults.push({
      title: `完成${match[0]}`,
      targetValue: parseInt(match[1]),
      unit: match[2],
      description: `目标${match[0]}`
    })
  }
  
  // 如果没有找到具体数字，创建通用的关键结果
  if (keyResults.length === 0) {
    if (message.includes('编程') || message.includes('代码')) {
      keyResults.push({
        title: '提升编程技能',
        targetValue: 100,
        unit: '%',
        description: '编程能力提升程度'
      })
    }
    if (message.includes('学习') || message.includes('课程')) {
      keyResults.push({
        title: '完成学习任务',
        targetValue: 100,
        unit: '%',
        description: '学习任务完成度'
      })
    }
    if (message.includes('项目') || message.includes('作业')) {
      keyResults.push({
        title: '完成项目/作业',
        targetValue: 3,
        unit: '个',
        description: '完成的项目或作业数量'
      })
    }
  }
  
  return keyResults.slice(0, 3) // 最多3个关键结果
}

function extractProgress(message: string): any {
  const progressInfo: any = {}
  
  // 查找完成数量
  const completionPattern = /(?:完成|提交|做了)(?:了)?(\d+)([个件次项道])/
  const match = message.match(completionPattern)
  if (match) {
    progressInfo.currentValue = parseInt(match[1])
    progressInfo.unit = match[2]
  }
  
  // 查找百分比
  const percentPattern = /(\d+)%/
  const percentMatch = message.match(percentPattern)
  if (percentMatch) {
    progressInfo.currentValue = parseInt(percentMatch[1])
    progressInfo.unit = '%'
  }
  
  progressInfo.description = message
  return progressInfo
}

function generateSuggestions(intent: any, message: string): string[] {
  const suggestions = []
  
  if (intent.action === 'create') {
    suggestions.push('我可以帮你创建这个OKR，需要我添加具体的关键结果吗？')
    suggestions.push('建议设定可量化的目标，比如"完成10道算法题"')
  } else if (intent.action === 'update') {
    suggestions.push('很好！我来帮你更新相关的OKR进度')
    suggestions.push('你可以告诉我更具体的完成情况')
  }
  
  return suggestions
}

function calculateMatchScore(message: string, title: string, description: string): number {
  const messageWords = message.toLowerCase().split(/\s+/)
  const titleWords = (title + ' ' + description).toLowerCase().split(/\s+/)
  
  let score = 0
  for (const word of messageWords) {
    if (titleWords.some(tw => tw.includes(word) || word.includes(tw))) {
      score += 0.1
    }
  }
  
  return Math.min(score, 1)
}

function generateOKRCreatedResponse(okr: any, keyResults: any[]): string {
  return `🎯 OKR创建成功！

**目标**: ${okr.title}

**关键结果**:
${keyResults.map((kr, i) => `${i + 1}. ${kr.title} (目标: ${kr.target_value}${kr.unit})`).join('\n')}

你可以随时告诉我学习进度，我会帮你更新OKR状态！`
}

function generateProgressUpdateResponse(oldKR: any, newKR: any): string {
  const progressPercentage = Math.min((newKR.current_value / (oldKR.target_value || 100)) * 100, 100)
  
  return `📈 进度更新成功！

**${newKR.title}**
进度: ${newKR.current_value}/${oldKR.target_value}${newKR.unit} (${Math.round(progressPercentage)}%)

${progressPercentage >= 100 ? '🎉 恭喜完成这个目标！' : 
  progressPercentage >= 80 ? '💪 快完成了，加油！' :
  progressPercentage >= 50 ? '👍 进展不错，继续保持！' :
  '🌟 好的开始，继续努力！'
}`
}

function generateOKRSummary(okrs: any[]): string {
  if (okrs.length === 0) {
    return '你还没有创建任何OKR，我可以帮你开始制定学习目标！'
  }
  
  const activeOKRs = okrs.filter(okr => okr.status === 'active')
  const totalKRs = okrs.flatMap(okr => okr.key_results).length
  const completedKRs = okrs.flatMap(okr => okr.key_results).filter(kr => kr.status === 'completed').length
  
  return `你目前有 ${activeOKRs.length} 个活跃目标，${totalKRs} 个关键结果中已完成 ${completedKRs} 个。

最近的目标: ${okrs[0]?.title || '无'}`
}

// 知识库搜索函数（简化版，使用内置知识）
async function searchKnowledgeBase(query: string) {
  try {
    // 临时内置知识库（后续可替换为数据库搜索）
    const knowledgeBase = [
      {
        id: '1',
        title: 'JavaScript闭包',
        content: '闭包是JavaScript中的重要概念，它允许函数访问其外部作用域中的变量，即使外部函数已经执行完毕。闭包常用于模块模式、回调函数等场景。',
        document_type: 'tutorial',
        keywords: ['javascript', 'js', '闭包', 'closure', '作用域', '函数']
      },
      {
        id: '2',
        title: '高效学习编程方法',
        content: '学习编程的最佳实践：1.实践为主，通过编写代码学习 2.项目驱动，选择有趣的项目 3.定期复习和总结 4.寻找学习伙伴 5.保持好奇心，探索新技术。',
        document_type: 'guide',
        keywords: ['学习', '编程', '方法', '学习方法', '如何学', '高效', '提升']
      },
      {
        id: '3',
        title: '动态规划算法',
        content: '动态规划是解决具有重叠子问题和最优子结构问题的算法技术。核心思想是将复杂问题分解为子问题，存储子问题的解避免重复计算。常见应用包括斐波那契数列、背包问题等。',
        document_type: 'tutorial',
        keywords: ['动态规划', 'dp', '算法', '优化', '子问题', '斐波那契']
      },
      {
        id: '4',
        title: 'Web开发基础',
        content: 'Web开发包括前端（HTML、CSS、JavaScript）和后端开发。前端负责用户界面，后端处理数据和业务逻辑。现代技术栈包括React、Vue、Node.js等。',
        document_type: 'tutorial',
        keywords: ['web', '网页', '开发', 'html', 'css', 'javascript', 'react', 'vue']
      },
      {
        id: '5',
        title: 'OKR目标管理',
        content: 'OKR（目标与关键结果）是一种目标管理方法，通过设定明确的目标和可衡量的关键结果来提升执行力。适用于个人学习规划和项目管理。',
        document_type: 'guide',
        keywords: ['okr', '目标', '管理', '学习计划', '规划', '关键结果']
      }
    ]

    const lowerQuery = query.toLowerCase()
    
    // 搜索匹配的知识条目
    const matches = knowledgeBase.filter(item => {
      return item.keywords.some(keyword => 
        lowerQuery.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(lowerQuery)
      ) || 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
    }).slice(0, 3) // 最多返回3条结果

    console.log(`🔍 知识库搜索 "${query}"，找到 ${matches.length} 条结果`)

    return {
      hasResults: matches.length > 0,
      results: matches,
      count: matches.length
    }

  } catch (error) {
    console.error('知识库搜索异常:', error)
    return { hasResults: false, results: [] }
  }
}

// 智能建议生成函数
async function generateSmartSuggestions(message: string, userId: string, knowledgeContext: any) {
  try {
    const suggestions = []
    const lowerMessage = message.toLowerCase()
    
    // 基于用户OKR状态的个性化建议
    if (userId) {
      try {
        const { data: userOKRs } = await supabase
          .from('okrs')
          .select('*, key_results(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (userOKRs && userOKRs.length > 0) {
          // 分析用户的学习领域
          const userTopics: string[] = []
          userOKRs.forEach(okr => {
            if (okr.title.includes('编程') || okr.title.includes('代码')) userTopics.push('编程')
            if (okr.title.includes('算法')) userTopics.push('算法')
            if (okr.title.includes('项目')) userTopics.push('项目')
          })
          
          // 基于用户OKR生成相关建议
          if (userTopics.includes('编程') && (lowerMessage.includes('学习') || lowerMessage.includes('提升'))) {
            suggestions.push('结合你的编程学习目标，建议将这个知识点加入到OKR关键结果中')
          }
          
          if (userTopics.includes('算法') && lowerMessage.includes('算法')) {
            suggestions.push('这个算法知识可以作为你算法学习OKR的一部分，建议设定练习目标')
          }
          
          if (userTopics.includes('项目') && lowerMessage.includes('项目')) {
            suggestions.push('考虑将这个概念应用到你的项目OKR中，实践出真知')
          }
        }
      } catch (error) {
        console.error('获取用户OKR失败:', error)
      }
    }
    
    // 基于消息内容的通用建议
    if (lowerMessage.includes('学习') && !lowerMessage.includes('方法')) {
      suggestions.push('建议制定具体的学习OKR来追踪进度')
    }
    
    if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
      suggestions.push('推荐通过实际项目练习JavaScript概念')
      suggestions.push('可以考虑学习相关的React或Vue框架')
    }
    
    if (lowerMessage.includes('算法') || lowerMessage.includes('数据结构')) {
      suggestions.push('建议每天练习1-2道相关算法题')
      suggestions.push('推荐使用LeetCode或其他在线判题平台')
    }
    
    if (lowerMessage.includes('项目')) {
      suggestions.push('建议选择难度适中的项目，循序渐进')
      suggestions.push('项目完成后记得总结经验和技术收获')
    }
    
    // 基于知识库内容的建议
    if (knowledgeContext.hasResults) {
      knowledgeContext.results.forEach((item: any) => {
        if (item.document_type === 'tutorial') {
          suggestions.push(`相关教程：${item.title}，建议深入学习`)
        }
        if (item.document_type === 'guide') {
          suggestions.push(`学习指南：${item.title}，可参考实践`)
        }
      })
    }
    
    // 去重并限制数量
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 4)
    
    return {
      hasSuggestions: uniqueSuggestions.length > 0,
      suggestions: uniqueSuggestions,
      count: uniqueSuggestions.length
    }
    
  } catch (error) {
    console.error('生成智能建议失败:', error)
    return { hasSuggestions: false, suggestions: [], count: 0 }
  }
}