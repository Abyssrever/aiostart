-- 创建验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- 创建自动清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务清理过期验证码（每小时执行一次）
-- 注意：这需要pg_cron扩展，如果没有可以手动定期清理
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

-- 添加RLS策略
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 允许服务角色完全访问
CREATE POLICY "Service role can manage verification codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');

-- 用户只能查看自己的验证码
CREATE POLICY "Users can view own verification codes" ON verification_codes
  FOR SELECT USING (email = auth.email());