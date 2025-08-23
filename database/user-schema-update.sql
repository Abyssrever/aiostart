-- 添加 has_set_password 字段到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_set_password BOOLEAN DEFAULT FALSE;

-- 更新现有用户的 has_set_password 字段
-- 如果用户已经通过 auth.users 表设置了密码，则将其标记为 true
UPDATE users
SET has_set_password = TRUE
FROM auth.users
WHERE users.id = auth.users.id AND auth.users.encrypted_password IS NOT NULL;