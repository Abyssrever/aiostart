const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请确保在 .env.local 中设置了 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 创建服务端客户端（绕过RLS）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixChatSessionsTable() {
  try {
    console.log('开始修复 chat_sessions 表结构...')
    
    // 首先检查表是否存在以及当前结构
    console.log('检查当前表结构...')
    
    // 直接尝试查询表来检查列是否存在
    const { data: existingData, error: queryError } = await supabase
      .from('chat_sessions')
      .select('*')
      .limit(1)
    
    let hasAiAgentType = false
    
    if (queryError) {
      console.log('查询 chat_sessions 表时出错:', queryError.message)
      
      if (queryError.message.includes("ai_agent_type")) {
        console.log('❌ 确认 ai_agent_type 列不存在')
        hasAiAgentType = false
      } else {
        console.error('其他查询错误，可能表不存在')
        return
      }
    } else {
      // 检查返回的数据结构
      if (existingData && existingData.length > 0) {
        hasAiAgentType = 'ai_agent_type' in existingData[0]
        console.log('从现有数据检查 ai_agent_type 列:', hasAiAgentType ? '存在' : '不存在')
      } else {
        // 表为空，尝试通过描述查询来检查
        const { error: descError } = await supabase
          .from('chat_sessions')
          .select('ai_agent_type')
          .limit(1)
          
        if (descError && descError.message.includes("ai_agent_type")) {
          hasAiAgentType = false
          console.log('❌ 通过列选择确认 ai_agent_type 列不存在')
        } else {
          hasAiAgentType = true
          console.log('✅ ai_agent_type 列存在')
        }
      }
    }
    
    if (hasAiAgentType) {
      console.log('✅ ai_agent_type 列已存在')
      return
    }
    
    console.log('❌ ai_agent_type 列不存在，需要添加')
    
    // 由于我们无法直接执行 ALTER TABLE，让我们尝试不同的方法
    // 先创建一个测试会话，看看会发生什么
    console.log('尝试创建测试聊天会话...')
    
    const { data: sessionData, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000001', // 临时测试ID
        title: 'Test Session',
        session_type: 'general'
      })
      .select()
      
    if (sessionError) {
      console.error('创建测试会话失败:', sessionError.message)
      
      if (sessionError.message.includes('ai_agent_type')) {
        console.log('确认缺少 ai_agent_type 列')
        console.log('请手动在 Supabase 控制台中执行以下 SQL:')
        console.log(`
ALTER TABLE public.chat_sessions 
ADD COLUMN ai_agent_type VARCHAR(20) DEFAULT 'student' 
CHECK (ai_agent_type IN ('student', 'teacher', 'college'));
        `)
        return
      }
    } else {
      console.log('✅ 测试会话创建成功，ai_agent_type 可能已存在或有默认值')
      
      // 删除测试数据
      if (sessionData && sessionData[0]) {
        await supabase
          .from('chat_sessions')
          .delete()
          .eq('id', sessionData[0].id)
        console.log('测试数据已清理')
      }
    }
    
  } catch (error) {
    console.error('修复过程出现异常:', error.message)
  }
}

// 运行修复
fixChatSessionsTable()
  .then(() => {
    console.log('修复脚本执行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('修复脚本执行失败:', error)
    process.exit(1)
  })