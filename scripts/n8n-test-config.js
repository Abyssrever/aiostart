/**
 * N8N测试配置文件
 * 可以根据需要修改这些配置参数
 */

module.exports = {
  // N8N工作流配置
  n8n: {
    // 聊天历史工作流webhook URL
    chatHistoryWebhook: 'https://n8n-vdarinvh.us-east-1.clawcloudrun.com/webhook/f956c56f-90db-4b7e-8b6a-2cd1ec1342c9',
    
    // 请求超时时间（毫秒）
    timeout: 60000,
  },

  // 测试用户数据
  testUsers: {
    // 默认测试用户
    default: {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userName: '测试用户1',
      projectId: null, // 不指定项目，测试通用聊天
      organizationId: null, // 不指定组织
    },
    
    // 带项目的测试用户
    withProject: {
      userId: '550e8400-e29b-41d4-a716-446655440001', 
      userName: '测试用户2',
      projectId: '550e8400-e29b-41d4-a716-446655440010', // 指定项目ID
      organizationId: '550e8400-e29b-41d4-a716-446655440020', // 指定组织ID
    }
  },

  // 测试场景配置
  testScenarios: [
    {
      name: '基础对话测试',
      messages: [
        '你好，我是新用户',
        '你能帮我做什么？',
        '我想了解这个平台的功能'
      ]
    },
    {
      name: '项目相关对话',
      messages: [
        '我今天应该做什么任务？',
        '我的OKR进度如何？',
        '有什么新的项目更新吗？'
      ]
    },
    {
      name: '知识库检索测试',
      messages: [
        '如何使用这个平台？',
        'OKR是什么？',
        '怎么设置目标？'
      ]
    }
  ],

  // 数据库验证配置
  database: {
    // 验证延迟（毫秒） - 等待N8N处理完成
    verifyDelay: 3000,
    
    // 查询最新记录数量
    queryLimit: 5
  }
};