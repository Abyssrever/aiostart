const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 更新表结构的SQL语句
const updateSQL = [
  // 删除现有的users表
  `DROP TABLE IF EXISTS users CASCADE;`,
  
  // 重新创建users表，结构更简化
  `CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    role_type VARCHAR(20) DEFAULT 'student' CHECK (role_type IN ('student', 'teacher', 'admin')),
    grade VARCHAR(10),
    major VARCHAR(50),
    department VARCHAR(50),
    class_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 重新插入角色数据
  `INSERT INTO roles (name, description, permissions) VALUES
  ('student', '学生角色', '{"can_create_okr": true, "can_chat_with_ai": true, "can_view_own_data": true}'),
  ('teacher', '教师角色', '{"can_view_student_data": true, "can_manage_courses": true, "can_send_notifications": true}'),
  ('admin', '管理员角色', '{"can_access_all_data": true, "can_manage_users": true, "can_view_analytics": true}')
  ON CONFLICT (name) DO NOTHING;`
];

async function updateUsersTable() {
  try {
    console.log('🚀 开始更新users表结构...');
    
    // 执行每个SQL语句
    for (let i = 0; i < updateSQL.length; i++) {
      console.log(`⏳ 执行SQL ${i + 1}/${updateSQL.length}...`);
      
      try {
        // 使用rpc函数执行SQL
        const { error } = await supabase.rpc('exec', { 
          sql: updateSQL[i] 
        });
        
        if (error) {
          console.log(`⚠️  SQL ${i + 1} 执行警告:`, error.message);
        } else {
          console.log(`✅ SQL ${i + 1} 执行成功`);
        }
      } catch (err) {
        console.log(`⚠️  SQL ${i + 1} 执行异常:`, err.message);
      }
      
      // 添加延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 users表结构更新完成！');
    
    // 测试插入一个用户
    console.log('\n🔍 测试用户创建...');
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      student_id: '2021001001',
      email: 'zhang.ming@student.edu.cn',
      name: '张明',
      role: 'student',
      grade: '2021',
      major: '软件工程'
    };
    
    const { data, error } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'id' });
    
    if (error) {
      console.error('❌ 测试用户创建失败:', error);
    } else {
      console.log('✅ 测试用户创建成功');
    }
    
  } catch (error) {
    console.error('❌ 更新表结构失败:', error);
  }
}

// 执行更新
updateUsersTable();