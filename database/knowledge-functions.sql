-- ============================================
-- 知识库和向量搜索相关函数
-- 为AI功能提供知识检索和语义搜索支持
-- ============================================

-- ============================================
-- 1. 向量相似度搜索函数（增强版）
-- ============================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 5,
  filter_org_id UUID DEFAULT NULL,
  filter_project_id UUID DEFAULT NULL,
  filter_user_id UUID DEFAULT NULL,
  filter_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  document_type VARCHAR,
  organization_id UUID,
  project_id UUID,
  user_id UUID,
  similarity FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
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
    d.user_id,
    1 - (d.embedding <=> query_embedding) as similarity,
    d.metadata,
    d.created_at
  FROM documents d
  WHERE d.status = 'active'
    AND d.embedding IS NOT NULL
    AND (filter_org_id IS NULL OR d.organization_id = filter_org_id)
    AND (filter_project_id IS NULL OR d.project_id = filter_project_id)
    AND (filter_user_id IS NULL OR d.user_id = filter_user_id)
    AND (filter_type IS NULL OR d.document_type = filter_type)
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- 2. 混合搜索函数（向量+关键词）
-- ============================================
CREATE OR REPLACE FUNCTION hybrid_search_documents(
  query_text TEXT,
  query_embedding VECTOR(1536) DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.6,
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
  combined_score FLOAT,
  similarity FLOAT,
  text_rank FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      d.id,
      d.title,
      d.content,
      d.document_type,
      d.organization_id,
      d.project_id,
      CASE 
        WHEN query_embedding IS NOT NULL THEN 1 - (d.embedding <=> query_embedding)
        ELSE 0
      END as similarity
    FROM documents d
    WHERE d.status = 'active'
      AND (filter_org_id IS NULL OR d.organization_id = filter_org_id)
      AND (filter_project_id IS NULL OR d.project_id = filter_project_id)
      AND (query_embedding IS NULL OR d.embedding IS NOT NULL)
  ),
  text_search AS (
    SELECT 
      d.id,
      ts_rank(to_tsvector('english', d.title || ' ' || d.content), to_tsquery('english', query_text)) as text_rank
    FROM documents d
    WHERE d.status = 'active'
      AND (filter_org_id IS NULL OR d.organization_id = filter_org_id)
      AND (filter_project_id IS NULL OR d.project_id = filter_project_id)
      AND (d.title ILIKE '%' || query_text || '%' OR d.content ILIKE '%' || query_text || '%')
  )
  SELECT 
    vs.id,
    vs.title,
    vs.content,
    vs.document_type,
    vs.organization_id,
    vs.project_id,
    -- 组合评分：70%向量相似度 + 30%文本相关性
    (COALESCE(vs.similarity, 0) * 0.7 + COALESCE(ts.text_rank, 0) * 0.3) as combined_score,
    vs.similarity,
    COALESCE(ts.text_rank, 0) as text_rank
  FROM vector_search vs
  LEFT JOIN text_search ts ON vs.id = ts.id
  WHERE (vs.similarity > match_threshold OR ts.text_rank > 0)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- ============================================
