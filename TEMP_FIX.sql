-- 临时修复方案：让user_id可为空
-- 这是最安全的方案，不会影响现有数据和功能

-- 步骤1：让user_id字段可为空
ALTER TABLE chat_messages 
ALTER COLUMN user_id DROP NOT NULL;

-- 步骤2：创建触发器自动填充user_id（可选，推荐）
CREATE OR REPLACE FUNCTION auto_fill_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果user_id为空，从session中获取
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM chat_sessions 
    WHERE id = NEW.session_id;
    
    -- 如果还是没找到，记录错误但不阻止插入
    IF NEW.user_id IS NULL THEN
      RAISE WARNING 'Could not find user_id for session_id: %', NEW.session_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS auto_fill_user_id_trigger ON chat_messages;
CREATE TRIGGER auto_fill_user_id_trigger
  BEFORE INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_fill_user_id();

-- 验证修改
SELECT column_name, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
AND column_name = 'user_id';