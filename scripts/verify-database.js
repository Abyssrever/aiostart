const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 预期的表结构
const expectedTables = [
  'users',
  'roles', 
  'user_roles',
  'okrs',
  'key_results',
  'learning_activities',
  'chat_sessions',
  'chat_messages',
  'courses',
  'enrollments'
];

// 测试数据库连接
async function testConnection() {
  try {
    console.log('🔗 测试数据库连接...');
    
    // 尝试执行一个简单的SQL查询
    const { data, error } = await supabase
      .rpc('exec_sql', { query: 'SELECT 1 as test' });
    
    if (error) {
      // 如果exec_sql不存在，尝试查询roles表（应该存在）
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .limit(1);
      
      if (roleError) {
        console.error('❌ 数据库连接失败:', roleError.message);
        return false;
      }
    }
    
    console.log('✅ 数据库连接成功');
    return true;
  } catch (err) {
    console.error('❌ 连接测试异常:', err.message);
    return false;
  }
}

// 验证表结构
async function verifyTables() {
  try {
    console.log('\n📋 验证表结构...');
    
    // 获取所有表
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (error) {
      console.error('❌ 获取表列表失败:', error.message);
      return false;
    }
    
    const existingTables = tables.map(t => t.table_name);
    console.log('📊 现有表:', existingTables.join(', '));
    
    // 检查预期表是否存在
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    const extraTables = existingTables.filter(table => !expectedTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  缺失的表:', missingTables.join(', '));
    }
    
    if (extraTables.length > 0) {
      console.log('ℹ️  额外的表:', extraTables.join(', '));
    }
    
    if (missingTables.length === 0) {
      console.log('✅ 所有预期表都存在');
      return true;
    } else {
      console.log(`❌ 缺失 ${missingTables.length} 个表`);
      return false;
    }
    
  } catch (err) {
    console.error('❌ 表结构验证异常:', err.message);
    return false;
  }
}

// 测试基本CRUD操作
async function testCRUDOperations() {
  try {
    console.log('\n🔧 测试基本CRUD操作...');
    
    // 测试插入角色
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert({ name: 'test_role', description: '测试角色' })
      .select()
      .single();
    
    if (roleError) {
      console.error('❌ 插入角色失败:', roleError.message);
      return false;
    }
    
    console.log('✅ 角色插入成功:', roleData.name);
    
    // 测试查询角色
    const { data: roles, error: queryError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'test_role');
    
    if (queryError) {
      console.error('❌ 查询角色失败:', queryError.message);
      return false;
    }
    
    console.log('✅ 角色查询成功，找到', roles.length, '条记录');
    
    // 清理测试数据
    const { error: deleteError } = await supabase
      .from('roles')
      .delete()
      .eq('name', 'test_role');
    
    if (deleteError) {
      console.error('⚠️  清理测试数据失败:', deleteError.message);
    } else {
      console.log('✅ 测试数据清理完成');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ CRUD操作测试异常:', err.message);
    return false;
  }
}

// 检查RLS策略
async function checkRLSPolicies() {
  try {
    console.log('\n🔒 检查行级安全策略(RLS)...');
    
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive')
      .in('tablename', expectedTables);
    
    if (error) {
      console.error('❌ 获取RLS策略失败:', error.message);
      return false;
    }
    
    if (policies && policies.length > 0) {
      console.log('✅ 找到', policies.length, '个RLS策略');
      policies.forEach(policy => {
        console.log(`  - ${policy.tablename}: ${policy.policyname}`);
      });
    } else {
      console.log('⚠️  未找到RLS策略');
    }
    
    return true;
    
  } catch (err) {
    console.error('❌ RLS策略检查异常:', err.message);
    return false;
  }
}

// 主验证函数
async function verifyDatabase() {
  console.log('🚀 启明星平台数据库验证开始\n');
  
  let allPassed = true;
  
  // 1. 测试连接
  const connectionOk = await testConnection();
  allPassed = allPassed && connectionOk;
  
  if (!connectionOk) {
    console.log('\n❌ 数据库连接失败，停止后续测试');
    return;
  }
  
  // 2. 验证表结构
  const tablesOk = await verifyTables();
  allPassed = allPassed && tablesOk;
  
  // 3. 测试CRUD操作
  const crudOk = await testCRUDOperations();
  allPassed = allPassed && crudOk;
  
  // 4. 检查RLS策略
  const rlsOk = await checkRLSPolicies();
  allPassed = allPassed && rlsOk;
  
  // 总结
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 数据库验证完成！所有测试通过');
    console.log('✅ 数据库已准备就绪，可以开始开发');
  } else {
    console.log('⚠️  数据库验证完成，但存在问题');
    console.log('💡 请检查上述错误信息并修复相关问题');
  }
  console.log('='.repeat(50));
}

// 运行验证
if (require.main === module) {
  verifyDatabase().catch(console.error);
}

module.exports = {
  verifyDatabase,
  testConnection,
  verifyTables,
  testCRUDOperations,
  checkRLSPolicies
};