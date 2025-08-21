// 启明星平台 - 模拟数据中心

// 用户信息
export const mockUsers = {
  student: {
    id: 'STU001',
    name: '张三',
    studentId: '2021001001',
    email: 'zhangsan@example.com',
    avatar: '/avatars/student.jpg',
    major: '计算机科学与技术',
    grade: '2021级',
    class: '计科2101班',
    gpa: 3.75,
    credits: 128,
    totalCredits: 160,
    enrollmentDate: '2021-09-01',
    expectedGraduation: '2025-06-30'
  },
  teacher: {
    id: 'TEA001',
    name: '李老师',
    employeeId: 'T2020001',
    email: 'liteacher@example.com',
    avatar: '/avatars/teacher.jpg',
    title: '副教授',
    department: '计算机学院',
    office: '信息楼A301',
    phone: '010-12345678',
    researchArea: '人工智能、机器学习',
    teachingYears: 8
  },
  admin: {
    id: 'ADM001',
    name: '王管理员',
    employeeId: 'A2019001',
    email: 'wangadmin@example.com',
    avatar: '/avatars/admin.jpg',
    title: '教务处主任',
    department: '教务处',
    office: '行政楼B205',
    phone: '010-87654321',
    permissions: ['user_management', 'system_config', 'data_analysis']
  }
}

// OKR数据
export const mockOKRs = [
  {
    id: 1,
    title: '提升算法能力',
    description: '通过刷题和项目实践提升算法思维',
    progress: 75,
    deadline: '2024-12-31',
    category: 'academic',
    priority: 'high',
    status: 'active',
    createdAt: '2024-01-01',
    owner: 'STU001',
    keyResults: [
      { id: 1, text: '完成LeetCode 200道题目', progress: 80, target: 200, current: 160, unit: '道' },
      { id: 2, text: '参与2个算法竞赛', progress: 50, target: 2, current: 1, unit: '个' },
      { id: 3, text: '完成算法项目实战', progress: 90, target: 1, current: 1, unit: '个' }
    ]
  },
  {
    id: 2,
    title: '掌握前端开发技能',
    description: '学习React、Vue等现代前端框架',
    progress: 60,
    deadline: '2024-11-30',
    category: 'skill',
    priority: 'high',
    status: 'active',
    createdAt: '2024-01-15',
    owner: 'STU001',
    keyResults: [
      { id: 4, text: '完成React官方教程', progress: 100, target: 1, current: 1, unit: '个' },
      { id: 5, text: '开发3个实战项目', progress: 33, target: 3, current: 1, unit: '个' },
      { id: 6, text: '学习TypeScript', progress: 45, target: 1, current: 0, unit: '个' }
    ]
  },
  {
    id: 3,
    title: '提升英语水平',
    description: '为未来求职和深造做准备',
    progress: 40,
    deadline: '2024-06-30',
    category: 'language',
    priority: 'medium',
    status: 'active',
    createdAt: '2024-02-01',
    owner: 'STU001',
    keyResults: [
      { id: 7, text: '托福成绩达到90分', progress: 30, target: 90, current: 75, unit: '分' },
      { id: 8, text: '每周阅读2篇英文技术文章', progress: 60, target: 48, current: 29, unit: '篇' },
      { id: 9, text: '参加英语角活动', progress: 25, target: 12, current: 3, unit: '次' }
    ]
  }
]

// 学习分析数据
export const mockLearningAnalytics = {
  weeklyStudyTime: [
    { week: '第1周', hours: 25 },
    { week: '第2周', hours: 32 },
    { week: '第3周', hours: 28 },
    { week: '第4周', hours: 35 },
    { week: '第5周', hours: 30 },
    { week: '第6周', hours: 38 },
    { week: '第7周', hours: 42 },
    { week: '第8周', hours: 36 }
  ],
  subjectProgress: [
    { subject: '数据结构', progress: 85, grade: 'A-' },
    { subject: '算法设计', progress: 78, grade: 'B+' },
    { subject: '操作系统', progress: 92, grade: 'A' },
    { subject: '数据库系统', progress: 73, grade: 'B' },
    { subject: '软件工程', progress: 88, grade: 'A-' }
  ],
  skillRadar: [
    { skill: '编程能力', score: 85 },
    { skill: '算法思维', score: 78 },
    { skill: '系统设计', score: 72 },
    { skill: '团队协作', score: 88 },
    { skill: '沟通表达', score: 75 },
    { skill: '创新思维', score: 80 }
  ],
  learningPath: [
    { phase: '基础阶段', completed: true, duration: '3个月' },
    { phase: '进阶阶段', completed: true, duration: '4个月' },
    { phase: '实战阶段', completed: false, duration: '5个月' },
    { phase: '专业阶段', completed: false, duration: '6个月' }
  ]
}

