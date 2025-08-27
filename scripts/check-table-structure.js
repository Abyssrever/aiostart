const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('🔍 检查数据库表结构...');
    
    // 检查users表
    console.log('\n👤 检查users表结构:');
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userError) {
        console.error('users表错误:', userError);
      } else {
        console.log('✅ users表正常，示例数据:', userData?.[0] ? Object.keys(userData[0]) : '无数据');
      }
    } catch (err) {
      console.error('users表异常:', err.message);
    }
    
    // 检查okrs表
    console.log('\n🎯 检查okrs表结构:');
    try {
      const { data: okrData, error: okrError } = await supabase
        .from('okrs')
        .select('*')
        .limit(1);
      
      if (okrError) {
        console.error('okrs表错误:', okrError);
      } else {
        console.log('✅ okrs表正常，示例数据:', okrData?.[0] ? Object.keys(okrData[0]) : '无数据');
      }
    } catch (err) {
      console.error('okrs表异常:', err.message);
    }
    
    // 检查key_results表
    console.log('\n📊 检查key_results表结构:');
    try {
      const { data: krData, error: krError } = await supabase
        .from('key_results')
        .select('*')
        .limit(1);
      
      if (krError) {
        console.error('key_results表错误:', krError);
      } else {
        console.log('✅ key_results表正常，示例数据:', krData?.[0] ? Object.keys(krData[0]) : '无数据');
      }
    } catch (err) {
      console.error('key_results表异常:', err.message);
    }
    
    // 测试创建OKR
    console.log('\n🧪 测试创建OKR:');
    try {
      const testOKR = {
        user_id: '550e8400-e29b-41d4-a716-446655440001',
        title: '测试OKR目标',
        description: '这是一个测试OKR',
        status: 'active'
      };
      
      const { data: createData, error: createError } = await supabase
        .from('okrs')
        .insert(testOKR)
        .select()
        .single();
      
      if (createError) {
        console.error('创建OKR测试失败:', createError);
      } else {
        console.log('✅ 创建OKR测试成功:', createData);
        
        // 清理测试数据
        await supabase.from('okrs').delete().eq('id', createData.id);
        console.log('🧹 测试数据已清理');
      }
    } catch (err) {
      console.error('创建OKR测试异常:', err.message);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 执行检查
checkTableStructure();