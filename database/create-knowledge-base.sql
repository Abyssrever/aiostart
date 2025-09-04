-- 创建知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 创建知识库内容块表（用于向量搜索）
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 插入示例知识库数据
INSERT INTO knowledge_documents (title, content, document_type, status) VALUES
('JavaScript基础教程', 'JavaScript是一种动态的、弱类型的编程语言，主要用于网页开发。闭包是JavaScript中的一个重要概念，它允许函数访问其外部作用域中的变量。闭包在JavaScript中有很多实际应用，比如模块模式、回调函数等。学习JavaScript闭包对于深入理解JavaScript至关重要。', 'tutorial', 'active'),
('学习方法指南', '高效学习编程的方法包括：1.实践为主，理论为辅 - 通过编写代码来学习，而不仅仅是阅读理论。2.项目驱动学习 - 选择感兴趣的项目，在实现过程中学习新知识。3.定期复习和总结 - 建立知识体系，定期回顾学过的内容。4.寻找学习伙伴 - 与他人讨论，互相学习。5.保持好奇心 - 主动探索新技术和工具。', 'guide', 'active'),
('算法与数据结构', '动态规划是一种算法设计技术，用于解决具有重叠子问题和最优子结构性质的问题。动态规划的核心思想是将复杂问题分解为更小的子问题，并存储子问题的解以避免重复计算。常见的动态规划问题包括斐波那契数列、最长公共子序列、背包问题等。掌握动态规划对于算法学习非常重要。', 'tutorial', 'active'),
('编程学习路径', '编程学习建议的路径：1.选择一门编程语言作为入门（推荐Python或JavaScript）2.学习基本语法和概念3.练习基础算法和数据结构4.完成小项目巩固知识5.学习框架和工具6.参与开源项目7.持续学习新技术。记住，编程是一个需要持续练习的技能。', 'guide', 'active'),
('Web开发基础', 'Web开发包括前端和后端开发。前端主要涉及HTML、CSS、JavaScript，用于创建用户界面。后端涉及服务器端编程，处理数据库操作、API设计等。现代Web开发常用的技术栈包括React、Vue.js、Node.js、Express等。学习Web开发需要理解HTTP协议、前后端交互、数据库操作等概念。', 'tutorial', 'active');

-- 为每个文档创建内容块
INSERT INTO knowledge_chunks (document_id, title, content, chunk_index)
SELECT 
    id,
    title,
    content,
    0
FROM knowledge_documents;

-- 创建简化版的知识搜索函数（不使用向量搜索）
CREATE OR REPLACE FUNCTION search_knowledge(
    query_text TEXT,
    match_threshold FLOAT DEFAULT 0.6,
    match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    document_type TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kc.id,
        kc.title,
        kc.content,
        kd.document_type,
        -- 简单的文本匹配评分（替代向量搜索）
        CASE 
            WHEN kc.content ILIKE '%' || query_text || '%' THEN 0.9
            WHEN kc.title ILIKE '%' || query_text || '%' THEN 0.8
            WHEN kc.content ILIKE '%' || split_part(query_text, ' ', 1) || '%' THEN 0.7
            ELSE 0.5
        END as similarity
    FROM knowledge_chunks kc
    JOIN knowledge_documents kd ON kc.document_id = kd.id
    WHERE kd.status = 'active'
    AND (
        kc.content ILIKE '%' || query_text || '%'
        OR kc.title ILIKE '%' || query_text || '%'
        OR kc.content ILIKE '%' || split_part(query_text, ' ', 1) || '%'
    )
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- 创建索引以优化搜索性能
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content ON knowledge_chunks USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_title ON knowledge_chunks USING gin(to_tsvector('english', title));

-- 显示创建结果
SELECT 'Knowledge base tables and sample data created successfully!' as result;