// 推荐资源数据
export const mockRecommendedResources = [
  {
    id: 1,
    title: 'React官方文档深度解析',
    type: 'article',
    category: '前端开发',
    difficulty: 'intermediate',
    estimatedTime: '2小时',
    rating: 4.8,
    tags: ['React', 'JavaScript', '前端'],
    description: '深入理解React核心概念和最佳实践',
    url: 'https://example.com/react-guide',
    recommendReason: '基于你的前端学习目标推荐'
  },
  {
    id: 2,
    title: '算法竞赛入门训练',
    type: 'course',
    category: '算法',
    difficulty: 'beginner',
    estimatedTime: '10小时',
    rating: 4.9,
    tags: ['算法', '竞赛', '编程'],
    description: '从零开始的算法竞赛训练课程',
    url: 'https://example.com/algorithm-course',
    recommendReason: '匹配你的算法提升OKR'
  },
  {
    id: 3,
    title: 'TypeScript实战项目',
    type: 'project',
    category: '编程实践',
    difficulty: 'advanced',
    estimatedTime: '20小时',
    rating: 4.7,
    tags: ['TypeScript', '项目', '实战'],
    description: '通过实际项目掌握TypeScript高级特性',
    url: 'https://example.com/ts-project',
    recommendReason: '补充你的技能短板'
  }
]

// AI对话历史
export const mockChatHistory = [
  {
    id: 1,
    type: 'user',
    content: '我想了解一下数据结构中的树结构',
    timestamp: '2024-01-20 14:30:00'
  },
  {
    id: 2,
    type: 'ai',
    content: '树结构是一种重要的非线性数据结构，它由节点组成，具有以下特点：\n\n1. **层次结构**：树有明确的层次关系\n2. **根节点**：树的顶部节点，没有父节点\n3. **叶子节点**：没有子节点的节点\n4. **子树**：每个节点都可以看作一个子树的根\n\n常见的树结构包括：\n- 二叉树\n- 平衡二叉树（AVL树）\n- 红黑树\n- B树和B+树\n\n你想深入了解哪种树结构呢？',
    timestamp: '2024-01-20 14:30:15'
  },
  {
    id: 3,
    type: 'user',
    content: '二叉搜索树的插入和删除操作怎么实现？',
    timestamp: '2024-01-20 14:35:00'
  },
  {
    id: 4,
    type: 'ai',
    content: '二叉搜索树的插入和删除操作如下：\n\n**插入操作：**\n```python\ndef insert(root, val):\n    if not root:\n        return TreeNode(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root\n```\n\n**删除操作：**\n删除节点有三种情况：\n1. 删除叶子节点：直接删除\n2. 删除只有一个子节点的节点：用子节点替换\n3. 删除有两个子节点的节点：用中序后继替换\n\n需要我详细解释删除操作的代码实现吗？',
    timestamp: '2024-01-20 14:35:20'
  }
]

