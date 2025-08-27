// 启明星平台 - 模拟数据中心

// 用户认证账户（用于登录）
export const mockAuthUsers = [
  {
    id: '1',
    username: 'student',
    password: 'student', // 实际项目中应该加密存储
    name: '张三',
    role: 'student' as const,
    avatar: '/avatars/student.jpg'
  },
  {
    id: '2', 
    username: 'teacher',
    password: 'teacher',
    name: '李老师',
    role: 'teacher' as const,
    avatar: '/avatars/teacher.jpg'
  },
  {
    id: '3',
    username: 'admin', 
    password: 'admin',
    name: '王管理员',
    role: 'admin' as const,
    avatar: '/avatars/admin.jpg'
  }
]

// 用户详细信息
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

// AI对话历史记录会话
export const mockChatSessions = [
  {
    id: 'session_1',
    title: '数据结构学习讨论',
    lastMessage: '需要我详细解释删除操作的代码实现吗？',
    timestamp: '2024-01-20 14:35:20',
    messageCount: 4,
    category: '学习辅导',
    messages: [
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
  },
  {
    id: 'session_2',
    title: 'React开发问题咨询',
    lastMessage: '这样可以有效避免不必要的重新渲染，提升应用性能。',
    timestamp: '2024-01-19 16:20:30',
    messageCount: 6,
    category: '技术咨询',
    messages: [
      {
        id: 5,
        type: 'user',
        content: 'React中的useCallback和useMemo有什么区别？',
        timestamp: '2024-01-19 16:15:00'
      },
      {
        id: 6,
        type: 'ai',
        content: 'useCallback和useMemo都是React的性能优化Hook，但用途不同：\n\n**useCallback**：\n- 用于缓存函数\n- 返回一个记忆化的回调函数\n- 只有依赖项改变时才会返回新的函数\n\n**useMemo**：\n- 用于缓存计算结果\n- 返回一个记忆化的值\n- 只有依赖项改变时才会重新计算\n\n使用场景示例我可以详细说明。',
        timestamp: '2024-01-19 16:15:45'
      },
      {
        id: 7,
        type: 'user',
        content: '能给个具体的代码示例吗？',
        timestamp: '2024-01-19 16:18:00'
      },
      {
        id: 8,
        type: 'ai',
        content: '当然可以！这里是具体示例：\n\n```jsx\n// useCallback示例\nconst MyComponent = ({ items }) => {\n  const [count, setCount] = useState(0);\n  \n  // 缓存函数，避免子组件不必要的重渲染\n  const handleClick = useCallback((id) => {\n    console.log("Clicked:", id);\n  }, []); // 空依赖数组，函数永远不变\n  \n  return (\n    <div>\n      <button onClick={() => setCount(count + 1)}>\n        Count: {count}\n      </button>\n      {items.map(item => (\n        <ChildComponent \n          key={item.id} \n          item={item} \n          onClick={handleClick} \n        />\n      ))}\n    </div>\n  );\n};\n\n// useMemo示例\nconst ExpensiveComponent = ({ data }) => {\n  // 缓存计算结果\n  const expensiveValue = useMemo(() => {\n    return data.reduce((sum, item) => sum + item.value, 0);\n  }, [data]); // 只有data改变时才重新计算\n  \n  return <div>Total: {expensiveValue}</div>;\n};\n```',
        timestamp: '2024-01-19 16:19:15'
      },
      {
        id: 9,
        type: 'user',
        content: '什么时候应该使用这些优化？',
        timestamp: '2024-01-19 16:20:00'
      },
      {
        id: 10,
        type: 'ai',
        content: '使用这些优化的时机：\n\n**何时使用useCallback：**\n- 将函数传递给子组件作为props\n- 函数作为其他Hook的依赖项\n- 避免在每次渲染时创建新函数\n\n**何时使用useMemo：**\n- 计算成本较高的操作\n- 复杂的数据转换\n- 避免在每次渲染时重复计算\n\n**注意事项：**\n- 不要过度优化，简单计算不需要useMemo\n- 依赖数组要准确，避免闭包陷阱\n- 性能分析后再决定是否需要优化\n\n这样可以有效避免不必要的重新渲染，提升应用性能。',
        timestamp: '2024-01-19 16:20:30'
      }
    ]
  },
  {
    id: 'session_3',
    title: 'OKR目标制定指导',
    lastMessage: '记住，好的OKR应该是具有挑战性但可实现的。',
    timestamp: '2024-01-18 10:45:00',
    messageCount: 8,
    category: '目标规划',
    messages: [
      {
        id: 11,
        type: 'user',
        content: '我想制定一个关于提升编程能力的OKR，应该怎么设定？',
        timestamp: '2024-01-18 10:30:00'
      },
      {
        id: 12,
        type: 'ai',
        content: '制定编程能力提升的OKR是个很好的想法！让我帮你构建一个SMART的目标：\n\n**目标(Objective)：** 在3个月内显著提升编程能力\n\n**关键结果(Key Results)可以包括：**\n1. 完成200道LeetCode算法题（当前：50道）\n2. 独立完成2个完整的项目（前端+后端）\n3. 学习并掌握一门新的编程语言或框架\n4. 代码review通过率达到95%以上\n\n你觉得这个方向如何？我们可以根据你的具体情况调整。',
        timestamp: '2024-01-18 10:32:00'
      },
      {
        id: 13,
        type: 'user',
        content: '这个目标会不会太ambitious了？我现在还是初学者',
        timestamp: '2024-01-18 10:35:00'
      },
      {
        id: 14,
        type: 'ai',
        content: '你说得对！让我们调整为更适合初学者的版本：\n\n**目标：** 建立扎实的编程基础（3个月）\n\n**关键结果：**\n1. 完成50道基础算法题（每周3-4道）\n2. 完成1个个人项目（如待办事项应用）\n3. 每周编程练习不少于10小时\n4. 通过在线课程学习一门语言基础（如Python或JavaScript）\n\n这样的目标更现实，也更容易跟踪进度。你觉得怎么样？',
        timestamp: '2024-01-18 10:37:00'
      },
      {
        id: 15,
        type: 'user',
        content: '好多了！那我应该如何跟踪这些进度呢？',
        timestamp: '2024-01-18 10:40:00'
      },
      {
        id: 16,
        type: 'ai',
        content: '跟踪进度的方法：\n\n**1. 每日记录：**\n- 今天完成了几道题？\n- 编程时间多长？\n- 遇到了什么问题？\n\n**2. 周度回顾：**\n- 本周目标完成情况\n- 学到的新知识点\n- 下周的重点计划\n\n**3. 使用工具：**\n- GitHub提交记录\n- LeetCode进度统计\n- 时间跟踪应用\n- 学习笔记\n\n**4. 里程碑庆祝：**\n- 每完成25道题庆祝一下\n- 项目每个阶段完成后总结\n\n记住，好的OKR应该是具有挑战性但可实现的。',
        timestamp: '2024-01-18 10:45:00'
      }
    ]
  },
  {
    id: 'session_4',
    title: '学习方法优化建议',
    lastMessage: '坚持这个方法，你会看到明显的进步！',
    timestamp: '2024-01-17 14:20:00',
    messageCount: 4,
    category: '学习指导',
    messages: [
      {
        id: 17,
        type: 'user',
        content: '我感觉学习效率不高，总是容易分心，有什么好的学习方法推荐吗？',
        timestamp: '2024-01-17 14:10:00'
      },
      {
        id: 18,
        type: 'ai',
        content: '学习效率问题很常见，我推荐几个实用的方法：\n\n**1. 番茄工作法：**\n- 25分钟专注学习 + 5分钟休息\n- 4个番茄后休息15-30分钟\n- 期间完全专注，不碰手机\n\n**2. 费曼学习法：**\n- 学完后尝试教给别人\n- 用简单语言解释复杂概念\n- 发现不懂的地方重新学习\n\n**3. 环境优化：**\n- 固定学习地点\n- 移除干扰源\n- 准备好所需材料\n\n**4. 目标分解：**\n- 大目标分解为小任务\n- 每天设定具体可达成的目标\n\n你想先尝试哪种方法？',
        timestamp: '2024-01-17 14:12:00'
      },
      {
        id: 19,
        type: 'user',
        content: '番茄工作法听起来不错，但是25分钟会不会太短了？',
        timestamp: '2024-01-17 14:15:00'
      },
      {
        id: 20,
        type: 'ai',
        content: '25分钟确实可以根据个人情况调整！\n\n**个性化调整建议：**\n- 初学者：15-20分钟开始\n- 有基础：25-30分钟\n- 深度工作：45-90分钟\n\n**关键原则：**\n1. 时间内保持100%专注\n2. 休息时间不能省略\n3. 找到适合自己的节奏\n4. 逐步延长专注时间\n\n**实施建议：**\n- 第一周用20分钟适应\n- 感觉轻松后延长到25分钟\n- 根据学习内容调整时长\n- 复杂内容可以用更长时间\n\n坚持这个方法，你会看到明显的进步！',
        timestamp: '2024-01-17 14:20:00'
      }
    ]
  }
]

// 兼容性：保持原有的chatHistory格式
export const mockChatHistory = mockChatSessions[0]?.messages || []

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
  chatSessions: mockChatSessions,
  teacherData: mockTeacherData,
  adminData: mockAdminData,
  systemStats: mockSystemStats
}

export default mockData