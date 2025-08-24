'use client'

// 生产环境OKR服务 - 支持演示模式
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

// 本地存储键
const STORAGE_KEY = 'qiming_okrs'

export class OKRServiceProduction {
  // 从本地存储获取OKR数据
  private static getStoredOKRs(userId: string): OKRWithKeyResults[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // 保存OKR数据到本地存储
  private static saveOKRs(userId: string, okrs: OKRWithKeyResults[]) {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(okrs))
    } catch (error) {
      console.error('保存OKR到本地存储失败:', error)
    }
  }

  // 获取用户的所有OKR
  static async getUserOKRs(userId: string): Promise<{ data: OKRWithKeyResults[] | null; error: any }> {
    try {
      // 在生产环境中使用本地存储作为演示数据
      const okrs = this.getStoredOKRs(userId)
      return { data: okrs, error: null }
    } catch (error) {
      console.error('获取用户OKR异常:', error)
      return { data: null, error }
    }
  }

  // 创建新的OKR
  static async createOKR(okrData: NewOKR): Promise<{ data: OKR | null; error: any }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const newOKR: OKR = {
        id: crypto.randomUUID(),
        user_id: okrData.user_id,
        title: okrData.title,
        description: okrData.description || '',
        category: okrData.category || 'personal',
        priority: okrData.priority as any || 'medium',
        status: okrData.status as any || 'active',
        start_date: okrData.start_date || today,
        end_date: okrData.end_date || endDate,
        progress: 0,
        parent_okr_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 保存到本地存储
      const existingOKRs = this.getStoredOKRs(okrData.user_id)
      const updatedOKRs = [{ ...newOKR, keyResults: [] }, ...existingOKRs]
      this.saveOKRs(okrData.user_id, updatedOKRs)

      console.log('演示模式：OKR已保存到本地存储')
      return { data: newOKR, error: null }
    } catch (error) {
      console.error('创建OKR异常:', error)
      return { data: null, error }
    }
  }

  // 创建关键结果
  static async createKeyResult(keyResultData: NewKeyResult): Promise<{ data: KeyResult | null; error: any }> {
    try {
      const newKeyResult: KeyResult = {
        id: crypto.randomUUID(),
        okr_id: keyResultData.okr_id,
        title: keyResultData.title,
        description: keyResultData.description || '',
        target_value: keyResultData.target_value || 0,
        current_value: 0,
        unit: keyResultData.unit || '',
        progress: 0,
        status: 'active',
        measurement_type: 'numeric',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 更新本地存储中的OKR
      const userId = this.findUserIdByOKR(keyResultData.okr_id)
      if (userId) {
        const existingOKRs = this.getStoredOKRs(userId)
        const updatedOKRs = existingOKRs.map(okr => {
          if (okr.id === keyResultData.okr_id) {
            return {
              ...okr,
              keyResults: [...okr.keyResults, newKeyResult]
            }
          }
          return okr
        })
        this.saveOKRs(userId, updatedOKRs)
      }

      return { data: newKeyResult, error: null }
    } catch (error) {
      console.error('创建关键结果异常:', error)
      return { data: null, error }
    }
  }

  // 查找OKR所属的用户ID
  private static findUserIdByOKR(okrId: string): string | null {
    if (typeof window === 'undefined') return null
    
    try {
      // 简单实现：检查所有用户的本地存储
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY))
      for (const key of keys) {
        const okrs = JSON.parse(localStorage.getItem(key) || '[]')
        const okr = okrs.find((o: any) => o.id === okrId)
        if (okr) {
          return okr.user_id
        }
      }
    } catch {}
    return null
  }

  // 更新关键结果进度
  static async updateKeyResultProgress(keyResultId: string, currentValue: number): Promise<{ error: any }> {
    try {
      const userId = this.findUserIdByKeyResult(keyResultId)
      if (!userId) {
        return { error: '找不到关键结果' }
      }

      const existingOKRs = this.getStoredOKRs(userId)
      const updatedOKRs = existingOKRs.map(okr => ({
        ...okr,
        keyResults: okr.keyResults.map(kr => {
          if (kr.id === keyResultId) {
            const progressPercentage = kr.target_value && kr.target_value > 0 
              ? Math.min((currentValue / kr.target_value) * 100, 100)
              : 0
            return {
              ...kr,
              current_value: currentValue,
              progress: Math.round(progressPercentage),
              status: (progressPercentage >= 100 ? 'completed' : 'active') as 'active' | 'completed' | 'at_risk' | 'blocked',
              updated_at: new Date().toISOString()
            }
          }
          return kr
        })
      }))

      this.saveOKRs(userId, updatedOKRs)
      return { error: null }
    } catch (error) {
      console.error('更新关键结果进度异常:', error)
      return { error }
    }
  }

  // 查找关键结果所属的用户ID
  private static findUserIdByKeyResult(keyResultId: string): string | null {
    if (typeof window === 'undefined') return null
    
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY))
      for (const key of keys) {
        const okrs = JSON.parse(localStorage.getItem(key) || '[]')
        for (const okr of okrs) {
          const kr = okr.keyResults?.find((k: any) => k.id === keyResultId)
          if (kr) {
            return okr.user_id
          }
        }
      }
    } catch {}
    return null
  }

  // 删除OKR
  static async deleteOKR(okrId: string): Promise<{ error: any }> {
    try {
      const userId = this.findUserIdByOKR(okrId)
      if (!userId) {
        return { error: '找不到OKR' }
      }

      const existingOKRs = this.getStoredOKRs(userId)
      const updatedOKRs = existingOKRs.filter(okr => okr.id !== okrId)
      this.saveOKRs(userId, updatedOKRs)

      return { error: null }
    } catch (error) {
      console.error('删除OKR异常:', error)
      return { error }
    }
  }

  // 获取OKR统计信息
  static async getOKRStats(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const okrs = this.getStoredOKRs(userId)

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