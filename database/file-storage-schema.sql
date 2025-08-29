-- ============================================
-- 文件存储和管理模块
-- ============================================

-- 文件存储表
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_hash VARCHAR(64), -- SHA-256 hash for deduplication
  
  -- 关联信息
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'chat', 'okr', 'assignment', 'profile', 'document')),
  
  -- 关联到聊天或OKR
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  okr_id UUID REFERENCES okrs(id) ON DELETE CASCADE,
  key_result_id UUID REFERENCES key_results(id) ON DELETE CASCADE,
  
  -- 文件状态和权限
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  access_level VARCHAR(20) DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),
  
  -- 文件处理状态
  processing_status VARCHAR(20) DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT, -- 从文件中提取的文本内容
  
  -- 元数据
  metadata JSONB DEFAULT '{}', -- 额外的文件元数据
  tags JSONB DEFAULT '[]', -- 文件标签
  description TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- 文件过期时间（可选）
  
  -- 索引
  CONSTRAINT unique_file_hash UNIQUE (file_hash, uploaded_by) -- 防止重复上传
);

-- 文件分享表
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL表示公开分享
  share_token VARCHAR(64) UNIQUE, -- 分享链接token
  
  -- 分享权限
  permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'download', 'edit')),
  
  -- 分享设置
  requires_password BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  download_limit INTEGER, -- 下载次数限制
  download_count INTEGER DEFAULT 0,
  
  -- 时间限制
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ
);

-- 文件访问日志表
CREATE TABLE IF NOT EXISTS file_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('upload', 'view', 'download', 'delete', 'share')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文件处理队列表（用于异步处理大文件）
CREATE TABLE IF NOT EXISTS file_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
  task_type VARCHAR(30) NOT NULL CHECK (task_type IN ('text_extraction', 'thumbnail_generation', 'virus_scan', 'format_conversion')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  result JSONB,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

-- 文件附件索引
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_attachments_category ON file_attachments(category);
CREATE INDEX IF NOT EXISTS idx_file_attachments_chat_session ON file_attachments(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_okr ON file_attachments(okr_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_status ON file_attachments(status);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_file_attachments_mime_type ON file_attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_file_attachments_hash ON file_attachments(file_hash);

-- 文件分享索引
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by ON file_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at);

-- 文件访问日志索引
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_action ON file_access_logs(action);

-- 文件处理队列索引
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_file_id ON file_processing_queue(file_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_status ON file_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_scheduled_at ON file_processing_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_file_processing_queue_priority ON file_processing_queue(priority);

-- ============================================
-- 触发器函数
-- ============================================

-- 更新文件访问时间
CREATE OR REPLACE FUNCTION update_file_accessed_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE file_attachments 
    SET accessed_at = NOW()
    WHERE id = NEW.file_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新文件分享统计
CREATE OR REPLACE FUNCTION update_file_share_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.action = 'download' THEN
        UPDATE file_shares 
        SET download_count = download_count + 1,
            accessed_at = NOW()
        WHERE file_id = NEW.file_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 触发器
-- ============================================

-- 文件访问时间更新触发器
CREATE TRIGGER update_file_accessed_at_trigger
    AFTER INSERT ON file_access_logs
    FOR EACH ROW EXECUTE FUNCTION update_file_accessed_at();

-- 文件分享统计更新触发器
CREATE TRIGGER update_file_share_stats_trigger
    AFTER INSERT ON file_access_logs
    FOR EACH ROW EXECUTE FUNCTION update_file_share_stats();

-- 文件附件更新时间触发器
CREATE TRIGGER update_file_attachments_updated_at 
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_processing_queue ENABLE ROW LEVEL SECURITY;

-- 文件附件访问策略
CREATE POLICY "Users can manage own files" ON file_attachments FOR ALL 
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can view shared files" ON file_attachments FOR SELECT 
USING (
  access_level = 'public' OR 
  EXISTS (
    SELECT 1 FROM file_shares 
    WHERE file_shares.file_id = file_attachments.id 
    AND (file_shares.shared_with = auth.uid() OR file_shares.shared_with IS NULL)
    AND (file_shares.expires_at IS NULL OR file_shares.expires_at > NOW())
  )
);

-- 文件分享策略
CREATE POLICY "Users can manage own shares" ON file_shares FOR ALL
USING (shared_by = auth.uid());

CREATE POLICY "Users can view shares made to them" ON file_shares FOR SELECT
USING (shared_with = auth.uid() OR shared_with IS NULL);

-- 文件访问日志策略
CREATE POLICY "Users can view own file access logs" ON file_access_logs FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM file_attachments 
    WHERE file_attachments.id = file_access_logs.file_id 
    AND file_attachments.uploaded_by = auth.uid()
  )
);

-- 管理员可以访问所有文件相关数据
CREATE POLICY "Admins can access all file data" ON file_attachments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'admin'
  )
);

CREATE POLICY "Admins can access all file shares" ON file_shares FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'admin'
  )
);

CREATE POLICY "Admins can access all file logs" ON file_access_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'admin'
  )
);