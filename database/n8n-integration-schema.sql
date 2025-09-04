-- ============================================
-- N8N工作流集成所需的数据库表结构
-- 根据n8n工作流分析创建匹配的表结构
-- ============================================

-- 启用向量扩展（如果未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. 组织管理表
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  org_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 项目管理表
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  project_code VARCHAR(50) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'archived')),
  start_date DATE,
  end_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 文档和知识库表（支持向量搜索）
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_type VARCHAR(50) DEFAULT 'general',
  
  -- 关联信息
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 向量搜索支持
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimension
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  
  -- 状态管理
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 聊天历史记录表（兼容n8n工作流）
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户和会话信息
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- 消息内容
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  ai_content TEXT, -- AI回复内容
  
  -- 代理类型
  agent_type VARCHAR(50) DEFAULT 'general',
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 每日处理队列表
-- ============================================
CREATE TABLE IF NOT EXISTS daily_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 组织和项目信息
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 批次和任务信息
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_type VARCHAR(50) DEFAULT 'qa_generation',
  
  -- 状态管理
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  
  -- 处理结果
  result JSONB,
  error_message TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- 唯一约束：每天每个组织-项目-用户只能有一条记录
  CONSTRAINT unique_daily_processing UNIQUE (organization_id, project_id, user_id, batch_date)
);

-- ============================================
-- 6. 任务管理表
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 任务基本信息
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 关联信息
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- 任务属性
  task_type VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- 时间管理
  due_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 7. 用户项目关联表
-- ============================================
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(user_id, project_id)
);

-- ============================================
-- 8. 创建索引优化查询性能
-- ============================================

-- 组织表索引
CREATE INDEX IF NOT EXISTS idx_organizations_org_code ON organizations(org_code);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

-- 项目表索引
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(project_code);

-- 文档表索引
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- 向量相似度搜索索引
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 聊天历史索引
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_project_id ON chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_org_id ON chat_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_role ON chat_history(role);

-- 处理队列索引
CREATE INDEX IF NOT EXISTS idx_daily_queue_org_project_user ON daily_processing_queue(organization_id, project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_daily_queue_status ON daily_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_daily_queue_batch_date ON daily_processing_queue(batch_date);
CREATE INDEX IF NOT EXISTS idx_daily_queue_priority ON daily_processing_queue(priority);

-- 任务表索引
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- 用户项目关联索引
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_org_id ON user_projects(organization_id);

-- ============================================
-- 9. 创建触发器函数
-- ============================================

-- 更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 文档向量搜索函数
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    filter_org_id UUID DEFAULT NULL,
    filter_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    document_type VARCHAR,
    organization_id UUID,
    project_id UUID,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.content,
        d.document_type,
        d.organization_id,
        d.project_id,
        1 - (d.embedding <=> query_embedding) as similarity
    FROM documents d
    WHERE d.status = 'active'
    AND d.embedding IS NOT NULL
    AND (filter_org_id IS NULL OR d.organization_id = filter_org_id)
    AND (filter_project_id IS NULL OR d.project_id = filter_project_id)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================
-- 10. 创建触发器
-- ============================================

-- 更新时间触发器
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. 行级安全策略 (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己参与的组织
CREATE POLICY "Users can view own organizations" ON organizations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.organization_id = organizations.id 
    AND user_projects.user_id = auth.uid()
  )
);

-- 用户可以查看自己参与的项目
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.project_id = projects.id 
    AND user_projects.user_id = auth.uid()
  )
);

-- 用户可以查看相关的文档
CREATE POLICY "Users can view related documents" ON documents FOR SELECT USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM user_projects WHERE user_id = auth.uid()
  ) OR
  project_id IN (
    SELECT project_id FROM user_projects WHERE user_id = auth.uid()
  )
);

-- 用户可以管理自己的聊天历史
CREATE POLICY "Users can manage own chat history" ON chat_history FOR ALL USING (user_id = auth.uid());

-- 用户可以查看自己的任务
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (
  assignee_id = auth.uid() OR creator_id = auth.uid()
);

-- 管理员可以访问所有数据
CREATE POLICY "Admins can access all data" ON organizations FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_type = 'admin')
);

CREATE POLICY "Admins can access all projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_type = 'admin')
);

CREATE POLICY "Admins can access all documents" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_type = 'admin')
);

-- ============================================
-- 12. 插入初始数据
-- ============================================

-- 插入默认组织
INSERT INTO organizations (name, org_code, description) VALUES
('启明星教育平台', 'QMSTAR', '启明星智能教育管理平台')
ON CONFLICT (org_code) DO NOTHING;

-- 插入示例项目
INSERT INTO projects (organization_id, name, project_code, owner_id, description)
SELECT 
  o.id,
  '人工智能课程项目',
  'AI_COURSE_2024',
  u.id,
  'AI相关课程的教学和实践项目'
FROM organizations o, users u 
WHERE o.org_code = 'QMSTAR' 
AND u.role_type = 'admin'
LIMIT 1
ON CONFLICT (project_code) DO NOTHING;

-- ============================================
-- 设置完成提示
-- ============================================
SELECT '🎉 N8N集成所需的数据库表结构创建完成！' as message;
SELECT 'ℹ️ 已创建: organizations, projects, documents(含向量搜索), chat_history, daily_processing_queue, tasks 等表' as tables_info;
SELECT '🔧 已配置向量搜索、索引优化、触发器和RLS安全策略' as features_info;