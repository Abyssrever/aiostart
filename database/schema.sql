-- 启明星平台数据库结构设计
-- 基于PRD文档需求设计的完整数据库架构

-- ============================================
-- 1. 用户管理模块
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) UNIQUE NOT NULL, -- 学号/工号
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  role_type VARCHAR(20) NOT NULL CHECK (role_type IN ('student', 'teacher', 'admin')),
  grade VARCHAR(10), -- 年级（学生用）
  major VARCHAR(50), -- 专业（学生用）
  department VARCHAR(50), -- 院系
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 角色权限表
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_id)
);

-- ============================================
-- 2. OKR管理模块
-- ============================================

-- OKR目标表
CREATE TABLE IF NOT EXISTS okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  objective_type VARCHAR(20) DEFAULT 'personal' CHECK (objective_type IN ('personal', 'course', 'college')),
  parent_okr_id UUID REFERENCES okrs(id), -- 支持OKR层级对齐
  target_quarter VARCHAR(10), -- 目标季度，如 '2024Q1'
  target_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 关键结果表
CREATE TABLE IF NOT EXISTS key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_value DECIMAL(10,2), -- 目标值
  current_value DECIMAL(10,2) DEFAULT 0, -- 当前值
  unit VARCHAR(20), -- 单位，如 '分', '个', '%'
  measurement_type VARCHAR(20) DEFAULT 'numeric' CHECK (measurement_type IN ('numeric', 'boolean', 'percentage')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'at_risk', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OKR进度记录表
CREATE TABLE IF NOT EXISTS okr_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id UUID REFERENCES okrs(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE,
  previous_value DECIMAL(10,2),
  new_value DECIMAL(10,2),
  progress_note TEXT,
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 学习活动和成长画像模块
-- ============================================

-- 学习活动表
CREATE TABLE IF NOT EXISTS learning_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL CHECK (activity_type IN ('study', 'project', 'assignment', 'exam', 'discussion', 'reading')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  course_id UUID, -- 关联课程
  duration_minutes INTEGER, -- 学习时长（分钟）
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  score DECIMAL(5,2), -- 得分
  feedback TEXT, -- 反馈
  tags JSONB DEFAULT '[]', -- 标签数组
  metadata JSONB DEFAULT '{}', -- 额外元数据
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 技能标签表
CREATE TABLE IF NOT EXISTS skill_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(30), -- 技能分类，如 'programming', 'soft_skills', 'domain_knowledge'
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- 标签颜色
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户技能关联表
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_tag_id UUID NOT NULL REFERENCES skill_tags(id) ON DELETE CASCADE,
  proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level >= 1 AND proficiency_level <= 5), -- 熟练度 1-5
  evidence_count INTEGER DEFAULT 0, -- 证据数量
  last_practiced_at TIMESTAMPTZ,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_tag_id)
);

-- 成长画像表
CREATE TABLE IF NOT EXISTS growth_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_period VARCHAR(20) NOT NULL, -- 统计周期，如 '2024Q1', '2024-01'
  total_study_hours DECIMAL(8,2) DEFAULT 0,
  completed_activities INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  skill_growth_count INTEGER DEFAULT 0, -- 新增技能数量
  okr_completion_rate DECIMAL(5,2), -- OKR完成率
  learning_streak_days INTEGER DEFAULT 0, -- 连续学习天数
  performance_trend VARCHAR(20) DEFAULT 'stable' CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  strengths JSONB DEFAULT '[]', -- 优势领域
  improvement_areas JSONB DEFAULT '[]', -- 待改进领域
  achievements JSONB DEFAULT '[]', -- 成就记录
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, profile_period)
);

-- ============================================
-- 4. AI推荐和聊天记录模块
-- ============================================

-- AI推荐表
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(30) NOT NULL CHECK (recommendation_type IN ('task', 'resource', 'skill', 'okr', 'intervention')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content JSONB, -- 推荐内容详情
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- AI推荐置信度
  reasoning TEXT, -- AI推荐理由
  expires_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ, -- 用户操作时间
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 聊天会话表
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

-- 聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- 消息元数据，如引用、附件等
  tokens_used INTEGER, -- 消息使用的token数量
  response_time_ms INTEGER, -- AI响应时间（毫秒）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 课程和班级管理模块
-- ============================================

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code VARCHAR(20) UNIQUE NOT NULL, -- 课程代码
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department VARCHAR(50),
  credits INTEGER DEFAULT 0,
  semester VARCHAR(20), -- 学期，如 '2024春季'
  academic_year VARCHAR(10), -- 学年，如 '2023-2024'
  instructor_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  syllabus JSONB, -- 课程大纲
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(10), -- 年级
  major VARCHAR(50), -- 专业
  department VARCHAR(50), -- 院系
  class_advisor_id UUID REFERENCES users(id), -- 班主任
  academic_year VARCHAR(10), -- 入学年份
  total_students INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'disbanded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程选课表
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_status VARCHAR(20) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'dropped', 'completed', 'failed')),
  final_grade VARCHAR(5), -- 最终成绩
  grade_points DECIMAL(3,2), -- 绩点
  attendance_rate DECIMAL(5,2), -- 出勤率
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- 班级成员表
CREATE TABLE IF NOT EXISTS class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'monitor', 'deputy_monitor')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(user_id, class_id)
);

-- ============================================
-- 6. 知识库和向量搜索模块
-- ============================================

-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  document_type VARCHAR(30) CHECK (document_type IN ('course_material', 'faq', 'tutorial', 'reference', 'policy')),
  course_id UUID REFERENCES courses(id),
  author_id UUID REFERENCES users(id),
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 知识库向量块表
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL, -- 在文档中的块索引
  embedding VECTOR(1536), -- OpenAI embedding维度
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. 系统通知和预警模块
-- ============================================

