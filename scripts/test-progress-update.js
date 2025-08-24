const { supabaseAdmin } = require('../src/lib/supabase')

async function testProgressUpdate() {
  console.log('🧪 测试关键结果进度更新功能...')
  
  try {
    // 1. 查找现有的关键结果
    const { data: keyResults, error: krError } = await supabaseAdmin
      .from('key_results')
      .select('*')
      .limit(1)
    
    if (krError) {
      console.error('❌ 查找关键结果失败:', krError)
      return
    }
    
    if (!keyResults || keyResults.length === 0) {
      console.log('📝 没有找到关键结果，创建测试数据...')
      
      // 查找现有OKR
      const { data: okrs, error: okrError } = await supabaseAdmin
        .from('okrs')
        .select('*')
        .limit(1)
      
      if (okrError || !okrs || okrs.length === 0) {
        console.log('需要先创建OKR和关键结果才能测试进度更新')
        return
      }
      
      // 创建测试关键结果
      const { data: newKR, error: createError } = await supabaseAdmin
        .from('key_results')
        .insert({
          okr_id: okrs[0].id,
          title: '测试关键结果',
          description: '用于测试进度更新',
          target_value: 100,
          current_value: 0,
          unit: '个',
          measurement_type: 'numeric',
          status: 'active',
          progress: 0
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ 创建测试关键结果失败:', createError)
        return
      }
      
      console.log('✅ 创建测试关键结果成功:', newKR)
      keyResults[0] = newKR
    }
    
    const testKR = keyResults[0]
    console.log('🎯 测试关键结果:', testKR)
    
    // 2. 测试更新进度
    console.log('📊 测试更新进度到50...')
    const { error: updateError } = await supabaseAdmin
      .from('key_results')
      .update({
        current_value: 50,
        progress: 50,
        status: 'active'
      })
      .eq('id', testKR.id)
    
    if (updateError) {
      console.error('❌ 更新进度失败:', updateError)
    } else {
      console.log('✅ 进度更新成功')
      
      // 验证更新结果
      const { data: updatedKR } = await supabaseAdmin
        .from('key_results')
        .select('*')
        .eq('id', testKR.id)
        .single()
      
      console.log('📈 更新后的关键结果:', updatedKR)
    }
    
  } catch (error) {
    console.error('🚫 测试异常:', error)
  }
}

testProgressUpdate()