// 教师数据
export const mockTeacherData = {
  teacherInfo: {
    name: '李老师',
    title: '数据结构课程教师 & 计科2101班班主任',
    classes: ['计科2101班', '计科2102班'],
    courses: ['数据结构与算法', '计算机程序设计基础']
  },
  classOverview: {
    totalStudents: 60,
    activeStudents: 52,
    averageOKRProgress: 72,
    averageGrade: 85.2,
    attendanceRate: 94.5,
    assignmentCompletionRate: 89.3
  },
  okrDistribution: [
    { range: '90-100%', count: 12, color: 'bg-green-500' },
    { range: '70-89%', count: 20, color: 'bg-blue-500' },
    { range: '50-69%', count: 18, color: 'bg-yellow-500' },
    { range: '30-49%', count: 8, color: 'bg-orange-500' },
    { range: '0-29%', count: 2, color: 'bg-red-500' }
  ],
  classes: [
    {
      id: 'CS2101',
      name: '计科2101班',
      studentCount: 32,
      subject: '数据结构与算法',
      semester: '2024春季学期',
      schedule: '周二、周四 10:00-11:40'
    },
    {
      id: 'CS2102',
      name: '计科2102班',
      studentCount: 28,
      subject: '数据结构与算法',
      semester: '2024春季学期',
      schedule: '周一、周三 14:00-15:40'
    }
  ],
  studentAlerts: [
    {
      id: 1,
      studentId: 'STU001',
      studentName: '张三',
      class: '计科2101班',
      alertType: 'attendance',
      severity: 'medium',
      message: '近两周缺勤3次',
      date: '2024-01-20',
      status: 'pending'
    },
    {
      id: 2,
      studentId: 'STU002',
      studentName: '李四',
      class: '计科2101班',
      alertType: 'grade',
      severity: 'high',
      message: '期中考试成绩显著下降',
      date: '2024-01-19',
      status: 'pending'
    },
    {
      id: 3,
      studentId: 'STU003',
      studentName: '王五',
      class: '计科2102班',
      alertType: 'behavior',
      severity: 'low',
      message: '课堂参与度较低',
      date: '2024-01-18',
      status: 'resolved'
    }
  ],
  knowledgePoints: [
    {
      id: 1,
      name: '二叉树遍历',
      masteryRate: 85,
      difficulty: 'medium',
      studentCount: 32,
      masteredCount: 27,
      strugglingCount: 5
    },
    {
      id: 2,
      name: '动态规划',
      masteryRate: 62,
      difficulty: 'hard',
      studentCount: 32,
      masteredCount: 20,
      strugglingCount: 12
    },
    {
      id: 3,
      name: '排序算法',
      masteryRate: 92,
      difficulty: 'easy',
      studentCount: 32,
      masteredCount: 29,
      strugglingCount: 3
    }
  ]
}

