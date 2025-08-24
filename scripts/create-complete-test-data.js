const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 完整的测试数据
const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    student_id: '2021001001',
    username: 'student_zhang',
    email: 'zhang.ming@student.edu.cn',
    name: '张明',
    full_name: '张明',
    phone: '13800138001',
    role: 'student',
    grade: '2021',
    major: '软件工程',
    department: '软件学院',
    class_name: '软工2021-01班'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    student_id: '2021001002',
    username: 'student_li',
    email: 'li.xiaohong@student.edu.cn',
    name: '李晓红',
    full_name: '李晓红',
    phone: '13800138002',
    role: 'student',
    grade: '2021',
    major: '软件工程',
    department: '软件学院',
    class_name: '软工2021-01班'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    student_id: '2022001003',
    username: 'student_wang',
    email: 'wang.lei@student.edu.cn',
    name: '王磊',
    full_name: '王磊',
    phone: '13800138003',
    role: 'student',
    grade: '2022',
    major: '计算机科学与技术',
    department: '软件学院',
    class_name: '计科2022-01班'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    student_id: 'T001',
    username: 'teacher_zhao',
    email: 'zhao.jianing@teacher.edu.cn',
    name: '赵佳宁',
    full_name: '赵佳宁',
    phone: '13800138101',
    role: 'teacher',
    department: '软件学院'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    student_id: 'A001',
    username: 'admin_sun',
    email: 'sun.admin@admin.edu.cn',
    name: '孙院长',
    full_name: '孙院长',
    phone: '13800138201',
    role: 'admin',
    department: '软件学院'
  }
];

const testOKRs = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440001', // 张明
    title: '提升编程能力，为实习做准备',
    description: '通过系统学习和实践项目，全面提升编程技能和项目经验，争取在大三暑假找到心仪的实习岗位',
    objective_type: 'personal',
    target_quarter: '2024Q1',
    target_year: 2024,
    status: 'active',
    progress_percentage: 65
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440002',
    user_id: '550e8400-e29b-41d4-a716-446655440001', // 张明
    title: '完成软件工程课程项目',
    description: '与团队协作完成一个完整的Web应用项目，获得优秀成绩',
    objective_type: 'course',
    target_quarter: '2024Q1',
    target_year: 2024,
    status: 'active',
    progress_percentage: 80
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440003',
    user_id: '550e8400-e29b-41d4-a716-446655440002', // 李晓红
    title: '提高算法竞赛水平',
    description: '通过刷题和参加竞赛，提升算法设计和编程竞赛能力',
    objective_type: 'personal',
    target_quarter: '2024Q1',
    target_year: 2024,
    status: 'active',
    progress_percentage: 45
  },
  {
    id: '650e8400-e29b-41d4-a716-446655440004',
    user_id: '550e8400-e29b-41d4-a716-446655440003', // 王磊
    title: '掌握前端开发技术栈',
    description: '系统学习React、TypeScript等现代前端技术，完成个人项目',
    objective_type: 'personal',
    target_quarter: '2024Q1',
    target_year: 2024,
    status: 'active',
    progress_percentage: 30
  }
];

