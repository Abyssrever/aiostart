/**
 * 数据库初始化脚本
 * 检查并创建必要的表结构
 */

const { createClient } = require('@supabase/supabase-js')

// 从环境变量获取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 检查表是否存在的SQL
const CHECK_TABLE_SQL = `
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = $1;
`

// 获取表结构的SQL
const GET_COLUMNS_SQL = `
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = $1
  ORDER BY ordinal_position;
`

// 创建OKR表的SQL
const CREATE_OKRS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'personal',
    objective_type VARCHAR(20) DEFAULT 'personal',
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'active',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    start_date DATE,
    end_date DATE,
    parent_okr_id UUID,
    target_quarter VARCHAR(10),
    target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`

// 创建关键结果表的SQL
const CREATE_KEY_RESULTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    okr_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) DEFAULT 'active',
    measurement_type VARCHAR(20) DEFAULT 'numeric',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`

// 创建索引
const CREATE_INDEXES_SQL = `
  CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
  CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);
  CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
`

async function checkTable(tableName) {
  console.log(`🔍 检查表 ${tableName}...`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: CHECK_TABLE_SQL,
      params: [tableName]
    })
    
    if (error) {
      // 如果rpc不可用，尝试直接查询
      const result = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        
      return result.data && result.data.length > 0
    }
    
    return data && data.length > 0
  } catch (err) {
    console.warn(`⚠️  无法检查表 ${tableName}:`, err.message)
    return false
  }
}

async function getTableColumns(tableName) {
  console.log(`📋 获取表 ${tableName} 的列信息...`)
  
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position')
    
    if (error) {
      console.error(`❌ 获取表 ${tableName} 列信息失败:`, error)
      return []
    }
    
    return data || []
  } catch (err) {
    console.warn(`⚠️  无法获取表 ${tableName} 列信息:`, err.message)
    return []
  }
}

async function executeSQL(sql, description) {
  console.log(`⚡ ${description}...`)
  
  try {
    // 对于CREATE TABLE语句，我们需要使用rpc或者直接执行
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`❌ ${description} 失败:`, error)
      return false
    }
    
    console.log(`✅ ${description} 成功`)
    return true
  } catch (err) {
    console.warn(`⚠️  ${description} 出错:`, err.message)
    return false
  }
}

async function initDatabase() {
  console.log('🚀 开始初始化数据库...')
  console.log('📡 连接到:', supabaseUrl)
  
  // 检查okrs表
  const okrsExists = await checkTable('okrs')
  if (!okrsExists) {
    console.log('📦 创建 okrs 表...')
    await executeSQL(CREATE_OKRS_TABLE_SQL, '创建 okrs 表')
  } else {
    console.log('✅ okrs 表已存在')
    const columns = await getTableColumns('okrs')
    console.log('📋 okrs 表列:', columns.map(c => c.column_name).join(', '))
  }
  
  // 检查key_results表
  const keyResultsExists = await checkTable('key_results')
  if (!keyResultsExists) {
    console.log('📦 创建 key_results 表...')
    await executeSQL(CREATE_KEY_RESULTS_TABLE_SQL, '创建 key_results 表')
  } else {
    console.log('✅ key_results 表已存在')
    const columns = await getTableColumns('key_results')
    console.log('📋 key_results 表列:', columns.map(c => c.column_name).join(', '))
  }
  
  // 创建索引
  console.log('📚 创建索引...')
  await executeSQL(CREATE_INDEXES_SQL, '创建索引')
  
  console.log('🎉 数据库初始化完成！')
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase().catch(console.error)
}

module.exports = { initDatabase, checkTable, getTableColumns }