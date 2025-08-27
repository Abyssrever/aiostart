const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimpleOKR() {
  try {
    console.log('🧪 尝试创建简单OKR...');
    
    // 获取现有用户
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('获取用户失败:', userError);
      return;
    }
    
    const user = users[0];
    console.log('使用用户:', user.name, '(', user.email, ')');
    
    // 尝试使用最基本的字段创建OKR
    const basicOKR = {
      user_id: user.id,
      title: '提升编程技能',
      description: '通过学习和实践提升编程能力',
      start_date: new Date().toISOString().split('T')[0], // 今天
      end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90天后
    };
    
    console.log('创建OKR数据:', basicOKR);
    
    const { data: okrData, error: okrError } = await supabase
      .from('okrs')
      .insert(basicOKR)
      .select()
      .single();
    
    if (okrError) {
      console.error('创建OKR失败:', okrError);
      
      // 尝试获取表的列信息
      console.log('\n🔍 尝试获取okrs表的所有列信息...');
      try {
        const { data: emptyData, error: emptyError } = await supabase
          .from('okrs')
          .select('*')
          .limit(0);
        console.log('表结构检查完成');
      } catch (structError) {
        console.error('表结构检查失败:', structError);
      }
      
      return;
    }
    
    console.log('✅ OKR创建成功:', okrData);
    
    // 创建一些关键结果
    const keyResults = [
      {
        okr_id: okrData.id,
        title: '完成2个编程项目',
        target_value: 2,
        current_value: 0,
        unit: '个'
      },
      {
        okr_id: okrData.id,
        title: '学习时长100小时',
        target_value: 100,
        current_value: 0,
        unit: '小时'
      }
    ];
    
    console.log('\n📊 创建关键结果...');
    for (const kr of keyResults) {
      const { data: krData, error: krError } = await supabase
        .from('key_results')
        .insert(kr)
        .select()
        .single();
      
      if (krError) {
        console.error(`创建关键结果失败 "${kr.title}":`, krError);
      } else {
        console.log(`✅ 关键结果创建成功: ${kr.title}`);
      }
    }
    
    console.log('\n🎉 测试OKR和关键结果创建完成！');
    
  } catch (error) {
    console.error('❌ 创建失败:', error);
  }
}

// 执行创建
createSimpleOKR();