'use client'

import { OKR, KeyResult, NewOKR, NewKeyResult, OKRWithKeyResults } from '@/types/okr'

export class OKRServiceAPI {
  // 获取用户的所有OKR
  static async getUserOKRs(userId: string): Promise<{ data: OKRWithKeyResults[] | null; error: any }> {
    try {
      const response = await fetch(`/api/okr?action=getUserOKRs&userId=${userId}`)
      const result = await response.json()
      
      if (!response.ok) {
        // 如果是503错误（服务不可用），回退到空数据
        if (response.status === 503) {
          console.warn('API服务不可用，返回空数据')
          return { data: [], error: null }
        }
        return { data: null, error: result.error || 'Failed to fetch OKRs' }
      }
      
      return { data: result.data, error: null }
    } catch (error) {
      console.error('获取用户OKR异常:', error)
      return { data: [], error: null } // 回退到空数据而不是错误
    }
  }

  // 创建新的OKR
  static async createOKR(okrData: NewOKR): Promise<{ data: OKR | null; error: any }> {
    try {
      const response = await fetch('/api/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createOKR',
          data: okrData
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // 如果是503错误，提示用户稍后重试
        if (response.status === 503) {
          return { data: null, error: 'API服务暂时不可用，请稍后重试' }
        }
        return { data: null, error: result.error || 'Failed to create OKR' }
      }
      
      return { data: result.data, error: null }
    } catch (error) {
      console.error('创建OKR异常:', error)
      return { data: null, error }
    }
  }

  // 创建关键结果
  static async createKeyResult(keyResultData: NewKeyResult): Promise<{ data: KeyResult | null; error: any }> {
    try {
      const response = await fetch('/api/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createKeyResult',
          data: keyResultData
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { data: null, error: result.error || 'Failed to create key result' }
      }
      
      return { data: result.data, error: null }
    } catch (error) {
      console.error('创建关键结果异常:', error)
      return { data: null, error }
    }
  }

  // 更新关键结果进度
  static async updateKeyResultProgress(keyResultId: string, currentValue: number): Promise<{ error: any }> {
    try {
      const response = await fetch('/api/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateKeyResultProgress',
          data: { keyResultId, currentValue }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { error: result.error || 'Failed to update progress' }
      }
      
      return { error: null }
    } catch (error) {
      console.error('更新关键结果进度异常:', error)
      return { error }
    }
  }

  // 删除OKR
  static async deleteOKR(okrId: string): Promise<{ error: any }> {
    try {
      const response = await fetch('/api/okr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteOKR',
          data: { okrId }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        return { error: result.error || 'Failed to delete OKR' }
      }
      
      return { error: null }
    } catch (error) {
      console.error('删除OKR异常:', error)
      return { error }
    }
  }

  // 获取OKR统计信息
  static async getOKRStats(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data: okrs, error } = await this.getUserOKRs(userId)
      
      if (error || !okrs) {
        return { data: null, error }
      }

      // 计算统计信息
      const totalOKRs = okrs.length
      const completedOKRs = okrs.filter(okr => okr.status === 'completed').length
      const activeOKRs = okrs.filter(okr => okr.status === 'active').length
      
      const totalKeyResults = okrs.reduce((sum, okr) => sum + okr.keyResults.length, 0)
      const completedKeyResults = okrs.reduce((sum, okr) => 
        sum + okr.keyResults.filter(kr => kr.status === 'completed').length, 0
      )

      const averageProgress = totalOKRs > 0 
        ? Math.round(okrs.reduce((sum, okr) => sum + (okr.progress_percentage || okr.progress || 0), 0) / totalOKRs)
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