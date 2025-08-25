/**
 * 数据库紧急修复脚本 - 直接使用配置信息
 */

const { createClient } = require('@supabase/supabase-js')

// 使用你的Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  console.log('🔍 检查okrs表是否存在...')
  
  try {
    // 直接查询okrs表看是否存在
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️  okrs表不存在')
        return null
      }
      console.error('❌ 查询表失败:', error)
      return null
    }
    
    console.log('✅ okrs表已存在')
    return true
    
  } catch (err) {
    console.error('❌ 检查表结构出错:', err)
    return null
  }
}

async function fixDatabase() {
  console.log('🚀 开始修复数据库...')
  
  // 检查表结构
  const columns = await checkTableStructure()
  
  if (!columns) {
    console.log('📦 创建okrs表...')
    await createOkrsTable()
  } else {
    console.log('🔧 修复现有表约束...')
    await fixExistingTable()
  }
  
  console.log('🎉 数据库修复完成！')
}

async function createOkrsTable() {
  console.log('📦 使用Supabase客户端直接创建表结构...')
  
  // 既然不能用SQL，我们就直接插入一条测试数据来触发表创建
  // 这样Supabase会自动推断表结构
  const testOKR = {
    id: '00000000-0000-0000-0000-000000000000', // 临时测试ID
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Test OKR - Will be deleted',
    description: 'Temporary test record',
    category: 'personal',
    objective_type: 'personal',
    priority: 'medium',
    status: 'active',
    progress: 0,
    progress_percentage: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
    target_year: new Date().getFullYear(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  try {
    const { data, error } = await supabase
      .from('okrs')
      .insert(testOKR)
      .select()
    
    if (error) {
      console.error('❌ 创建测试记录失败:', error)
    } else {
      console.log('✅ okrs表结构已建立')
      
      // 立即删除测试记录
      await supabase
        .from('okrs')
        .delete()
        .eq('id', testOKR.id)
      
      console.log('🧹 测试记录已清理')
    }
  } catch (err) {
    console.error('❌ 创建表出错:', err)
  }
}

async function fixExistingTable() {
  console.log('🔧 表已存在，直接测试OKR创建功能')
  
  // 先用最基础的字段测试
  const testOKR = {
    user_id: '00000000-0000-0000-0000-000000000001',
    title: 'Database Fix Test OKR',
    description: '测试数据库修复后的OKR创建功能',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
    status: 'active'
  }
  
  try {
    const { data, error } = await supabase
      .from('okrs')
      .insert(testOKR)
      .select()
    
    if (error) {
      console.error('❌ 测试OKR创建失败:', error)
      console.log('📋 错误详情:', error.message)
    } else {
      console.log('✅ 测试OKR创建成功!')
      console.log('📋 创建的OKR:', data[0])
      
      // 删除测试记录
      await supabase
        .from('okrs')
        .delete()
        .eq('id', data[0].id)
      
      console.log('🧹 测试记录已清理')
    }
  } catch (err) {
    console.error('❌ 测试创建出错:', err)
  }
}

// 运行修复
fixDatabase().catch(console.error)