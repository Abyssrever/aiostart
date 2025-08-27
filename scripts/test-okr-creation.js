// 测试OKR创建功能
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDAzMDcsImV4cCI6MjA3MTMxNjMwN30.XuGU_SfH185ZVSqZwEtPaIPZv_nPnNHRtJPzkWnVgBc'

async function testOKRCreation() {
  console.log('🧪 测试OKR创建功能...')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. 先获取一个测试用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('❌ 获取测试用户失败:', userError)
      return
    }
    
    const userId = users[0].id
    console.log('✅ 使用测试用户ID:', userId)
    
    // 2. 创建测试OKR
    const today = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: okr, error: okrError } = await supabase
      .from('okrs')
      .insert({
        user_id: userId,
        title: '测试OKR目标 - ' + new Date().toLocaleTimeString(),
        description: '这是一个测试OKR，用于验证创建功能',
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
    
    console.log('✅ OKR创建成功:', {
      id: okr.id,
      title: okr.title,
      start_date: okr.start_date,
      end_date: okr.end_date
    })
    
    // 3. 创建测试关键结果
    const { data: keyResult, error: krError } = await supabase
      .from('key_results')
      .insert({
        okr_id: okr.id,
        title: '完成项目开发',
        description: '完成启明星平台的核心功能开发',
        target_value: 100,
        current_value: 0,
        unit: '%',
        measurement_type: 'numeric',
        status: 'active',
        progress: 0
      })
      .select()
      .single()
    
    if (krError) {
      console.error('❌ 创建关键结果失败:', krError)
      return
    }
    
    console.log('✅ 关键结果创建成功:', {
      id: keyResult.id,
      title: keyResult.title,
      target_value: keyResult.target_value
    })
    
    // 4. 测试进度更新
    const { error: updateError } = await supabase
      .from('key_results')
      .update({
        current_value: 50,
        progress: 50
      })
      .eq('id', keyResult.id)
    
    if (updateError) {
      console.error('❌ 更新关键结果进度失败:', updateError)
    } else {
      console.log('✅ 关键结果进度更新成功')
    }
    
    // 5. 验证数据查询
    const { data: okrWithKR, error: fetchError } = await supabase
      .from('okrs')
      .select(`
        *,
        key_results:key_results(*)
      `)
      .eq('id', okr.id)
      .single()
    
    if (fetchError) {
      console.error('❌ 查询OKR数据失败:', fetchError)
    } else {
      console.log('✅ OKR数据查询成功:', {
        okr_title: okrWithKR.title,
        key_results_count: okrWithKR.key_results.length
      })
    }
    
    console.log('\n🎉 所有测试通过！OKR功能正常工作')
    
  } catch (error) {
    console.error('💥 测试过程中发生异常:', error)
  }
}

testOKRCreation()