const testKeyResults = [
  // 张明的编程能力OKR关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440001',
    title: '完成3个个人项目',
    description: '使用不同技术栈完成3个完整的个人项目，包括前端、后端和全栈项目',
    target_value: 3,
    current_value: 2,
    unit: '个',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 67
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440001',
    title: '学习时长达到200小时',
    description: '课外学习编程相关知识200小时，包括视频教程、技术文档和实践',
    target_value: 200,
    current_value: 130,
    unit: '小时',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 65
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440001',
    title: '通过技术面试模拟',
    description: '成功通过至少5场技术面试模拟，包括算法题和项目经验分享',
    target_value: 5,
    current_value: 3,
    unit: '场',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 60
  },
  // 张明的课程项目关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440002',
    title: '完成前端开发',
    description: '使用React完成用户界面开发，实现所有功能页面',
    target_value: 1,
    current_value: 1,
    unit: '个',
    measurement_type: 'boolean',
    status: 'completed',
    progress_percentage: 100
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440002',
    title: '完成后端API开发',
    description: '使用Node.js完成所有API接口，包括用户认证、数据CRUD等',
    target_value: 100,
    current_value: 80,
    unit: '%',
    measurement_type: 'percentage',
    status: 'active',
    progress_percentage: 80
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440002',
    title: '项目部署上线',
    description: '完成项目的部署和上线，确保可以正常访问',
    target_value: 1,
    current_value: 0.6,
    unit: '个',
    measurement_type: 'percentage',
    status: 'active',
    progress_percentage: 60
  },
  // 李晓红的算法OKR关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440003',
    title: 'LeetCode刷题300道',
    description: '在LeetCode平台完成300道算法题，包括简单、中等、困难各个级别',
    target_value: 300,
    current_value: 135,
    unit: '道',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 45
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440003',
    title: '参加算法竞赛',
    description: '参加至少3场在线算法竞赛，提升实战经验',
    target_value: 3,
    current_value: 1,
    unit: '场',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 33
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440003',
    title: '算法知识点掌握',
    description: '掌握动态规划、图论、字符串等重要算法知识点',
    target_value: 10,
    current_value: 6,
    unit: '个',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 60
  },
  // 王磊的前端OKR关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440004',
    title: '学习React基础',
    description: '完成React官方教程和练习项目',
    target_value: 100,
    current_value: 70,
    unit: '%',
    measurement_type: 'percentage',
    status: 'active',
    progress_percentage: 70
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440004',
    title: '完成TypeScript学习',
    description: '掌握TypeScript基础语法和在React中的应用',
    target_value: 100,
    current_value: 20,
    unit: '%',
    measurement_type: 'percentage',
    status: 'active',
    progress_percentage: 20
  },
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440004',
    title: '构建个人项目',
    description: '使用React和TypeScript构建一个完整的个人项目',
    target_value: 1,
    current_value: 0,
    unit: '个',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 0
  }
];

async function createCompleteTestData() {
  try {
    console.log('🚀 开始创建完整的测试数据...');
    
    // 1. 创建用户
    console.log('\n👥 创建测试用户...');
    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'id' });
      
      if (error) {
        console.error(`创建用户 ${user.name} 失败:`, error);
      } else {
        console.log(`✅ 用户 ${user.name} 创建成功`);
      }
    }
    
    // 2. 创建OKR目标
    console.log('\n🎯 创建OKR目标...');
    for (const okr of testOKRs) {
      const { data, error } = await supabase
        .from('okrs')
        .upsert(okr, { onConflict: 'id' });
      
      if (error) {
        console.error(`创建OKR "${okr.title}" 失败:`, error);
      } else {
        console.log(`✅ OKR "${okr.title}" 创建成功`);
      }
    }
    
    // 3. 创建关键结果
    console.log('\n📊 创建关键结果...');
    for (const kr of testKeyResults) {
      const { data, error } = await supabase
        .from('key_results')
        .insert(kr);
      
      if (error && error.code !== '23505') { // 忽略重复插入错误
        console.error(`创建关键结果 "${kr.title}" 失败:`, error);
      } else {
        console.log(`✅ 关键结果 "${kr.title}" 创建成功`);
      }
    }
    
    console.log('\n🎉 完整测试数据创建完成！');
    console.log('\n📈 数据统计:');
    console.log(`  - 用户数: ${testUsers.length}`);
    console.log(`  - OKR目标数: ${testOKRs.length}`);
    console.log(`  - 关键结果数: ${testKeyResults.length}`);
    
    console.log('\n🔑 测试账号:');
    testUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n💡 使用说明:');
    console.log('  1. 访问 http://localhost:3000/login');
    console.log('  2. 输入任意测试邮箱，点击"直接登录"');
    console.log('  3. 进入仪表板，点击"OKR"标签页查看真实数据');
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 执行创建测试数据
createCompleteTestData();