import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 检查必要的环境变量
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

// 创建Supabase客户端 - 优先使用Service Role，回退到匿名密钥
const effectiveKey = supabaseServiceKey || supabaseAnonKey
const useServiceRole = !!supabaseServiceKey

const supabaseClient = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 记录警告但不阻止API工作
if (!useServiceRole) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key with RLS restrictions')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'createOKR':
        return await createOKR(data)
      case 'createKeyResult':
        return await createKeyResult(data)
      case 'updateKeyResultProgress':
        return await updateKeyResultProgress(data)
      case 'deleteOKR':
        return await deleteOKR(data)
      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('OKR API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 检测数据库表结构并获取可用字段
async function getTableStructure() {
  try {
    const { data: columns } = await supabaseClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'okrs')
    
    if (!columns) return null
    
    const columnNames = columns.map(c => c.column_name)
    return {
      hasObjectiveType: columnNames.includes('objective_type'),
      hasCategory: columnNames.includes('category'),
      hasProgress: columnNames.includes('progress'),
      hasProgressPercentage: columnNames.includes('progress_percentage'),
      hasPriority: columnNames.includes('priority'),
      hasStartDate: columnNames.includes('start_date'),
      hasEndDate: columnNames.includes('end_date'),
      hasTargetYear: columnNames.includes('target_year'),
      hasTargetQuarter: columnNames.includes('target_quarter'),
      allColumns: columnNames
    }
  } catch (error) {
    console.error('获取表结构失败:', error)
    return null
  }
}

