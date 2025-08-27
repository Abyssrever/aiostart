const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://sxhfiadommaopzoigtbz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc0MDMwNywiZXhwIjoyMDcxMzE2MzA3fQ.053-ksLf3gkj03KXZZOcdZoAJ7oYvKeckoCuKswZ1U4';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 测试用户数据
const testUsers = [
  // 学生用户
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    student_id: '2021001001',
    username: 'student_zhang',
    email: 'zhang.ming@student.edu.cn',
    name: '张明',
    full_name: '张明',
    phone: '13800138001',
    role_type: 'student',
    role: 'student',
    grade: '2021',
    major: '软件工程',
    department: '软件学院',
    class_name: '软工2021-01班',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    student_id: '2021001002',
    username: 'student_li',
    email: 'li.xiaohong@student.edu.cn',
    name: '李晓红',
    full_name: '李晓红',
    phone: '13800138002',
    role_type: 'student',
    role: 'student',
    grade: '2021',
    major: '软件工程',
    department: '软件学院',
    class_name: '软工2021-01班',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    student_id: '2022001003',
    username: 'student_wang',
    email: 'wang.lei@student.edu.cn',
    name: '王磊',
    full_name: '王磊',
    phone: '13800138003',
    role_type: 'student',
    role: 'student',
    grade: '2022',
    major: '计算机科学与技术',
    department: '软件学院',
    class_name: '计科2022-01班',
    status: 'active'
  },
  // 教师用户
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    student_id: 'T001',
    username: 'teacher_zhao',
    email: 'zhao.jianing@teacher.edu.cn',
    name: '赵佳宁',
    full_name: '赵佳宁',
    phone: '13800138101',
    role_type: 'teacher',
    role: 'teacher',
    department: '软件学院',
    status: 'active'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    username: 'teacher_liu',
    student_id: 'T002',
    email: 'liu.professor@teacher.edu.cn',
    name: '刘教授',
    full_name: '刘教授',
    phone: '13800138102',
    role_type: 'teacher',
    role: 'teacher',
    department: '软件学院',
    status: 'active'
  },
  // 管理员用户
  {
    id: '550e8400-e29b-41d4-a716-446655440201',
    student_id: 'A001',
    username: 'admin_sun',
    email: 'sun.admin@admin.edu.cn',
    name: '孙院长',
    full_name: '孙院长',
    phone: '13800138201',
    role_type: 'admin',
    role: 'admin',
    department: '软件学院',
    status: 'active'
  }
];

// OKR测试数据
const testOKRs = [
  {
    id: '650e8400-e29b-41d4-a716-446655440001',
    user_id: '550e8400-e29b-41d4-a716-446655440001', // 张明
    title: '提升编程能力，为实习做准备',
    description: '通过系统学习和实践项目，全面提升编程技能和项目经验',
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
    description: '与团队协作完成一个完整的Web应用项目',
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
  }
];

// 关键结果测试数据
const testKeyResults = [
  // 张明的OKR关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440001',
    title: '完成3个个人项目',
    description: '使用不同技术栈完成3个完整的个人项目',
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
    description: '课外学习编程相关知识200小时',
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
    description: '成功通过至少5场技术面试模拟',
    target_value: 5,
    current_value: 3,
    unit: '场',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 60
  },
  // 课程项目关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440002',
    title: '完成前端开发',
    description: '使用React完成用户界面开发',
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
    description: '使用Node.js完成所有API接口',
    target_value: 1,
    current_value: 0.8,
    unit: '个',
    measurement_type: 'percentage',
    status: 'active',
    progress_percentage: 80
  },
  // 李晓红的关键结果
  {
    okr_id: '650e8400-e29b-41d4-a716-446655440003',
    title: 'LeetCode刷题300道',
    description: '在LeetCode平台完成300道算法题',
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
    description: '参加至少3场在线算法竞赛',
    target_value: 3,
    current_value: 1,
    unit: '场',
    measurement_type: 'numeric',
    status: 'active',
    progress_percentage: 33
  }
];

// 学习活动测试数据
const testLearningActivities = [
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    activity_type: 'project',
    title: 'React 电商网站开发',
    description: '开发一个功能完整的电商网站，包括用户认证、商品管理、购物车等功能',
    duration_minutes: 1200, // 20小时
    difficulty_level: 4,
    completion_status: 'completed',
    score: 92,
    feedback: '项目完成度很高，代码结构清晰，UI设计美观',
    tags: ['React', 'JavaScript', 'CSS', '项目实战'],
    started_at: new Date('2024-01-15').toISOString(),
    completed_at: new Date('2024-02-01').toISOString()
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    activity_type: 'study',
    title: 'Node.js 后端开发学习',
    description: '学习Node.js基础知识，Express框架，数据库操作等',
    duration_minutes: 800, // 13.3小时
    difficulty_level: 3,
    completion_status: 'in_progress',
    tags: ['Node.js', 'Express', 'MongoDB', '后端开发'],
    started_at: new Date('2024-02-05').toISOString()
  },
  {
    user_id: '550e8400-e29b-41d4-a716-446655440002',
    activity_type: 'assignment',
    title: '数据结构课程作业 - 红黑树实现',
    description: '使用C++实现红黑树数据结构，包括插入、删除、查找等操作',
    duration_minutes: 480, // 8小时
    difficulty_level: 5,
    completion_status: 'completed',
    score: 95,
    feedback: '算法实现正确，代码效率高，注释详细',
    tags: ['C++', '数据结构', '红黑树', '算法'],
    started_at: new Date('2024-01-20').toISOString(),
    completed_at: new Date('2024-01-25').toISOString()
  }
];

async function createTestUsers() {
  try {
    console.log('🚀 开始创建测试用户数据...');
    
    // 创建用户
    console.log('\n👥 插入测试用户...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert(testUsers, { onConflict: 'id' });
    
    if (usersError) {
      console.error('创建用户失败:', usersError);
      return;
    }
    console.log('✅ 用户创建成功');
    
    // 创建OKR目标
    console.log('\n🎯 插入测试OKR目标...');
    const { data: okrData, error: okrError } = await supabase
      .from('okrs')
      .upsert(testOKRs, { onConflict: 'id' });
    
    if (okrError) {
      console.error('创建OKR失败:', okrError);
      return;
    }
    console.log('✅ OKR目标创建成功');
    
    // 创建关键结果
    console.log('\n📊 插入关键结果...');
    const { data: krData, error: krError } = await supabase
      .from('key_results')
      .insert(testKeyResults);
    
    if (krError) {
      console.error('创建关键结果失败:', krError);
      return;
    }
    console.log('✅ 关键结果创建成功');
    
    // 创建学习活动
    console.log('\n📚 插入学习活动...');
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('learning_activities')
      .insert(testLearningActivities);
    
    if (activitiesError) {
      console.error('创建学习活动失败:', activitiesError);
      return;
    }
    console.log('✅ 学习活动创建成功');
    
    console.log('\n🎉 测试数据创建完成！');
    console.log('\n📋 创建的测试用户:');
    testUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
    console.log('\n🎯 创建的OKR目标数量:', testOKRs.length);
    console.log('📊 创建的关键结果数量:', testKeyResults.length);
    console.log('📚 创建的学习活动数量:', testLearningActivities.length);
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error);
  }
}

// 执行创建测试数据
createTestUsers();