-- 系统通知表
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('okr_reminder', 'deadline_warning', 'achievement', 'system_update', 'ai_recommendation')),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  action_url TEXT, -- 相关操作链接
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系统预警表
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('academic_risk', 'resource_shortage', 'performance_decline', 'system_issue')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_users JSONB DEFAULT '[]', -- 受影响的用户ID数组
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')),
  resolution_note TEXT,
  created_by UUID REFERENCES users(id),
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. 创建索引
-- ============================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- OKR相关索引
CREATE INDEX IF NOT EXISTS idx_okrs_user_id ON okrs(user_id);
CREATE INDEX IF NOT EXISTS idx_okrs_status ON okrs(status);
CREATE INDEX IF NOT EXISTS idx_okrs_target_year ON okrs(target_year);
CREATE INDEX IF NOT EXISTS idx_key_results_okr_id ON key_results(okr_id);
CREATE INDEX IF NOT EXISTS idx_okr_progress_okr_id ON okr_progress(okr_id);

-- 学习活动索引
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_id ON learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_type ON learning_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_learning_activities_course ON learning_activities(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_created_at ON learning_activities(created_at);

-- 聊天相关索引
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 课程相关索引
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- 知识库索引
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_course_id ON knowledge_documents(course_id);

-- 向量相似度搜索索引
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 通知索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- 9. 创建触发器函数
-- ============================================

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 聊天会话消息计数触发器函数
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_sessions 
        SET message_count = message_count + 1,
            last_message_at = NEW.created_at
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_sessions 
        SET message_count = message_count - 1
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 课程学生数量统计触发器函数
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.enrollment_status = 'enrolled' THEN
        UPDATE courses 
        SET current_students = current_students + 1
        WHERE id = NEW.course_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.enrollment_status = 'enrolled' AND NEW.enrollment_status != 'enrolled' THEN
            UPDATE courses 
            SET current_students = current_students - 1
            WHERE id = NEW.course_id;
        ELSIF OLD.enrollment_status != 'enrolled' AND NEW.enrollment_status = 'enrolled' THEN
            UPDATE courses 
            SET current_students = current_students + 1
            WHERE id = NEW.course_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' AND OLD.enrollment_status = 'enrolled' THEN
        UPDATE courses 
        SET current_students = current_students - 1
        WHERE id = OLD.course_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- ============================================
-- 10. 创建触发器
-- ============================================

-- 更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_okrs_updated_at BEFORE UPDATE ON okrs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_activities_updated_at BEFORE UPDATE ON learning_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_profiles_updated_at BEFORE UPDATE ON growth_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_documents_updated_at BEFORE UPDATE ON knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 聊天会话统计触发器
CREATE TRIGGER update_chat_session_stats_trigger
    AFTER INSERT OR DELETE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_stats();

-- 课程学生数量统计触发器
CREATE TRIGGER update_course_student_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_course_student_count();

-- ============================================
-- 11. 行级安全策略 (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- OKR访问策略
CREATE POLICY "Users can manage own OKRs" ON okrs FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Teachers can view student OKRs" ON okrs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'teacher'
  )
);

-- 关键结果访问策略
CREATE POLICY "Users can manage own key results" ON key_results FOR ALL USING (
  EXISTS (
    SELECT 1 FROM okrs 
    WHERE okrs.id = key_results.okr_id 
    AND okrs.user_id = auth.uid()
  )
);

-- 学习活动访问策略
CREATE POLICY "Users can manage own learning activities" ON learning_activities FOR ALL USING (user_id = auth.uid());

-- 聊天会话访问策略
CREATE POLICY "Users can manage own chat sessions" ON chat_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own chat messages" ON chat_messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

-- 通知访问策略
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- 管理员可以访问所有数据
CREATE POLICY "Admins can access all data" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'admin'
  )
);

-- ============================================
-- 12. 初始化数据
-- ============================================

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
('student', '学生角色', '{"can_create_okr": true, "can_chat_with_ai": true, "can_view_own_data": true}'),
('teacher', '教师角色', '{"can_view_student_data": true, "can_manage_courses": true, "can_send_notifications": true}'),
('admin', '管理员角色', '{"can_access_all_data": true, "can_manage_users": true, "can_view_analytics": true}')
ON CONFLICT (name) DO NOTHING;

-- 插入默认技能标签
INSERT INTO skill_tags (name, category, description, color) VALUES
('JavaScript', 'programming', '前端开发核心语言', '#F7DF1E'),
('Python', 'programming', '数据科学和后端开发', '#3776AB'),
('React', 'programming', '前端框架', '#61DAFB'),
('数据结构', 'computer_science', '计算机科学基础', '#FF6B6B'),
('算法设计', 'computer_science', '问题解决能力', '#4ECDC4'),
('团队协作', 'soft_skills', '软技能', '#45B7D1'),
('项目管理', 'soft_skills', '管理能力', '#96CEB4'),
('数据库设计', 'programming', '后端开发技能', '#FFEAA7')
ON CONFLICT (name) DO NOTHING;

-- 插入示例课程
INSERT INTO courses (course_code, name, description, department, credits, semester, academic_year) VALUES
('CS101', '计算机科学导论', '计算机科学基础概念和编程入门', '软件学院', 3, '2024春季', '2023-2024'),
('CS201', '数据结构与算法', '基础数据结构和算法设计', '软件学院', 4, '2024春季', '2023-2024'),
('CS301', '软件工程', '软件开发生命周期和项目管理', '软件学院', 3, '2024春季', '2023-2024')
ON CONFLICT (course_code) DO NOTHING;

COMMIT;