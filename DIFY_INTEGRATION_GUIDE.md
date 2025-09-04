# Dify AI 集成使用指南

## 🚀 快速开始

### 1. 环境配置

确保您的 `.env.local` 文件包含以下Dify配置：

```env
# AI服务配置 - 使用Dify
AI_PROVIDER=dify
DIFY_BASE_URL=https://dify.aipfuture.com/v1
DIFY_API_KEY=app-kCJGgAvqqvbfJV1AJ95HIYMz
DIFY_APP_ID=app-kCJGgAvqqvbfJV1AJ95HIYMz
```

### 2. 测试集成

#### 方法一：使用Web界面测试
1. 启动开发服务器：`npm run dev`
2. 访问测试页面：`http://localhost:3000/test-dify`
3. 点击"检查状态"验证配置
4. 输入测试消息并发送

#### 方法二：使用命令行测试
```bash
node scripts/test-dify.js
```

#### 方法三：使用API端点测试
```bash
# 健康检查
curl http://localhost:3000/api/test-dify

# 发送测试消息
curl -X POST http://localhost:3000/api/test-dify \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，请介绍一下你的功能"}'
```

## 🏗️ 架构说明

### 核心组件

1. **DifyService** (`src/lib/dify-service.ts`)
   - 专门处理Dify API调用
   - 支持聊天消息、健康检查、错误处理
   - 包含重试机制和超时控制

2. **AIServiceManager** (`src/lib/ai-service-manager.ts`)
   - 统一的AI服务管理器
   - 支持多种AI提供商（OpenAI、Claude、Dify等）
   - 自动路由到配置的提供商

3. **AI配置** (`src/lib/ai-config.ts`)
   - 集中管理AI服务配置
   - 支持不同会话类型的配置
   - 环境变量自动加载

### API端点

- `POST /api/ai-chat` - 主要的AI聊天接口
- `GET/POST /api/test-dify` - Dify服务测试接口

## 🔧 配置选项

### Dify配置参数

```typescript
interface DifyConfig {
  baseUrl: string      // Dify API基础URL
  apiKey: string       // Dify应用API密钥
  appId: string        // Dify应用ID
  timeout?: number     // 请求超时时间（默认90秒）
  maxRetries?: number  // 最大重试次数（默认3次）
}
```

### 会话类型配置

系统支持不同类型的AI会话：

- `general` - 通用对话
- `learning` - 学习辅导
- `homework` - 作业帮助
- `career` - 职业规划
- `mental` - 心理健康

每种类型都可以配置不同的系统提示词和参数。

## 📝 使用示例

### 基础聊天

```typescript
import { AIServiceManager } from '@/lib/ai-service-manager'

const aiManager = AIServiceManager.getInstance()

const response = await aiManager.sendMessage({
  message: '你好，我需要学习帮助',
  sessionType: 'learning',
  userId: 'user123',
  userProfile: {
    name: '张三',
    role: 'student',
    grade: '高二'
  }
})

console.log(response.content) // AI的回复内容
```

### 带上下文的对话

```typescript
const response = await aiManager.sendMessage({
  message: '继续刚才的话题',
  sessionType: 'general',
  sessionId: 'conversation-123',
  conversationHistory: [
    { role: 'user', content: '什么是量子物理？' },
    { role: 'assistant', content: '量子物理是研究微观粒子行为的科学...' }
  ],
  userId: 'user123'
})
```

## 🛠️ 故障排除

### 常见问题

1. **配置错误**
   - 检查 `.env.local` 文件中的Dify配置
   - 确保API密钥正确且有效
   - 验证Base URL可访问

2. **网络问题**
   - 检查网络连接
   - 确认防火墙设置
   - 验证DNS解析

3. **API调用失败**
   - 查看控制台错误日志
   - 检查API密钥权限
   - 确认请求格式正确

### 调试技巧

1. **启用详细日志**
   ```typescript
   // 在调用前设置
   process.env.DEBUG = 'dify:*'
   ```

2. **使用测试端点**
   - 访问 `/test-dify` 页面进行可视化测试
   - 使用 `scripts/test-dify.js` 进行命令行测试

3. **检查响应数据**
   - 查看完整的API响应
   - 分析错误信息和状态码

## 🔒 安全注意事项

1. **API密钥保护**
   - 不要在客户端代码中暴露API密钥
   - 使用环境变量存储敏感信息
   - 定期轮换API密钥

2. **输入验证**
   - 对用户输入进行适当的验证和清理
   - 防止注入攻击
   - 限制消息长度和频率

3. **数据隐私**
   - 不要发送敏感个人信息到AI服务
   - 遵守数据保护法规
   - 实施适当的数据加密

## 📊 性能优化

1. **缓存策略**
   - 启用AI响应缓存（已实现）
   - 缓存常见问题的答案
   - 使用Redis提升缓存性能

2. **请求优化**
   - 实施请求去重
   - 使用连接池
   - 启用响应压缩

3. **监控指标**
   - 响应时间监控
   - 错误率统计
   - Token使用量跟踪

## 🚀 高级功能

### 知识库集成

如果您的Dify应用配置了知识库，系统会自动处理检索结果：

```typescript
// 响应中会包含知识库检索信息
{
  content: "基于知识库的回答...",
  metadata: {
    retrieverResources: [
      {
        document_name: "教学文档.pdf",
        content: "相关内容片段...",
        score: 0.95,
        dataset_name: "教育资料库"
      }
    ]
  }
}
```

### 多轮对话

系统支持维护对话上下文：

```typescript
// 第一轮对话
const response1 = await aiManager.sendMessage({
  message: '什么是机器学习？',
  sessionId: 'conv-123'
})

// 第二轮对话（带上下文）
const response2 = await aiManager.sendMessage({
  message: '它有哪些应用？',
  sessionId: 'conv-123', // 相同的会话ID
  conversationHistory: [
    { role: 'user', content: '什么是机器学习？' },
    { role: 'assistant', content: response1.content }
  ]
})
```

### 流式响应

对于长回答，可以启用流式响应：

```typescript
const response = await aiManager.sendMessage({
  message: '详细解释量子计算',
  streamMode: true // 启用流式响应
})

// 处理流式数据
response.stream?.on('data', (chunk) => {
  console.log('收到数据块:', chunk)
})
```

## 📞 技术支持

如果遇到问题，请：

1. 查看控制台日志
2. 使用测试工具验证配置
3. 检查网络连接和API状态
4. 参考Dify官方文档

---

**注意**: 这个集成是为启明星教育平台定制的，包含了特定的业务逻辑和配置。在其他项目中使用时，请根据实际需求调整配置和代码。