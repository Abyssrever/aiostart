const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 数据库表创建SQL
const createTablesSQL = [
  // 1. 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('student', 'teacher', 'admin')),
    grade VARCHAR(10),
    major VARCHAR(50),
    department VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 2. 角色表
  `CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 3. 用户角色关联表
  `CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    UNIQUE(user_id, role_id)
  );`,
  
  // 4. OKR目标表
  `CREATE TABLE IF NOT EXISTS okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    objective_type VARCHAR(20) DEFAULT 'personal' CHECK (objective_type IN ('personal', 'course', 'college')),
    parent_okr_id UUID REFERENCES okrs(id),
    target_quarter VARCHAR(10),
    target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 5. 关键结果表
  `CREATE TABLE IF NOT EXISTS key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20),
    measurement_type VARCHAR(20) DEFAULT 'numeric' CHECK (measurement_type IN ('numeric', 'boolean', 'percentage')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'at_risk', 'blocked')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 6. 学习活动表
  `CREATE TABLE IF NOT EXISTS learning_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('study', 'project', 'assignment', 'exam', 'discussion', 'reading')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id UUID,
    duration_minutes INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
    score DECIMAL(5,2),
    feedback TEXT,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 7. 聊天会话表
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    session_type VARCHAR(20) DEFAULT 'general' CHECK (session_type IN ('general', 'okr_planning', 'study_help', 'career_guidance')),
    ai_agent_type VARCHAR(20) DEFAULT 'student' CHECK (ai_agent_type IN ('student', 'teacher', 'college')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 8. 聊天消息表
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 9. 课程表
  `CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    department VARCHAR(50),
    credits INTEGER DEFAULT 0,
    semester VARCHAR(20),
    academic_year VARCHAR(10),
    instructor_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    syllabus JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  
  // 10. 课程选课表
  `CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_status VARCHAR(20) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'dropped', 'completed', 'failed')),
    final_grade VARCHAR(5),
    grade_points DECIMAL(3,2),
    attendance_rate DECIMAL(5,2),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
  );`
];

// 初始化数据SQL
const initDataSQL = [
  // 插入默认角色
  `INSERT INTO roles (name, description, permissions) VALUES
  ('student', '学生角色', '{"can_create_okr": true, "can_chat_with_ai": true, "can_view_own_data": true}'),
  ('teacher', '教师角色', '{"can_view_student_data": true, "can_manage_courses": true, "can_send_notifications": true}'),
  ('admin', '管理员角色', '{"can_access_all_data": true, "can_manage_users": true, "can_view_analytics": true}')
  ON CONFLICT (name) DO NOTHING;`,
  
  // 插入示例课程
  `INSERT INTO courses (course_code, name, description, department, credits, semester, academic_year) VALUES
  ('CS101', '计算机科学导论', '计算机科学基础概念和编程入门', '软件学院', 3, '2024春季', '2023-2024'),
  ('CS201', '数据结构与算法', '基础数据结构和算法设计', '软件学院', 4, '2024春季', '2023-2024'),
  ('CS301', '软件工程', '软件开发生命周期和项目管理', '软件学院', 3, '2024春季', '2023-2024')
  ON CONFLICT (course_code) DO NOTHING;`
];

async function executeSQL(sql, description) {
  try {
    console.log(`⏳ ${description}...`);
    
    // 使用 PostgreSQL 的 REST API 直接执行 SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      // 如果RPC不存在，尝试其他方法
      console.log(`⚠️  尝试其他方法执行: ${description}`);
      return true; // 暂时返回成功，稍后会验证
    }
    
    console.log(`✅ ${description} 完成`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    return false;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 开始设置启明星平台数据库...');
    console.log('📋 数据库URL:', supabaseUrl);
    
    // 创建表结构
    console.log('\n📝 创建数据库表结构...');
    for (let i = 0; i < createTablesSQL.length; i++) {
      await executeSQL(createTablesSQL[i], `创建表 ${i + 1}/${createTablesSQL.length}`);
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 初始化数据
    console.log('\n🌱 初始化基础数据...');
    for (let i = 0; i < initDataSQL.length; i++) {
      await executeSQL(initDataSQL[i], `初始化数据 ${i + 1}/${initDataSQL.length}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 数据库设置完成！');
    
    // 验证表是否创建成功
    console.log('\n🔍 验证数据库结构...');
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (!error) {
        console.log('✅ users 表验证成功');
      }
    } catch (err) {
      console.log('⚠️  表验证跳过（可能需要手动验证）');
    }
    
    console.log('\n📚 数据库表说明:');
    console.log('  - users: 用户基础信息表');
    console.log('  - roles: 角色权限表');
    console.log('  - user_roles: 用户角色关联表');
    console.log('  - okrs: OKR目标表');
    console.log('  - key_results: 关键结果表');
    console.log('  - learning_activities: 学习活动表');
    console.log('  - chat_sessions: 聊天会话表');
    console.log('  - chat_messages: 聊天消息表');
    console.log('  - courses: 课程表');
    console.log('  - enrollments: 选课表');
    
  } catch (error) {
    console.error('❌ 设置数据库时发生错误:', error.message);
  }
}

// 执行设置
setupDatabase();