const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 简化的测试用户数据（只包含必需字段）
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    student_id: '2021001001',
    email: 'zhang.ming@student.edu.cn',
    name: '张明',
    role: 'student',
    grade: '2021',
    major: '软件工程'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    student_id: '2021001002',
    email: 'li.xiaohong@student.edu.cn',
    name: '李晓红',
    role: 'student',
    grade: '2021',
    major: '软件工程'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    student_id: '2022001003',
    email: 'wang.lei@student.edu.cn',
    name: '王磊',
    role: 'student',
    grade: '2022',
    major: '计算机科学与技术'
  }
];

async function createSimpleTestData() {
  try {
    console.log('🚀 开始创建简化测试数据...');
    
    // 1. 创建用户
    console.log('\n👥 创建测试用户...');
    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });
      
      if (error) {
        console.error(`创建用户 ${user.name} 失败:`, error.message);
      } else {
        console.log(`✅ 用户 ${user.name} 创建成功`);
      }
    }
    
    console.log('\n🎉 简化测试数据创建完成！');
    console.log('\n🔑 测试账号:');
    testUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n💡 使用说明:');
    console.log('  1. 启动开发服务器: npm run dev');
    console.log('  2. 访问 http://localhost:3000/login');
    console.log('  3. 输入任意测试邮箱，点击"直接登录"');
    console.log('  4. 进入仪表板后，可以创建和管理OKR目标');
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 执行创建测试数据
createSimpleTestData();