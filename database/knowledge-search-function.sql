-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION search_knowledge(
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  document_title TEXT,
  document_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_embedding VECTOR(1536);
BEGIN
  -- 这里需要调用嵌入API获取查询文本的向量
  -- 暂时返回空结果，实际应用需要集成嵌入模型
  
  -- 向量相似度搜索
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    kd.title as document_title,
    kd.document_type,
    -- 暂时使用随机相似度，实际应该是 1 - (kc.embedding <=> query_embedding)
    0.8::FLOAT as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE kd.status = 'active'
  ORDER BY random() -- 实际应该按相似度排序: kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 创建示例知识库文档
INSERT INTO knowledge_documents (title, content, document_type, status) VALUES
('数据结构基础', '数据结构是计算机存储、组织数据的方式。常见的数据结构包括数组、链表、栈、队列、树、图等。', 'course_material', 'active'),
('算法设计原理', '算法是解决问题的步骤和方法。好的算法应该具有正确性、有效性、可读性等特点。', 'course_material', 'active'),
('B+树详解', 'B+树是一种多路平衡查找树，广泛应用于数据库索引。B+树的所有数据都存储在叶子节点中，内部节点只存储索引信息。', 'course_material', 'active')
ON CONFLICT DO NOTHING;

-- 创建示例知识库块（实际应用中需要通过嵌入API生成向量）
INSERT INTO knowledge_chunks (document_id, content, chunk_index, token_count) 
SELECT 
  kd.id,
  kd.content,
  1,
  length(kd.content) / 4 -- 粗略估算token数量
FROM knowledge_documents kd
WHERE NOT EXISTS (
  SELECT 1 FROM knowledge_chunks kc WHERE kc.document_id = kd.id
);

-- 授予知识库查询权限
GRANT EXECUTE ON FUNCTION search_knowledge TO authenticated;
GRANT SELECT ON knowledge_documents TO authenticated;
GRANT SELECT ON knowledge_chunks TO authenticated;