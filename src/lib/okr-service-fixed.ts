'use client'

import { supabase, supabaseAdmin } from './supabase'

// 开发环境使用admin客户端绕过RLS
const dbClient = process.env.NODE_ENV === 'development' ? supabaseAdmin : supabase

// 根据实际数据库结构定义类型
export interface OKR {
  id: string
  user_id: string
  title: string
  description: string | null
  category: 'personal' | 'academic' | 'skill' | string
  priority: 'low' | 'medium' | 'high'
  status: 'draft' | 'active' | 'completed' | 'paused'
  start_date: string
  end_date: string
  progress: number
  parent_okr_id: string | null
  created_at: string
  updated_at: string
}

export interface KeyResult {
  id: string
  okr_id: string
  title: string
  description: string | null
  target_value: number | null
  current_value: number
  unit: string | null
  progress_percentage: number
  status: 'active' | 'completed' | 'at_risk' | 'blocked'
  created_at: string
  updated_at: string
}

export interface NewOKR {
  user_id: string
  title: string
  description?: string
  category?: string
  priority?: string
  status?: string
  start_date: string
  end_date: string
}

export interface NewKeyResult {
  okr_id: string
  title: string
  description?: string
  target_value?: number
  current_value?: number
  unit?: string
}

// OKR with Key Results
export interface OKRWithKeyResults extends OKR {
  keyResults: KeyResult[]
}

// OKR操作服务
export class OKRServiceFixed {
  // 获取用户的所有OKR
  static async getUserOKRs(userId: string): Promise<{ data: OKRWithKeyResults[] | null; error: any }> {
    try {
      const { data: okrs, error: okrError } = await dbClient
        .from('okrs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (okrError) {
        console.error('获取OKR失败:', okrError)
        return { data: null, error: okrError }
      }

      if (!okrs) {
        return { data: [], error: null }
      }

      // 获取所有OKR的关键结果
      const okrIds = okrs.map(okr => okr.id)
      const { data: keyResults, error: krError } = await dbClient
        .from('key_results')
        .select('*')
        .in('okr_id', okrIds)
        .order('created_at', { ascending: true })

      if (krError) {
        console.error('获取关键结果失败:', krError)
        return { data: null, error: krError }
      }

      // 组合数据
      const okrsWithKeyResults: OKRWithKeyResults[] = okrs.map(okr => ({
        ...okr,
        keyResults: keyResults?.filter(kr => kr.okr_id === okr.id) || []
      }))

      return { data: okrsWithKeyResults, error: null }
    } catch (error) {
      console.error('获取用户OKR异常:', error)
      return { data: null, error }
    }
  }

  // 获取单个OKR及其关键结果
  static async getOKRById(okrId: string): Promise<{ data: OKRWithKeyResults | null; error: any }> {
    try {
      const { data: okr, error: okrError } = await dbClient
        .from('okrs')
        .select('*')
        .eq('id', okrId)
        .single()

      if (okrError) {
        console.error('获取OKR详情失败:', okrError)
        return { data: null, error: okrError }
      }

      // 获取关键结果
      const { data: keyResults, error: krError } = await dbClient
        .from('key_results')
        .select('*')
        .eq('okr_id', okrId)
        .order('created_at', { ascending: true })

      if (krError) {
        console.error('获取关键结果失败:', krError)
        return { data: null, error: krError }
      }

      const okrWithKeyResults: OKRWithKeyResults = {
        ...okr,
        keyResults: keyResults || []
      }

      return { data: okrWithKeyResults, error: null }
    } catch (error) {
      console.error('获取OKR详情异常:', error)
      return { data: null, error }
    }
  }

