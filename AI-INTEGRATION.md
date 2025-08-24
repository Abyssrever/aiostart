# 启明星AI智慧教育平台 - AI集成文档

## 📋 项目状态

✅ **已完成功能**
- TypeScript编译错误修复
- AI对话功能数据库集成
- OKR管理组件完整实现
- Supabase数据库连接配置
- 构建测试通过

## 🤖 AI服务接口设计

### 架构概览
项目已预留标准化的AI服务接口，支持多种AI服务提供商：
- **N8N工作流** (推荐)
- **Zapier**
- **OpenAI API**
- **Claude API**
- **自定义API**

### 核心文件
```
src/lib/
├── ai-config.ts          # AI服务配置
├── ai-service-manager.ts # AI服务管理器
├── chat-service.ts       # 聊天服务（已集成AI接口）
└── supabase.ts          # 数据库配置
```

### AI请求数据格式
```typescript
interface AIRequest {
  message: string
  userId?: string
  sessionId?: string
  sessionType?: 'general' | 'okr_planning' | 'study_help' | 'career_guidance'
  userProfile?: {
    name?: string
    role?: string
    grade?: string
    major?: string
  }
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  metadata?: {
    platform: string
    timestamp: string
  }
}
```

### AI响应数据格式
```typescript
interface AIResponse {
  content: string        // AI回复内容
  tokensUsed?: number   // 使用的token数量
  responseTime?: number // 响应时间(ms)
  confidence?: number   // 置信度(0-1)
  suggestions?: string[] // 建议回复
  metadata?: any        // 附加元数据
}
```

## 🔗 N8N工作流集成步骤

### 1. 创建N8N工作流
1. 新建工作流
2. 添加Webhook触发器节点
3. 配置AI处理节点（OpenAI/Claude/其他）
4. 添加响应节点

### 2. 环境变量配置
在`.env.local`中添加：
```bash
# AI服务配置
AI_PROVIDER=n8n
AI_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ai-chat
N8N_API_KEY=your_n8n_api_key
AI_TIMEOUT=30000
```

### 3. N8N工作流示例节点配置

**Webhook节点 (触发器)**
- HTTP Method: POST
- Authentication: API Key (可选)

**AI处理节点 (OpenAI/Claude)**
- 输入: `{{ $json.message }}`
- 系统提示: 根据`{{ $json.sessionType }}`动态设置
- 对话历史: `{{ $json.conversationHistory }}`

**响应节点**
```json
{
  "response": "{{ $json.choices[0].message.content }}",
  "tokensUsed": "{{ $json.usage.total_tokens }}",
  "confidence": 0.95,
  "metadata": {
    "model": "{{ $json.model }}",
    "processingTime": "{{ $now }}"
  }
}
```

## 🛠️ 接入其他AI服务

### OpenAI API
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your_api_key
AI_MODEL=gpt-3.5-turbo
```

### Claude API
```bash
AI_PROVIDER=claude
CLAUDE_API_KEY=your_claude_api_key
```

### 自定义API
```bash
AI_PROVIDER=custom
AI_API_ENDPOINT=https://your-api.com/chat
AI_API_KEY=your_api_key
```

## 📊 会话类型专门化

系统支持4种专门的AI助手：

1. **general** - 通用AI助手
2. **okr_planning** - OKR规划专家
3. **study_help** - 学习辅导AI
4. **career_guidance** - 职业规划顾问

每种类型都有专门的系统提示和模型配置。

## 🔄 降级机制

如果AI服务不可用，系统会自动降级到本地简单回复逻辑，确保用户体验。

## 🧪 测试与监控

### 健康检查
AI服务管理器提供健康检查功能：
```typescript
const aiManager = AIServiceManager.getInstance()
const isHealthy = await aiManager.healthCheck()
```

### 状态监控
- `AVAILABLE` - 服务可用
- `BUSY` - 服务繁忙
- `ERROR` - 服务错误
- `MAINTENANCE` - 维护中

## 🚀 部署建议

1. **开发环境**: 使用本地N8N实例
2. **生产环境**: 使用云端N8N或直接调用AI API
3. **监控**: 设置响应时间和错误率监控
4. **缓存**: 考虑为常见问题添加缓存机制

## 📝 下一步工作

1. 配置N8N工作流
2. 测试AI服务集成
3. 优化提示词和响应质量
4. 添加用户反馈机制
5. 实现AI回复的缓存策略

## 🔧 故障排除

### 常见问题
1. **连接超时**: 检查`AI_TIMEOUT`设置
2. **认证失败**: 验证API密钥
3. **响应格式错误**: 检查AI服务返回格式
4. **服务不可用**: 查看降级逻辑是否正常工作

### 调试命令
```bash
# 测试数据库连接
node scripts/test-db-connection.js

# 构建项目
npm run build

# 启动开发服务器
npm run dev
```

---

*此文档会随着AI服务的接入和优化持续更新*