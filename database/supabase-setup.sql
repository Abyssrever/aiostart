-- 启明星平台数据库结构设置脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 网址: https://sxhfiadommaopzoigtbz.supabase.co/project/sxhfiadommaopzoigtbz/sql

-- ============================================
-- 1. 创建用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
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
);

-- 创建用户表索引
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- 2. 创建角色表
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 创建用户角色关联表
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- 创建用户角色关联表索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- ============================================
-- 4. 创建OKR目标表
-- ============================================
CREATE TABLE IF NOT EXISTS okrs (
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
);

-- 创建OKR表索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_target_year ON okrs(target_year);
CREATE INDEX IF NOT EXISTS idx_okrs_parent_okr_id ON okrs(parent_okr_id);

-- ============================================
-- 5. 创建关键结果表
-- ============================================
CREATE TABLE IF NOT EXISTS key_results (
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
);

-- 创建关键结果表索引
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_key_results_status ON key_results(status);

-- ============================================
-- 6. 创建学习活动表
-- ============================================
CREATE TABLE IF NOT EXISTS learning_activities (
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
);

-- 创建学习活动表索引
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_id ON learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_activity_type ON learning_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_activities_completion_status ON learning_activities(completion_status);
CREATE INDEX IF NOT EXISTS idx_learning_activities_course_id ON learning_activities(course_id);

-- ============================================
-- 7. 创建聊天会话表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
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
);

-- 创建聊天会话表索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_type ON chat_sessions(session_type);

-- ============================================
-- 8. 创建聊天消息表
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建聊天消息表索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_message_type ON chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- 9. 创建课程表
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
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
);

-- 创建课程表索引
CREATE INDEX IF NOT EXISTS idx_courses_course_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- ============================================
-- 10. 创建课程选课表
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
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
);

-- 创建选课表索引
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(enrollment_status);

-- ============================================
-- 11. 创建更新时间触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 12. 为所有表添加更新时间触发器
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON key_results FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_learning_activities_updated_at BEFORE UPDATE ON learning_activities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 13. 启用行级安全策略 (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 14. 创建RLS策略
-- ============================================

-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- OKR相关策略
CREATE POLICY "Users can view own OKRs" ON okrs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own OKRs" ON okrs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OKRs" ON okrs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own OKRs" ON okrs FOR DELETE USING (auth.uid() = user_id);

-- 关键结果策略
CREATE POLICY "Users can view own key results" ON key_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM okrs WHERE okrs.id = key_results.okr_id AND okrs.user_id = auth.uid())
);
CREATE POLICY "Users can manage own key results" ON key_results FOR ALL USING (
  EXISTS (SELECT 1 FROM okrs WHERE okrs.id = key_results.okr_id AND okrs.user_id = auth.uid())
);

-- 学习活动策略
CREATE POLICY "Users can view own learning activities" ON learning_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own learning activities" ON learning_activities FOR ALL USING (auth.uid() = user_id);

-- 聊天会话策略
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- 聊天消息策略
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can create own chat messages" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
);

-- 选课策略
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own enrollments" ON enrollments FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 15. 插入初始数据
-- ============================================

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
('student', '学生角色', '{"can_create_okr": true, "can_chat_with_ai": true, "can_view_own_data": true}'),
('teacher', '教师角色', '{"can_view_student_data": true, "can_manage_courses": true, "can_send_notifications": true}'),
('admin', '管理员角色', '{"can_access_all_data": true, "can_manage_users": true, "can_view_analytics": true}')
ON CONFLICT (name) DO NOTHING;

-- 插入示例课程
INSERT INTO courses (course_code, name, description, department, credits, semester, academic_year) VALUES
('CS101', '计算机科学导论', '计算机科学基础概念和编程入门', '软件学院', 3, '2024春季', '2023-2024'),
('CS201', '数据结构与算法', '基础数据结构和算法设计', '软件学院', 4, '2024春季', '2023-2024'),
('CS301', '软件工程', '软件开发生命周期和项目管理', '软件学院', 3, '2024春季', '2023-2024'),
('MATH101', '高等数学A', '微积分基础理论与应用', '数学学院', 4, '2024春季', '2023-2024'),
('ENG101', '大学英语', '英语听说读写综合训练', '外语学院', 2, '2024春季', '2023-2024')
ON CONFLICT (course_code) DO NOTHING;

-- ============================================
-- 设置完成提示
-- ============================================
SELECT '🎉 启明星平台数据库结构创建完成！' as message;
SELECT 'ℹ️  请确保在 Supabase Dashboard 中启用 Authentication 功能' as note;
SELECT '📋 数据库包含以下核心表：users, roles, okrs, key_results, learning_activities, chat_sessions, chat_messages, courses, enrollments' as tables_info;