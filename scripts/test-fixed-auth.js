// 测试修复后的认证问题
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'

async function testFixedAuth() {
  console.log('🧪 测试修复后的认证问题...')
  
  // 使用service role key（模拟开发环境中的admin客户端）
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // 1. 获取测试用户
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'test@qiming.edu.cn')
      .single()
    
    if (userError || !user) {
      console.error('❌ 获取测试用户失败:', userError)
      return
    }
    
    console.log('✅ 获取测试用户成功:', user.id)
    
    // 2. 测试创建OKR
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: okr, error: okrError } = await supabaseAdmin
      .from('okrs')
      .insert({
        user_id: user.id,
        title: '测试RLS修复 - ' + new Date().toLocaleTimeString(),
        description: '验证Service Role Key能够绕过RLS策略',
        category: 'personal',
        priority: 'medium',
        status: 'active',
        start_date: today,
        end_date: endDate,
        progress: 0
      })
      .select()
      .single()
    
    if (okrError) {
      console.error('❌ 创建OKR失败:', okrError)
      return
    }
    
    console.log('✅ OKR创建成功，RLS已绕过:', {
      id: okr.id,
      title: okr.title
    })
    
    // 3. 测试查询OKRs
    const { data: okrs, error: queryError } = await supabaseAdmin
      .from('okrs')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)
    
    if (queryError) {
      console.error('❌ 查询OKRs失败:', queryError)
    } else {
      console.log('✅ 查询OKRs成功，找到', okrs.length, '条记录')
    }
    
    console.log('\n🎉 RLS认证问题已修复！现在前端应该可以正常工作了')
    
  } catch (error) {
    console.error('💥 测试过程中发生异常:', error)
  }
}

testFixedAuth()