-- 3. 智慧库内容汇总函数
-- ============================================
CREATE OR REPLACE FUNCTION get_knowledge_summary(
  org_id UUID DEFAULT NULL,
  project_id UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 7,
  content_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_documents INTEGER,
  recent_documents INTEGER,
  document_types JSONB,
  top_contributors JSONB,
  content_sample TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- 获取统计数据
  SELECT 
    COUNT(*) as total_docs,
    COUNT(CASE WHEN d.created_at >= NOW() - INTERVAL '%s days' THEN 1 END) as recent_docs,
    jsonb_object_agg(d.document_type, type_counts.cnt) as doc_types,
    jsonb_agg(DISTINCT jsonb_build_object('user_id', d.user_id, 'count', user_counts.cnt)) as contributors,
    string_agg(DISTINCT substring(d.content, 1, 200), E'\n---\n') as sample_content
  INTO result_record
  FROM documents d
  LEFT JOIN (
    SELECT document_type, COUNT(*) as cnt 
    FROM documents 
    WHERE status = 'active'
      AND (org_id IS NULL OR organization_id = org_id)
      AND (project_id IS NULL OR project_id = project_id)
    GROUP BY document_type
  ) type_counts ON d.document_type = type_counts.document_type
  LEFT JOIN (
    SELECT user_id, COUNT(*) as cnt 
    FROM documents 
    WHERE status = 'active'
      AND (org_id IS NULL OR organization_id = org_id)
      AND (project_id IS NULL OR project_id = project_id)
    GROUP BY user_id
  ) user_counts ON d.user_id = user_counts.user_id
  WHERE d.status = 'active'
    AND (org_id IS NULL OR d.organization_id = org_id)
    AND (project_id IS NULL OR d.project_id = project_id)
    AND (content_type IS NULL OR d.document_type = content_type);

  -- 返回结果
  RETURN QUERY
  SELECT 
    result_record.total_docs::INTEGER,
    result_record.recent_docs::INTEGER,
    result_record.doc_types,
    result_record.contributors,
    result_record.sample_content;
END;
$$;

-- ============================================
-- 4. 聊天历史智能提取函数
-- ============================================
CREATE OR REPLACE FUNCTION extract_valuable_conversations(
  user_id_param UUID,
  project_id_param UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 1,
  min_length INTEGER DEFAULT 50
)
RETURNS TABLE (
  conversation_id UUID,
  user_id UUID,
  project_id UUID,
  user_content TEXT,
  ai_response TEXT,
  conversation_value FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_pairs AS (
    SELECT 
      ch.id as conversation_id,
      ch.user_id,
      ch.project_id,
      ch.content as user_content,
      ch.ai_content,
      ch.created_at,
      -- 评估对话价值的简单算法
      CASE 
        WHEN ch.ai_content IS NOT NULL AND length(ch.ai_content) > min_length THEN
          CASE 
            WHEN ch.content ILIKE '%问题%' OR ch.content ILIKE '%怎么%' OR ch.content ILIKE '%如何%' THEN 0.9
            WHEN ch.content ILIKE '%解决%' OR ch.content ILIKE '%方法%' OR ch.content ILIKE '%步骤%' THEN 0.8
            WHEN length(ch.ai_content) > 200 THEN 0.7
            ELSE 0.5
          END
        ELSE 0.3
      END as conversation_value
    FROM chat_history ch
    WHERE ch.user_id = user_id_param
      AND (project_id_param IS NULL OR ch.project_id = project_id_param)
      AND ch.created_at >= NOW() - INTERVAL '%s days'
      AND ch.role = 'user'
      AND ch.ai_content IS NOT NULL
      AND length(ch.content) >= min_length
  )
  SELECT 
    cp.conversation_id,
    cp.user_id,
    cp.project_id,
    cp.user_content,
    cp.ai_content as ai_response,
    cp.conversation_value,
    cp.created_at
  FROM conversation_pairs cp
  WHERE cp.conversation_value > 0.5
  ORDER BY cp.conversation_value DESC, cp.created_at DESC;
END;
$$;

-- ============================================
-- 5. 自动Q&A生成函数
-- ============================================
CREATE OR REPLACE FUNCTION generate_qa_from_conversations(
  org_id_param UUID,
  project_id_param UUID,
  user_id_param UUID,
  batch_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  qa_id UUID,
  question TEXT,
  answer TEXT,
  source_conversation_id UUID,
  confidence_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH valuable_conversations AS (
    SELECT * FROM extract_valuable_conversations(user_id_param, project_id_param, 1, 30)
  ),
  qa_pairs AS (
    SELECT 
      gen_random_uuid() as qa_id,
      vc.user_content as question,
      vc.ai_response as answer,
      vc.conversation_id as source_conversation_id,
      vc.conversation_value as confidence_score
    FROM valuable_conversations vc
    WHERE vc.conversation_value > 0.6
      AND length(vc.ai_response) > 100
  )
  SELECT 
    qp.qa_id,
    qp.question,
    qp.answer,
    qp.source_conversation_id,
    qp.confidence_score
  FROM qa_pairs qp
  ORDER BY qp.confidence_score DESC
  LIMIT 10;
END;
$$;

-- ============================================
-- 6. 知识库内容插入函数（带向量化）
-- ============================================
CREATE OR REPLACE FUNCTION insert_knowledge_document(
  title_param TEXT,
  content_param TEXT,
  document_type_param VARCHAR DEFAULT 'auto_qa',
  org_id_param UUID DEFAULT NULL,
  project_id_param UUID DEFAULT NULL,
  user_id_param UUID DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}',
  embedding_param VECTOR(1536) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_doc_id UUID;
BEGIN
  INSERT INTO documents (
    title,
    content,
    document_type,
    organization_id,
    project_id,
    user_id,
    metadata,
    embedding,
    created_at,
    updated_at
  ) VALUES (
    title_param,
    content_param,
    document_type_param,
    org_id_param,
    project_id_param,
    user_id_param,
    metadata_param,
    embedding_param,
    NOW(),
    NOW()
  ) RETURNING id INTO new_doc_id;
  
  RETURN new_doc_id;
END;
$$;

-- ============================================
-- 7. 任务队列管理函数
-- ============================================
CREATE OR REPLACE FUNCTION get_next_processing_task()
RETURNS TABLE (
  task_id UUID,
  organization_id UUID,
  project_id UUID,
  user_id UUID,
  batch_date DATE,
  task_type VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 原子性地获取并锁定下一个待处理任务
  RETURN QUERY
  UPDATE daily_processing_queue
  SET status = 'processing',
      started_at = NOW()
  WHERE id = (
    SELECT id FROM daily_processing_queue
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, organization_id, project_id, user_id, batch_date, task_type;
END;
$$;

-- ============================================
-- 8. 完成处理任务函数
-- ============================================
CREATE OR REPLACE FUNCTION complete_processing_task(
  task_id_param UUID,
  success BOOLEAN DEFAULT TRUE,
  result_data JSONB DEFAULT '{}',
  error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE daily_processing_queue
  SET 
    status = CASE WHEN success THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    result = result_data,
    error_message = error_msg
  WHERE id = task_id_param;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- 9. 创建知识库统计视图
-- ============================================
CREATE OR REPLACE VIEW knowledge_stats AS
SELECT 
  o.name as organization_name,
  p.name as project_name,
  COUNT(d.id) as total_documents,
  COUNT(CASE WHEN d.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_documents,
  COUNT(CASE WHEN d.document_type = 'auto_qa' THEN 1 END) as qa_documents,
  COUNT(CASE WHEN d.document_type = 'manual' THEN 1 END) as manual_documents,
  AVG(LENGTH(d.content)) as avg_content_length,
  MAX(d.created_at) as last_update
FROM organizations o
LEFT JOIN projects p ON o.id = p.organization_id
LEFT JOIN documents d ON p.id = d.project_id
WHERE d.status = 'active' OR d.id IS NULL
GROUP BY o.id, o.name, p.id, p.name
ORDER BY total_documents DESC;

-- ============================================
-- 10. 权限检查函数
-- ============================================
CREATE OR REPLACE FUNCTION check_document_access(
  user_id_param UUID,
  document_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN := FALSE;
BEGIN
  -- 检查用户是否可以访问指定文档
  SELECT EXISTS(
    SELECT 1 FROM documents d
    LEFT JOIN user_projects up ON (d.project_id = up.project_id OR d.organization_id = up.organization_id)
    WHERE d.id = document_id_param
    AND d.status = 'active'
    AND (
      d.user_id = user_id_param OR  -- 文档创建者
      up.user_id = user_id_param OR  -- 项目/组织成员
      EXISTS(SELECT 1 FROM users WHERE id = user_id_param AND role_type = 'admin') -- 管理员
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- ============================================
-- 设置完成提示
-- ============================================
SELECT '✅ 知识库和向量搜索函数创建完成！' as message;
SELECT '🔍 已创建: match_documents, hybrid_search, knowledge_summary 等10个核心函数' as functions_info;
SELECT '📊 已创建: knowledge_stats 统计视图' as views_info;