-- 修复 chat_sessions 表结构
-- 添加缺失的 ai_agent_type 列

-- 检查列是否存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' 
        AND column_name = 'ai_agent_type'
    ) THEN
        -- 添加 ai_agent_type 列
        ALTER TABLE chat_sessions 
        ADD COLUMN ai_agent_type VARCHAR(20) DEFAULT 'student' 
        CHECK (ai_agent_type IN ('student', 'teacher', 'college'));
        
        RAISE NOTICE 'Added ai_agent_type column to chat_sessions table';
    ELSE
        RAISE NOTICE 'ai_agent_type column already exists in chat_sessions table';
    END IF;
END
$$;

-- 更新现有记录的默认值（如果有的话）
UPDATE chat_sessions 
SET ai_agent_type = 'student' 
WHERE ai_agent_type IS NULL;