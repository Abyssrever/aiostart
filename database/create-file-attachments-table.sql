-- ============================================
-- 创建文件附件表 (file_attachments)
-- ============================================

-- 创建文件附件表
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  storage_bucket VARCHAR(50) NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
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
  
  -- 约束
  CONSTRAINT check_storage_bucket CHECK (storage_bucket IN ('user-files', 'chat-files', 'okr-files', 'assignment-files')),
  CONSTRAINT unique_file_hash UNIQUE (file_hash, uploaded_by) -- 防止重复上传
);

-- ============================================
-- 创建索引
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
CREATE INDEX IF NOT EXISTS idx_file_attachments_storage_bucket ON file_attachments(storage_bucket);
CREATE INDEX IF NOT EXISTS idx_file_attachments_storage_path ON file_attachments(storage_path);

-- ============================================
-- 触发器
-- ============================================

-- 文件附件更新时间触发器
CREATE TRIGGER update_file_attachments_updated_at 
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用RLS
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- 文件附件访问策略
CREATE POLICY "Users can manage own files" ON file_attachments FOR ALL 
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can view shared files" ON file_attachments FOR SELECT 
USING (
  access_level = 'public' OR 
  uploaded_by = auth.uid() OR
  access_level = 'shared'
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

-- 教师可以查看学生的 OKR 文件
CREATE POLICY "Teachers can view student okr files" ON file_attachments FOR SELECT
USING (
  category = 'okr' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'teacher'
  )
);

-- ============================================
-- 辅助函数
-- ============================================

-- 获取存储桶的函数
CREATE OR REPLACE FUNCTION get_storage_bucket_for_category(file_category TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE file_category
    WHEN 'profile' THEN RETURN 'user-files';
    WHEN 'chat' THEN RETURN 'chat-files';
    WHEN 'okr' THEN RETURN 'okr-files';
    WHEN 'assignment' THEN RETURN 'assignment-files';
    ELSE RETURN 'user-files'; -- 默认桶
  END CASE;
END;
$$;

-- 获取用户存储使用量的函数
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE(
  total_files BIGINT,
  total_size BIGINT,
  bucket_usage JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_files,
    COALESCE(SUM(fa.file_size), 0)::BIGINT as total_size,
    JSONB_OBJECT_AGG(
      fa.storage_bucket, 
      JSONB_BUILD_OBJECT(
        'files', COUNT(*),
        'size', COALESCE(SUM(fa.file_size), 0)
      )
    ) as bucket_usage
  FROM file_attachments fa
  WHERE fa.uploaded_by = user_uuid 
  AND fa.status = 'active';
END;
$$;