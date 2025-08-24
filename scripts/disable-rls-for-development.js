// 为开发环境禁用RLS策略
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'

async function disableRLS() {
  console.log('🔓 为开发环境禁用RLS策略...')
  
  // 使用service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    // 禁用相关表的RLS策略
    const tables = ['users', 'okrs', 'key_results', 'chat_sessions', 'chat_messages']
    
    for (const table of tables) {
      try {
        // 这里实际上需要通过SQL来禁用RLS，但JS客户端无法直接执行DDL
        // 我们可以通过rpc调用来执行SQL
        console.log(`📋 表 ${table} 需要手动禁用RLS策略`)
      } catch (error) {
        console.error(`❌ 处理表 ${table} 时出错:`, error.message)
      }
    }
    
    console.log('\n⚠️  请在Supabase Dashboard中手动执行以下SQL：')
    console.log(`
    -- 为开发环境临时禁用RLS策略
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE okrs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE key_results DISABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_sessions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
    
    -- 如果需要重新启用，使用：
    -- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    -- ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
    -- ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
    -- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
    -- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    `)
    
    console.log('\n或者，作为替代方案，创建允许所有操作的RLS策略：')
    console.log(`
    -- 为开发环境创建宽松的RLS策略
    CREATE POLICY "Enable all operations for development" ON users FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all operations for development" ON okrs FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all operations for development" ON key_results FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all operations for development" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Enable all operations for development" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
    `)
    
    console.log('\n🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/sxhfiadommaopzoigtbz/sql')
    
  } catch (error) {
    console.error('💥 处理过程中发生异常:', error)
  }
}

disableRLS()