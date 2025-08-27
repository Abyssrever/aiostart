'use client'

import { supabase, Database } from './supabase'

// 类型定义
export type OKR = Database['public']['Tables']['okrs']['Row']
export type KeyResult = Database['public']['Tables']['key_results']['Row'] 
export type NewOKR = Database['public']['Tables']['okrs']['Insert']
export type NewKeyResult = Database['public']['Tables']['key_results']['Insert']
export type UpdateOKR = Database['public']['Tables']['okrs']['Update']
export type UpdateKeyResult = Database['public']['Tables']['key_results']['Update']

// OKR with Key Results
export interface OKRWithKeyResults extends OKR {
  keyResults: KeyResult[]
}

// OKR操作服务
export class OKRService {
  // 获取用户的所有OKR
  static async getUserOKRs(userId: string): Promise<{ data: OKRWithKeyResults[] | null; error: any }> {
    try {
      const { data: okrs, error: okrError } = await supabase
        .from('okrs')
        .select(`
          *,
          key_results (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (okrError) {
        console.error('获取OKR失败:', okrError)
        return { data: null, error: okrError }
      }

      // 转换数据结构
      const okrsWithKeyResults: OKRWithKeyResults[] = (okrs as any[])?.map(okr => ({
        ...okr,
        keyResults: okr.key_results || []
      })) || []

      return { data: okrsWithKeyResults, error: null }
    } catch (error) {
      console.error('获取用户OKR异常:', error)
      return { data: null, error }
    }
  }

  // 获取单个OKR及其关键结果
  static async getOKRById(okrId: string): Promise<{ data: OKRWithKeyResults | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('okrs')
        .select(`
          *,
          key_results (*)
        `)
        .eq('id', okrId)
        .single()

      if (error) {
        console.error('获取OKR详情失败:', error)
        return { data: null, error }
      }

      const okrWithKeyResults: OKRWithKeyResults = {
        ...data,
        keyResults: data.key_results || []
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
      const { data, error } = await supabase
        .from('okrs')
        .insert(okrData)
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
  static async updateOKR(okrId: string, updates: UpdateOKR): Promise<{ data: OKR | null; error: any }> {
    try {
      const { data, error } = await supabase
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
      const { error } = await supabase
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
      const { data, error } = await supabase
        .from('key_results')
        .insert(keyResultData)
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
  static async updateKeyResult(keyResultId: string, updates: UpdateKeyResult): Promise<{ data: KeyResult | null; error: any }> {
    try {
      const { data, error } = await supabase
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
      const { data: keyResult } = await supabase
        .from('key_results')
        .select('okr_id')
        .eq('id', keyResultId)
        .single()

      const { error } = await supabase
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
      const { data: keyResult, error: fetchError } = await supabase
        .from('key_results')
        .select('*')
        .eq('id', keyResultId)
        .single()

      if (fetchError || !keyResult) {
        return { error: fetchError || '关键结果不存在' }
      }

      // 计算进度百分比
      let progressPercentage = 0
      if (keyResult.measurement_type === 'boolean') {
        progressPercentage = currentValue >= 1 ? 100 : 0
      } else if (keyResult.measurement_type === 'percentage') {
        progressPercentage = Math.min(currentValue, 100)
      } else if (keyResult.target_value && keyResult.target_value > 0) {
        progressPercentage = Math.min((currentValue / keyResult.target_value) * 100, 100)
      }

      // 更新关键结果
      const { error } = await supabase
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
      const { data: keyResults, error: fetchError } = await supabase
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
      const { error } = await supabase
        .from('okrs')
        .update({
          progress_percentage: averageProgress,
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
      const { data: okrs, error } = await supabase
        .from('okrs')
        .select(`
          id,
          status,
          progress_percentage,
          created_at,
          key_results (
            id,
            status,
            progress_percentage
          )
        `)
        .eq('user_id', userId)

      if (error) {
        return { data: null, error }
      }

      // 计算统计信息
      const totalOKRs = okrs?.length || 0
      const completedOKRs = okrs?.filter(okr => okr.status === 'completed').length || 0
      const activeOKRs = okrs?.filter(okr => okr.status === 'active').length || 0
      
      const totalKeyResults = okrs?.reduce((sum, okr) => sum + ((okr as any).key_results?.length || 0), 0) || 0
      const completedKeyResults = okrs?.reduce((sum, okr) => 
        sum + ((okr as any).key_results?.filter((kr: any) => kr.status === 'completed').length || 0), 0
      ) || 0

      const averageProgress = totalOKRs > 0 
        ? Math.round(okrs.reduce((sum, okr) => sum + okr.progress_percentage, 0) / totalOKRs)
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
    case 'at_risk':
      return 'bg-yellow-100 text-yellow-800'
    case 'blocked':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}