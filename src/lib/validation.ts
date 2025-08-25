/**
 * 数据验证和默认值工具
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data: any
}

/**
 * OKR数据验证和默认值设置
 */
export function validateOKRData(okrData: any): ValidationResult {
  const errors: string[] = []
  const data = { ...okrData }

  // 必填字段检查
  if (!data.user_id) {
    errors.push('用户ID不能为空')
  }
  
  if (!data.title || data.title.trim() === '') {
    errors.push('OKR标题不能为空')
  }

  // 设置默认值 - 确保必填字段有值
  const today = new Date().toISOString().split('T')[0]
  const defaultEndDate = new Date()
  defaultEndDate.setMonth(defaultEndDate.getMonth() + 3)
  
  data.start_date = data.start_date || today
  data.end_date = data.end_date || defaultEndDate.toISOString().split('T')[0]
  data.status = data.status || 'active'
  data.priority = data.priority || 'medium'
  data.category = data.category || 'personal'
  data.objective_type = data.objective_type || 'personal'
  data.target_year = data.target_year || new Date().getFullYear()

  return {
    isValid: errors.length === 0,
    errors,
    data
  }
}

/**
 * 安全的数据库插入数据构建
 */
export function buildInsertData(okrData: any, tableStructure: any): any {
  const validation = validateOKRData(okrData)
  
  if (!validation.isValid) {
    throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
  }
  
  const insertData: any = {
    user_id: validation.data.user_id,
    title: validation.data.title,
    description: validation.data.description || null,
    status: validation.data.status
  }

  // 根据表结构动态添加字段
  if (tableStructure) {
    // 类型字段
    if (tableStructure.hasObjectiveType) {
      insertData.objective_type = validation.data.objective_type
    } else if (tableStructure.hasCategory) {
      insertData.category = validation.data.category
    }
    
    // 优先级
    if (tableStructure.hasPriority) {
      insertData.priority = validation.data.priority
    }
    
    // 进度字段 - 根据实际表结构，只使用progress字段
    insertData.progress = 0
    
    // 日期字段 - 保证非空
    if (tableStructure.hasStartDate) {
      insertData.start_date = validation.data.start_date
    }
    if (tableStructure.hasEndDate) {
      insertData.end_date = validation.data.end_date
    }
    
    // 目标年份和季度
    if (tableStructure.hasTargetYear) {
      insertData.target_year = validation.data.target_year
    }
    if (tableStructure.hasTargetQuarter) {
      insertData.target_quarter = validation.data.target_quarter || null
    }
  }

  return insertData
}

/**
 * 数据库错误分析
 */
export function analyzeDBError(error: any): { type: string; field?: string; suggestion: string } {
  const message = error.message || error.toString()

  if (message.includes('not-null constraint')) {
    const fieldMatch = message.match(/column "([^"]+)"/)
    const field = fieldMatch ? fieldMatch[1] : 'unknown'
    
    return {
      type: 'not_null_violation',
      field,
      suggestion: `字段 ${field} 不能为空，请确保传入有效值或设置数据库默认值`
    }
  }

  if (message.includes('foreign key constraint')) {
    return {
      type: 'foreign_key_violation',
      suggestion: '外键约束违反，请检查关联的记录是否存在'
    }
  }

  if (message.includes('unique constraint')) {
    return {
      type: 'unique_violation',
      suggestion: '唯一约束违反，该记录可能已存在'
    }
  }

  return {
    type: 'unknown',
    suggestion: '数据库操作失败，请检查数据格式和约束条件'
  }
}