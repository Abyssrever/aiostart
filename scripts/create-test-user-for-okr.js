// 创建测试用户用于OKR功能测试
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4'

async function createTestUser() {
  console.log('👤 创建测试用户...')
  
  // 使用service role key绕过RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    // 创建或更新测试用户
    const testUser = {
      name: '测试学生',
      email: 'test@qiming.edu.cn',
      student_id: 'QM20241001',
      grade: '1',
      major: '计算机科学与技术',
      class_name: '计算机2024-1班',
      role: 'student'
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'email' })
      .select()
      .single()
    
    if (userError) {
      console.error('❌ 创建用户失败:', userError)
      return null
    }
    
    console.log('✅ 测试用户创建成功:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
    
    // 创建一个示例OKR
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: okr, error: okrError } = await supabase
      .from('okrs')
      .insert({
        user_id: user.id,
        title: '提升编程技能',
        description: '通过实际项目和系统学习，全面提升编程能力',
        category: 'skill',
        priority: 'high',
        status: 'active',
        start_date: today,
        end_date: endDate,
        progress: 30
      })
      .select()
      .single()
    
    if (okrError) {
      console.error('❌ 创建示例OKR失败:', okrError)
    } else {
      console.log('✅ 示例OKR创建成功:', okr.title)
      
      // 创建关键结果
      const keyResults = [
        {
          okr_id: okr.id,
          title: '完成3个实际项目',
          description: '开发3个完整的Web应用项目',
          target_value: 3,
          current_value: 1,
          unit: '个',
          measurement_type: 'numeric',
          status: 'active',
          progress: 33
        },
        {
          okr_id: okr.id,
          title: '学习新技术栈',
          description: '掌握React、Next.js、TypeScript等现代前端技术',
          target_value: 100,
          current_value: 60,
          unit: '%',
          measurement_type: 'percentage',
          status: 'active',
          progress: 60
        }
      ]
      
      const { error: krError } = await supabase
        .from('key_results')
        .insert(keyResults)
      
      if (krError) {
        console.error('❌ 创建关键结果失败:', krError)
      } else {
        console.log('✅ 关键结果创建成功')
      }
    }
    
    console.log('\n🎉 测试数据创建完成！')
    console.log('📧 测试用户登录邮箱: test@qiming.edu.cn')
    console.log('🔗 可以在前端界面使用此邮箱登录测试OKR功能')
    
    return user.id
    
  } catch (error) {
    console.error('💥 创建过程中发生异常:', error)
    return null
  }
}

createTestUser()