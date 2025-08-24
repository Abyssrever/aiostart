'use client'

// API-based OKR Service for production environment
export interface OKR {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'draft' | 'active' | 'completed' | 'paused'
  progress: number
  start_date: string
  end_date: string
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
  progress: number
  status: 'active' | 'completed' | 'at_risk' | 'blocked'
  measurement_type: string
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
  unit?: string
}

export interface OKRWithKeyResults extends OKR {
  keyResults: KeyResult[]
}

export class OKRServiceAPI {
  // 获取用户的所有OKR
  static async getUserOKRs(userId: string): Promise<{ data: OKRWithKeyResults[] | null; error: any }> {
    try {
      const response = await fetch(`/api/okr?action=getUserOKRs&userId=${userId}`)
      const result = await response.json()
      
      if (!response.ok) {
        return { data: null, error: result.error || 'Failed to fetch OKRs' }
      }
      
      return { data: result.data, error: null }
    } catch (error) {
      console.error('获取用户OKR异常:', error)
      return { data: null, error }
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