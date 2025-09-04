import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, getClientIP } from '@/lib/rate-limiter'

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

// OKR意图识别和解析
interface OKRIntent {
  action: 'create' | 'update' | 'query' | 'suggest'
  confidence: number
  data?: {
    objective?: string
    keyResults?: Array<{
      title: string
      targetValue?: number
      unit?: string
      description?: string
    }>
    okrId?: string
    progress?: {
      keyResultId?: string
      currentValue?: number
      description?: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 应用速率限制
    const clientIP = getClientIP(request)
    const rateLimit = await applyRateLimit(clientIP, 'general')
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.message },
        { 
          status: 429,
          headers: rateLimit.headers
        }
      )
    }

    const { message, userId, action } = await request.json()

    if (!message || !userId) {
      return NextResponse.json({ error: '消息内容和用户ID不能为空' }, { status: 400 })
    }

    switch (action) {
      case 'parseIntent':
        return await parseOKRIntent(message, userId)
      case 'createOKR':
        return await createOKRFromIntent(message, userId)
      case 'updateProgress':
        return await updateOKRProgress(message, userId)
      case 'getOKRStatus':
        return await getOKRStatus(userId)
      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
    }

  } catch (error) {
    console.error('AI OKR API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 解析用户意图
async function parseOKRIntent(message: string, userId: string): Promise<NextResponse> {
  const intent = analyzeMessage(message)
  
  return NextResponse.json({
    success: true,
    intent,
    suggestions: generateSuggestions(intent, message)
  })
}

// 分析用户消息，识别OKR相关意图
function analyzeMessage(message: string): OKRIntent {
  const lowerMessage = message.toLowerCase()
  
  // 创建OKR的关键词
  const createKeywords = ['创建', '制定', '设定', '建立', '目标', 'okr', '学习计划', '计划']
  const updateKeywords = ['完成', '达成', '进度', '更新', '汇报', '提交']
  const queryKeywords = ['查看', '状态', '进展', '怎么样', '如何']
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
  let action: OKRIntent['action'] = 'suggest'
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
  const data: OKRIntent['data'] = {}
  
  if (action === 'create') {
    data.objective = extractObjective(message)
    data.keyResults = extractKeyResults(message)
  } else if (action === 'update') {
    data.progress = extractProgress(message)
  }

  return { action, confidence, data }
}

// 从消息中提取目标
function extractObjective(message: string): string {
  // 简单的目标提取逻辑
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

// 从消息中提取关键结果
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

// 从消息中提取进度信息
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

// 创建OKR
async function createOKRFromIntent(message: string, userId: string): Promise<NextResponse> {
  const intent = analyzeMessage(message)
  
  if (intent.action !== 'create' || !intent.data?.objective) {
    return NextResponse.json({
      error: '无法从消息中识别OKR创建意图',
      suggestion: '请尝试这样描述："我想制定本学期提升编程能力的学习目标"'
    }, { status: 400 })
  }

  try {
    // 创建OKR
    const { data: okr, error: okrError } = await supabase
      .from('okrs')
      .insert({
        user_id: userId,
        title: intent.data.objective,
        description: `通过AI助手创建: ${message}`,
        objective_type: 'personal',
        target_year: new Date().getFullYear(),
        target_quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        status: 'active',
        progress_percentage: 0
      })
      .select()
      .single()

    if (okrError) {
      console.error('创建OKR失败:', okrError)
      return NextResponse.json({ error: '创建OKR失败' }, { status: 500 })
    }

    // 创建关键结果
    const keyResultsToCreate = intent.data.keyResults || []
    let createdKeyResults = []
    
    if (keyResultsToCreate.length > 0) {
      const keyResultsData = keyResultsToCreate.map(kr => ({
        okr_id: okr.id,
        title: kr.title,
        description: kr.description || '',
        target_value: kr.targetValue || 100,
        current_value: 0,
        unit: kr.unit || '',
        measurement_type: 'numeric' as const,
        status: 'active' as const,
        progress_percentage: 0
      }))

      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .insert(keyResultsData)
        .select()

      if (!krError && keyResults) {
        createdKeyResults = keyResults
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OKR创建成功！',
      data: {
        okr: okr,
        keyResults: createdKeyResults
      },
      aiResponse: generateOKRCreatedResponse(okr, createdKeyResults)
    })

  } catch (error) {
    console.error('创建OKR异常:', error)
    return NextResponse.json({ error: '创建OKR失败' }, { status: 500 })
  }
}

// 更新OKR进度
async function updateOKRProgress(message: string, userId: string): Promise<NextResponse> {
  const intent = analyzeMessage(message)
  
  if (intent.action !== 'update' || !intent.data?.progress) {
    return NextResponse.json({
      error: '无法识别进度更新信息',
      suggestion: '请尝试这样描述："我完成了3道算法题"或"Java学习进度到了70%"'
    }, { status: 400 })
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
      return NextResponse.json({
        error: '未找到活跃的OKR',
        suggestion: '请先创建一个OKR，然后再更新进度'
      }, { status: 400 })
    }

    // 智能匹配最相关的关键结果
    const progress = intent.data.progress!
    let bestMatch = null
    let bestScore = 0

    for (const okr of okrs) {
      for (const kr of (okr as any).key_results) {
        const score = calculateMatchScore(message, kr.title, kr.description)
        if (score > bestScore) {
          bestScore = score
          bestMatch = kr
        }
      }
    }

    if (!bestMatch || bestScore < 0.3) {
      return NextResponse.json({
        error: '无法匹配到相关的关键结果',
        suggestion: '请确保进度描述与您的OKR相关',
        availableKeyResults: okrs.flatMap((okr: any) => 
          okr.key_results.map((kr: any) => kr.title)
        )
      }, { status: 400 })
    }

    // 更新关键结果进度
    const newValue = progress.currentValue || 0
    const progressPercentage = Math.min((newValue / (bestMatch.target_value || 100)) * 100, 100)

    const { data: updatedKR, error: updateError } = await supabase
      .from('key_results')
      .update({
        current_value: newValue,
        progress_percentage: Math.round(progressPercentage),
        status: progressPercentage >= 100 ? 'completed' : 'active'
      })
      .eq('id', bestMatch.id)
      .select()
      .single()

    if (updateError) {
      console.error('更新进度失败:', updateError)
      return NextResponse.json({ error: '更新进度失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '进度更新成功！',
      data: updatedKR,
      aiResponse: generateProgressUpdateResponse(bestMatch, updatedKR)
    })

  } catch (error) {
    console.error('更新进度异常:', error)
    return NextResponse.json({ error: '更新进度失败' }, { status: 500 })
  }
}

// 获取OKR状态
async function getOKRStatus(userId: string): Promise<NextResponse> {
  try {
    const { data: okrs, error } = await supabase
      .from('okrs')
      .select('*, key_results(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: '获取OKR状态失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: okrs,
      summary: generateOKRSummary(okrs as any)
    })

  } catch (error) {
    console.error('获取OKR状态异常:', error)
    return NextResponse.json({ error: '获取OKR状态失败' }, { status: 500 })
  }
}

// 辅助函数
function generateSuggestions(intent: OKRIntent, message: string): string[] {
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
  return `🎯 OKR创建成功！\n\n**目标**: ${okr.title}\n\n**关键结果**:\n${
    keyResults.map((kr, i) => `${i + 1}. ${kr.title} (目标: ${kr.target_value}${kr.unit})`).join('\n')
  }\n\n你可以随时告诉我学习进度，我会帮你更新OKR状态！`
}

function generateProgressUpdateResponse(oldKR: any, newKR: any): string {
  return `📈 进度更新成功！\n\n**${newKR.title}**\n进度: ${newKR.current_value}/${oldKR.target_value}${newKR.unit} (${newKR.progress_percentage}%)\n\n${
    newKR.progress_percentage >= 100 ? '🎉 恭喜完成这个目标！' : 
    newKR.progress_percentage >= 80 ? '💪 快完成了，加油！' :
    newKR.progress_percentage >= 50 ? '👍 进展不错，继续保持！' :
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
  
  return `你目前有 ${activeOKRs.length} 个活跃目标，${totalKRs} 个关键结果中已完成 ${completedKRs} 个。\n\n最近的目标: ${okrs[0]?.title || '无'}`
}