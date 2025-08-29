-- ============================================
-- Supabase Storage 配置和策略设置
-- ============================================

-- 创建存储桶 (Buckets)
-- 这需要在 Supabase Dashboard 中手动创建，或使用以下 SQL:

-- 1. 用户文件桶 (用于头像、个人文档等)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files', 
  'user-files', 
  false, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown']::text[]
) ON CONFLICT (id) DO NOTHING;

-- 2. 聊天文件桶 (用于聊天中的文件分享)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files', 
  'chat-files', 
  false, 
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/markdown', 'application/json'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- 3. OKR文件桶 (用于OKR相关文档)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'okr-files', 
  'okr-files', 
  false, 
  10485760, -- 10MB
  ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/markdown', 'application/json',
    'image/jpeg', 'image/png', 'image/gif'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- 4. 作业文件桶 (用于作业提交)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-files', 
  'assignment-files', 
  false, 
  52428800, -- 50MB (作业文件可以更大)
  ARRAY[
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/markdown', 'application/json',
    'image/jpeg', 'image/png', 'image/gif',
    'application/zip', 'application/x-zip-compressed'
  ]::text[]
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- RLS 策略 (Row Level Security Policies)
-- ============================================

-- 用户文件桶策略
CREATE POLICY "Users can upload their own files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 聊天文件桶策略
CREATE POLICY "Users can upload chat files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat files they uploaded or shared with them" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'chat-files' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM file_attachments fa 
      WHERE fa.storage_path = name 
      AND fa.access_level = 'shared'
    )
  )
);

CREATE POLICY "Users can delete their own chat files" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'chat-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- OKR文件桶策略
CREATE POLICY "Users can upload okr files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'okr-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view okr files they uploaded" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'okr-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view student okr files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'okr-files' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'teacher'
  )
);

CREATE POLICY "Users can delete their own okr files" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'okr-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 作业文件桶策略
CREATE POLICY "Students can upload assignment files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'assignment-files' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'student'
  )
);

CREATE POLICY "Students can view their own assignment files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'assignment-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view all assignment files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'assignment-files' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type IN ('teacher', 'admin')
  )
);

-- 管理员可以访问所有文件
CREATE POLICY "Admins can access all files" ON storage.objects 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role_type = 'admin'
  )
);

-- ============================================
-- 更新文件附件表以支持 Supabase Storage
-- ============================================

-- 修改文件附件表，添加 storage_path 字段
ALTER TABLE file_attachments 
ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(50),
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS public_url TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_attachments_storage_bucket 
ON file_attachments(storage_bucket);

CREATE INDEX IF NOT EXISTS idx_file_attachments_storage_path 
ON file_attachments(storage_path);

-- 添加约束
ALTER TABLE file_attachments 
ADD CONSTRAINT check_storage_bucket 
CHECK (storage_bucket IN ('user-files', 'chat-files', 'okr-files', 'assignment-files'));

-- ============================================
-- 创建获取存储桶的函数
-- ============================================

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

-- ============================================
-- 创建清理孤立文件的函数
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_storage_files()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  file_record RECORD;
BEGIN
  -- 查找数据库中已删除但存储中仍存在的文件
  FOR file_record IN 
    SELECT so.name, so.bucket_id 
    FROM storage.objects so
    LEFT JOIN file_attachments fa ON fa.storage_path = so.name
    WHERE fa.id IS NULL
  LOOP
    -- 删除存储中的文件
    DELETE FROM storage.objects 
    WHERE name = file_record.name AND bucket_id = file_record.bucket_id;
    
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

-- ============================================
-- 创建计算用户存储使用量的函数
-- ============================================

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