// 管理员数据
export const mockAdminData = {
  adminInfo: {
    name: '王管理员',
    title: '河北师范大学软件学院院长',
    department: '软件学院'
  },
  collegeOverview: {
    totalStudents: 2847,
    totalTeachers: 156,
    totalCourses: 89,
    activeSemesters: 2,
    graduationRate: 96.5,
    employmentRate: 94.2,
    averageGPA: 3.42,
    scholarshipRate: 23.8,
    averageOKRCompletion: 78.5
  },
  gradeData: [
    {
      grade: '2021级',
      studentCount: 756,
      averageGPA: 3.45,
      passRate: 94.2,
      excellentRate: 28.5,
      atRiskCount: 12
    },
    {
      grade: '2022级',
      studentCount: 732,
      averageGPA: 3.38,
      passRate: 92.8,
      excellentRate: 25.3,
      atRiskCount: 18
    },
    {
      grade: '2023级',
      studentCount: 698,
      averageGPA: 3.41,
      passRate: 93.5,
      excellentRate: 26.8,
      atRiskCount: 15
    },
    {
      grade: '2024级',
      studentCount: 661,
      averageGPA: 3.44,
      passRate: 95.1,
      excellentRate: 29.2,
      atRiskCount: 8
    }
  ],
  majorData: [
    {
      major: '计算机科学与技术',
      studentCount: 1245,
      employmentRate: 96.8,
      averageSalary: 12500,
      topEmployers: ['腾讯', '阿里巴巴', '字节跳动']
    },
    {
      major: '软件工程',
      studentCount: 892,
      employmentRate: 95.2,
      averageSalary: 11800,
      topEmployers: ['华为', '百度', '美团']
    },
    {
      major: '人工智能',
      studentCount: 456,
      employmentRate: 97.5,
      averageSalary: 14200,
      topEmployers: ['商汤科技', '旷视科技', '地平线']
    },
    {
      major: '网络安全',
      studentCount: 254,
      employmentRate: 94.1,
      averageSalary: 13600,
      topEmployers: ['奇安信', '绿盟科技', '启明星辰']
    }
  ],
  resourceUtilization: {
    classroomUsage: 78.5,
    labUsage: 85.2,
    libraryUsage: 67.3,
    serverUsage: 72.8,
    networkBandwidth: 89.4
  },
  resourceData: [
    {
      resource: '服务器集群A',
      type: 'computing',
      utilization: 89,
      capacity: '100 cores',
      status: 'high',
      suggestion: '建议增加计算资源或优化任务调度'
    },
    {
      resource: '实验室301',
      type: 'lab',
      utilization: 45,
      capacity: '60 seats',
      status: 'normal',
      suggestion: '可安排更多实践课程'
    },
    {
      resource: '图书馆技术书籍',
      type: 'library',
      utilization: 23,
      capacity: '5000 books',
      status: 'low',
      suggestion: '推广数字化阅读，增加电子资源'
    },
    {
      resource: 'GPU训练集群',
      type: 'computing',
      utilization: 78,
      capacity: '32 GPUs',
      status: 'normal',
      suggestion: '资源使用合理，可考虑扩展深度学习课程'
    },
    {
      resource: '多媒体教室',
      type: 'classroom',
      utilization: 92,
      capacity: '8 rooms',
      status: 'high',
      suggestion: '使用率过高，建议增加教室或优化排课'
    }
  ],
  aiRecommendations: [
    {
      id: 1,
      type: 'resource',
      priority: 'high',
      title: '服务器资源紧张预警',
      description: '检测到服务器集群A使用率持续超过85%，建议进行资源扩容或负载均衡优化。',
      impact: '可能影响300+学生的在线实验和项目开发',
      actions: ['申请增加云服务器资源', '优化现有任务调度算法', '实施分时段使用策略']
    },
    {
      id: 2,
      type: 'academic',
      priority: 'medium',
      title: '2024级学生适应性关注',
      description: '2024级新生的OKR完成率和GPA相对较低，建议加强新生适应性指导。',
      impact: '影响377名新生的学习效果和未来发展',
      actions: ['增加新生导师制度', '开设学习方法指导课程', '建立同伴互助小组']
    },
    {
      id: 3,
      type: 'curriculum',
      priority: 'medium',
      title: '跨专业资源共享机会',
      description: '数据科学专业的GPU资源需求与软件工程专业的使用时段存在互补性，可优化资源配置。',
      impact: '可提升整体资源利用率15-20%',
      actions: ['制定跨专业资源共享方案', '建立统一资源预约系统', '优化课程时间安排']
    }
  ]
}

// 系统统计数据
export const mockSystemStats = {
  dailyActiveUsers: [
    { date: '2024-01-14', students: 1245, teachers: 89, admins: 12 },
    { date: '2024-01-15', students: 1356, teachers: 92, admins: 15 },
    { date: '2024-01-16', students: 1289, teachers: 87, admins: 11 },
    { date: '2024-01-17', students: 1423, teachers: 95, admins: 14 },
    { date: '2024-01-18', students: 1378, teachers: 91, admins: 13 },
    { date: '2024-01-19', students: 1456, teachers: 98, admins: 16 },
    { date: '2024-01-20', students: 1512, teachers: 102, admins: 18 }
  ],
  featureUsage: [
    { feature: 'OKR管理', usage: 78.5 },
    { feature: 'AI助手', usage: 85.2 },
    { feature: '学习分析', usage: 67.3 },
    { feature: '资源推荐', usage: 72.8 },
    { feature: '成绩查询', usage: 94.6 },
    { feature: '课程表', usage: 89.4 }
  ],
  systemHealth: {
    uptime: 99.8,
    responseTime: 245,
    errorRate: 0.02,
    throughput: 1250
  }
}

// 导出所有数据
export const mockData = {
  users: mockUsers,
  okrs: mockOKRs,
  learningAnalytics: mockLearningAnalytics,
  recommendedResources: mockRecommendedResources,
  chatHistory: mockChatHistory,
  teacherData: mockTeacherData,
  adminData: mockAdminData,
  systemStats: mockSystemStats
}

export default mockData