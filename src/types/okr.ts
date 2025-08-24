// 统一的OKR类型定义，兼容不同服务
export interface OKRBase {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled'
  parent_okr_id: string | null
  created_at: string
  updated_at: string
}

// 扩展接口以兼容不同数据库schema
export interface OKR extends OKRBase {
  // 兼容固定服务的字段
  category?: string
  priority?: 'low' | 'medium' | 'high'
  start_date?: string
  end_date?: string
  progress?: number
  
  // 兼容API服务的字段  
  objective_type?: 'personal' | 'course' | 'college'
  target_quarter?: string | null
  target_year?: number
  progress_percentage?: number
}

export interface KeyResultBase {
  id: string
  okr_id: string
  title: string
  description: string | null
  target_value: number | null
  current_value: number
  unit: string | null
  status: 'active' | 'completed' | 'at_risk' | 'blocked'
  measurement_type: string | 'numeric' | 'boolean' | 'percentage'
  created_at: string
  updated_at: string
}

export interface KeyResult extends KeyResultBase {
  // 兼容不同进度字段名
  progress?: number
  progress_percentage?: number
}

export interface NewOKR {
  user_id: string
  title: string
  description?: string
  category?: string
  objective_type?: 'personal' | 'course' | 'college'
  priority?: string
  status?: string
  start_date?: string
  end_date?: string
  target_year?: number
  target_quarter?: string
}

export interface NewKeyResult {
  okr_id: string
  title: string
  description?: string
  target_value?: number
  current_value?: number
  unit?: string
}

export interface OKRWithKeyResults extends OKR {
  keyResults: KeyResult[]
}

// 统计数据接口
export interface OKRStats {
  totalOKRs: number
  completedOKRs: number
  activeOKRs: number
  totalKeyResults: number
  completedKeyResults: number
  averageProgress: number
  completionRate: number
}