const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserCreation() {
  try {
    console.log('🚀 开始测试用户创建...');
    
    // 简单的测试用户数据
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      student_id: '2021001001',
      email: 'zhang.ming@student.edu.cn',
      name: '张明',
      role: 'student'
    };
    
    console.log('测试用户数据:', testUser);
    
    // 尝试插入用户
    const { data, error } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'id' });
    
    if (error) {
      console.error('❌ 插入用户失败:', error);
      return;
    }
    
    console.log('✅ 用户创建成功:', data);
    
    // 查询用户验证
    const { data: queryData, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'zhang.ming@student.edu.cn');
    
    if (queryError) {
      console.error('❌ 查询用户失败:', queryError);
      return;
    }
    
    console.log('✅ 用户查询成功:', queryData);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 执行测试
testUserCreation();