async function createOKR(okrData: any) {
  try {
    console.log('创建OKR请求数据:', okrData)
    
    // 检测表结构
    const structure = await getTableStructure()
    console.log('数据库表结构:', structure)
    
    // 根据表结构动态构建插入数据
    const insertData: any = {
      user_id: okrData.user_id,
      title: okrData.title,
    }
    
    // 只添加存在的字段
    if (structure) {
      if (okrData.description !== undefined) insertData.description = okrData.description
      
      // 类型字段
      if (structure.hasObjectiveType) {
        insertData.objective_type = okrData.objective_type || okrData.category || 'personal'
      } else if (structure.hasCategory) {
        insertData.category = okrData.category || 'personal'
      }
      
      // 优先级
      if (structure.hasPriority) {
        insertData.priority = okrData.priority || 'medium'
      }
      
      // 状态
      insertData.status = okrData.status || 'active'
      
      // 进度字段
      if (structure.hasProgressPercentage) {
        insertData.progress_percentage = 0
      } else if (structure.hasProgress) {
        insertData.progress = 0
      }
      
      // 日期字段
      if (structure.hasStartDate) {
        insertData.start_date = okrData.start_date
      }
      if (structure.hasEndDate) {
        insertData.end_date = okrData.end_date
      }
      
      // 目标年份和季度
      if (structure.hasTargetYear) {
        insertData.target_year = okrData.target_year || new Date().getFullYear()
      }
      if (structure.hasTargetQuarter) {
        insertData.target_quarter = okrData.target_quarter || null
      }
    }
    
    console.log('准备插入的数据:', insertData)
    
    const { data, error } = await supabaseClient
      .from('okrs')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('创建OKR数据库错误:', error)
      
      // 如果仍然失败，尝试最基础的字段
      if (error.message.includes('column') && error.message.includes('not found')) {
        console.log('尝试使用最基础的字段结构...')
        const basicData = {
          user_id: okrData.user_id,
          title: okrData.title,
          description: okrData.description || null,
          status: okrData.status || 'active'
        }
        
        const basicResult = await supabaseClient
          .from('okrs')
          .insert(basicData)
          .select()
          .single()
          
        if (basicResult.error) {
          return NextResponse.json({ 
            error: `创建失败: ${basicResult.error.message}`,
            availableColumns: structure?.allColumns || 'unknown'
          }, { status: 400 })
        }
        
        console.log('使用基础结构创建OKR成功:', basicResult.data)
        return NextResponse.json({ data: basicResult.data, success: true })
      }
      
      return NextResponse.json({ 
        error: error.message,
        availableColumns: structure?.allColumns || 'unknown'
      }, { status: 400 })
    }

    console.log('创建OKR成功:', data)
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('创建OKR异常:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

async function createKeyResult(keyResultData: any) {
  try {
    const { data, error } = await supabaseClient
      .from('key_results')
      .insert({
        okr_id: keyResultData.okr_id,
        title: keyResultData.title,
        description: keyResultData.description || '',
        target_value: keyResultData.target_value || 0,
        unit: keyResultData.unit || '',
        current_value: 0,
        progress_percentage: 0,
        status: 'active',
        measurement_type: 'numeric'
      })
      .select()
      .single()

    if (error) {
      console.error('创建关键结果失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('创建关键结果异常:', error)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

async function updateKeyResultProgress(updateData: any) {
  try {
    const { keyResultId, currentValue } = updateData
    
    // 获取关键结果信息
    const { data: keyResult, error: fetchError } = await supabaseClient
      .from('key_results')
      .select('*')
      .eq('id', keyResultId)
      .single()

    if (fetchError || !keyResult) {
      return NextResponse.json({ error: '关键结果不存在' }, { status: 404 })
    }

    // 计算进度百分比
    let progressPercentage = 0
    if (keyResult.target_value && keyResult.target_value > 0) {
      progressPercentage = Math.min((currentValue / keyResult.target_value) * 100, 100)
    }

    // 更新关键结果
    const { data, error } = await supabaseClient
      .from('key_results')
      .update({
        current_value: currentValue,
        progress_percentage: Math.round(progressPercentage),
        status: progressPercentage >= 100 ? 'completed' : 'active'
      })
      .eq('id', keyResultId)
      .select()
      .single()

    if (error) {
      console.error('更新关键结果进度失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('更新进度异常:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

async function deleteOKR(deleteData: any) {
  try {
    const { okrId } = deleteData
    
    const { error } = await supabaseClient
      .from('okrs')
      .delete()
      .eq('id', okrId)

    if (error) {
      console.error('删除OKR失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除OKR异常:', error)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

async function testConnection() {
  try {
    console.log('测试数据库连接...')
    
    // 测试基本连接
    const { data: basicTest, error: basicError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (basicError) {
      console.error('基本连接测试失败:', basicError)
      return NextResponse.json({ 
        error: '数据库连接失败', 
        details: basicError.message,
        step: 'basic_connection'
      }, { status: 500 })
    }
    
    console.log('基本连接正常，找到表:', basicTest?.map(t => t.table_name))
    
    // 测试okrs表是否存在
    const { data: okrsTable, error: okrsError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'okrs')
    
    let okrsExists = !okrsError && okrsTable && okrsTable.length > 0
    console.log('okrs表存在:', okrsExists)
    
    // 如果okrs表存在，获取表结构
    let columns: Array<{column_name: string, data_type: string, is_nullable: string, column_default: string | null}> = []
    if (okrsExists) {
      const { data: columnData, error: colError } = await supabaseClient
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'okrs')
        .order('ordinal_position')
      
      if (!colError && columnData) {
        columns = columnData
      }
      console.log('okrs表列:', columns.map(c => c.column_name))
    }
    
    // 测试key_results表
    const { data: krTable, error: krError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'key_results')
    
    let keyResultsExists = !krError && krTable && krTable.length > 0
    console.log('key_results表存在:', keyResultsExists)
    
    // 获取所有用户表
    const { data: userTables } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    const allTables = userTables?.map(t => t.table_name) || []
    
    const result = {
      success: true,
      message: '数据库连接测试完成',
      connection: {
        status: '正常',
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...'
      },
      tables: {
        all: allTables,
        okrs: {
          exists: okrsExists,
          columns: okrsExists ? columns : null
        },
        keyResults: {
          exists: keyResultsExists
        }
      },
      recommendations: [] as string[]
    }
    
    // 添加建议
    if (!okrsExists) {
      result.recommendations.push('需要创建 okrs 表')
    } else if (columns.length === 0) {
      result.recommendations.push('无法读取 okrs 表结构，可能权限不足')
    } else {
      const hasProgress = columns.some(c => c.column_name === 'progress')
      const hasProgressPercentage = columns.some(c => c.column_name === 'progress_percentage')
      if (!hasProgress && !hasProgressPercentage) {
        result.recommendations.push('okrs 表缺少进度字段 (progress 或 progress_percentage)')
      }
    }
    
    if (!keyResultsExists) {
      result.recommendations.push('需要创建 key_results 表')
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('测试连接异常:', error)
    return NextResponse.json({ 
      error: '测试连接失败', 
      details: error instanceof Error ? error.message : String(error),
      step: 'exception'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    switch (action) {
      case 'getUserOKRs':
        return await getUserOKRs(userId!)
      case 'testConnection':
        return await testConnection()
      default:
        return NextResponse.json({ error: '未知操作类型' }, { status: 400 })
    }
  } catch (error) {
    console.error('OKR API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

async function getUserOKRs(userId: string) {
  try {
    // 获取OKR数据
    const { data: okrs, error: okrError } = await supabaseClient
      .from('okrs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (okrError) {
      console.error('获取OKR失败:', okrError)
      return NextResponse.json({ error: okrError.message }, { status: 400 })
    }

    if (!okrs) {
      return NextResponse.json({ data: [], success: true })
    }

    // 获取所有OKR的关键结果
    const okrIds = okrs.map(okr => okr.id)
    const { data: keyResults, error: krError } = await supabaseClient
      .from('key_results')
      .select('*')
      .in('okr_id', okrIds)
      .order('created_at', { ascending: true })

    if (krError) {
      console.error('获取关键结果失败:', krError)
      return NextResponse.json({ error: krError.message }, { status: 400 })
    }

    // 组合数据
    const okrsWithKeyResults = okrs.map(okr => ({
      ...okr,
      keyResults: keyResults?.filter(kr => kr.okr_id === okr.id) || []
    }))

    return NextResponse.json({ data: okrsWithKeyResults, success: true })
  } catch (error) {
    console.error('获取用户OKR异常:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}