  // 创建新的OKR
  static async createOKR(okrData: NewOKR): Promise<{ data: OKR | null; error: any }> {
    try {
      // 确保日期字段不为空
      const today = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { data, error } = await dbClient
        .from('okrs')
        .insert({
          user_id: okrData.user_id,
          title: okrData.title,
          description: okrData.description || '',
          category: okrData.category || 'personal',
          priority: okrData.priority || 'medium',
          status: okrData.status || 'active',
          start_date: okrData.start_date || today,
          end_date: okrData.end_date || endDate,
          progress: 0 // 初始进度为0
        })
        .select()
        .single()

      if (error) {
        console.error('创建OKR失败:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('创建OKR异常:', error)
      return { data: null, error }
    }
  }

  // 更新OKR
  static async updateOKR(okrId: string, updates: Partial<OKR>): Promise<{ data: OKR | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('okrs')
        .update(updates)
        .eq('id', okrId)
        .select()
        .single()

      if (error) {
        console.error('更新OKR失败:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('更新OKR异常:', error)
      return { data: null, error }
    }
  }

  // 删除OKR
  static async deleteOKR(okrId: string): Promise<{ error: any }> {
    try {
      const { error } = await dbClient
        .from('okrs')
        .delete()
        .eq('id', okrId)

      if (error) {
        console.error('删除OKR失败:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('删除OKR异常:', error)
      return { error }
    }
  }

  // 创建关键结果
  static async createKeyResult(keyResultData: NewKeyResult): Promise<{ data: KeyResult | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('key_results')
        .insert({
          okr_id: keyResultData.okr_id,
          title: keyResultData.title,
          description: keyResultData.description || '',
          target_value: keyResultData.target_value || 100,
          current_value: keyResultData.current_value || 0,
          unit: keyResultData.unit || '',
          measurement_type: 'numeric', // 设置默认度量类型
          status: 'active', // 设置默认状态
          progress: 0 // 初始进度为0
        })
        .select()
        .single()

      if (error) {
        console.error('创建关键结果失败:', error)
        return { data: null, error }
      }

      // 更新OKR进度
      await this.updateOKRProgress(keyResultData.okr_id)

      return { data, error: null }
    } catch (error) {
      console.error('创建关键结果异常:', error)
      return { data: null, error }
    }
  }

  // 更新关键结果
  static async updateKeyResult(keyResultId: string, updates: Partial<KeyResult>): Promise<{ data: KeyResult | null; error: any }> {
    try {
      const { data, error } = await dbClient
        .from('key_results')
        .update(updates)
        .eq('id', keyResultId)
        .select()
        .single()

      if (error) {
        console.error('更新关键结果失败:', error)
        return { data: null, error }
      }

      // 更新OKR进度
      if (data?.okr_id) {
        await this.updateOKRProgress(data.okr_id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('更新关键结果异常:', error)
      return { data: null, error }
    }
  }

  // 删除关键结果
  static async deleteKeyResult(keyResultId: string): Promise<{ error: any }> {
    try {
      // 先获取OKR ID
      const { data: keyResult } = await dbClient
        .from('key_results')
        .select('okr_id')
        .eq('id', keyResultId)
        .single()

      const { error } = await dbClient
        .from('key_results')
        .delete()
        .eq('id', keyResultId)

      if (error) {
        console.error('删除关键结果失败:', error)
        return { error }
      }

      // 更新OKR进度
      if (keyResult?.okr_id) {
        await this.updateOKRProgress(keyResult.okr_id)
      }

      return { error: null }
    } catch (error) {
      console.error('删除关键结果异常:', error)
      return { error }
    }
  }

  // 更新关键结果进度
  static async updateKeyResultProgress(keyResultId: string, currentValue: number): Promise<{ error: any }> {
    try {
      // 获取关键结果信息
      const { data: keyResult, error: fetchError } = await dbClient
        .from('key_results')
        .select('*')
        .eq('id', keyResultId)
        .single()

      if (fetchError || !keyResult) {
        return { error: fetchError || '关键结果不存在' }
      }

      // 计算进度百分比
      let progressPercentage = 0
      if (keyResult.target_value && keyResult.target_value > 0) {
        progressPercentage = Math.min((currentValue / keyResult.target_value) * 100, 100)
      }

      // 更新关键结果
      const { error } = await dbClient
        .from('key_results')
        .update({
          current_value: currentValue,
          progress_percentage: Math.round(progressPercentage),
          status: progressPercentage >= 100 ? 'completed' : 'active'
        })
        .eq('id', keyResultId)

      if (error) {
        console.error('更新关键结果进度失败:', error)
        return { error }
      }

      // 更新OKR整体进度
      await this.updateOKRProgress(keyResult.okr_id)

      return { error: null }
    } catch (error) {
      console.error('更新关键结果进度异常:', error)
      return { error }
    }
  }

  // 自动计算并更新OKR进度
  static async updateOKRProgress(okrId: string): Promise<{ error: any }> {
    try {
      // 获取OKR的所有关键结果
      const { data: keyResults, error: fetchError } = await dbClient
        .from('key_results')
        .select('progress_percentage')
        .eq('okr_id', okrId)

      if (fetchError) {
        return { error: fetchError }
      }

      // 计算平均进度
      let averageProgress = 0
      if (keyResults && keyResults.length > 0) {
        const totalProgress = keyResults.reduce((sum, kr) => sum + (kr.progress_percentage || 0), 0)
        averageProgress = Math.round(totalProgress / keyResults.length)
      }

      // 更新OKR进度
      const { error } = await dbClient
        .from('okrs')
        .update({
          progress: averageProgress,
          status: averageProgress >= 100 ? 'completed' : 'active'
        })
        .eq('id', okrId)

      if (error) {
        console.error('更新OKR进度失败:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('更新OKR进度异常:', error)
      return { error }
    }
  }

  // 获取OKR统计信息
  static async getOKRStats(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data: okrs, error } = await dbClient
        .from('okrs')
        .select(`
          id,
          status,
          progress,
          created_at
        `)
        .eq('user_id', userId)

      if (error) {
        return { data: null, error }
      }

      if (!okrs) {
        return { data: { totalOKRs: 0, completedOKRs: 0, activeOKRs: 0, averageProgress: 0 }, error: null }
      }

      // 获取关键结果统计
      const okrIds = okrs.map(okr => okr.id)
      const { data: keyResults } = await dbClient
        .from('key_results')
        .select('id, status')
        .in('okr_id', okrIds)

      // 计算统计信息
      const totalOKRs = okrs.length
      const completedOKRs = okrs.filter(okr => okr.status === 'completed').length
      const activeOKRs = okrs.filter(okr => okr.status === 'active').length
      
      const totalKeyResults = keyResults?.length || 0
      const completedKeyResults = keyResults?.filter(kr => kr.status === 'completed').length || 0

      const averageProgress = totalOKRs > 0 
        ? Math.round(okrs.reduce((sum, okr) => sum + okr.progress, 0) / totalOKRs)
        : 0

      const stats = {
        totalOKRs,
        completedOKRs,
        activeOKRs,
        totalKeyResults,
        completedKeyResults,
        averageProgress,
        completionRate: totalOKRs > 0 ? Math.round((completedOKRs / totalOKRs) * 100) : 0
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('获取OKR统计失败:', error)
      return { data: null, error }
    }
  }
}

// 辅助函数
export const formatOKRProgress = (progress: number): string => {
  return `${Math.round(progress)}%`
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'active':
      return 'text-blue-600'
    case 'at_risk':
      return 'text-yellow-600'
    case 'blocked':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'active':
      return 'bg-blue-100 text-blue-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}