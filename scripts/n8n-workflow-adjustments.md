# N8N工作流调整建议

基于启明星项目的实际数据库结构和代码逻辑，以下是需要在N8N工作流中调整的配置：

## 1. 输入参数处理节点调整

**当前问题：** `1-Parse-Input-Parameters`节点中使用了`userId`但后续使用`user_id`

**建议修改：** 在节点"1-Parse-Input-Parameters"的JavaScript代码中：

```javascript
// 修改前：
const userId = body.user_id;

// 修改后：
const userId = body.user_id || body.userId; // 兼容两种格式
```

## 2. 项目智慧库查询调整

**当前问题：** `Execute a SQL query pro`节点查询可能与实际数据库结构不匹配

**建议修改：** 确保查询语句匹配实际的documents表结构：

```sql
SELECT 
    content,
    title,
    document_type,
    '项目智慧库' AS source_type,
    '{{ $("1-Parse-Input-Parameters").item.json.organizationId }}' as organization_id,
    '{{ $("1-Parse-Input-Parameters").item.json.projectId }}' as project_id,
    '{{ $("1-Parse-Input-Parameters").item.json.userId }}' as user_id,
    id as document_id,
    created_at,
    updated_at
FROM documents 
WHERE project_id = $1
AND status = 'active'
ORDER BY updated_at DESC
LIMIT 10;
```

## 3. 向量搜索节点调整

**当前问题：** `supabase vector search`节点的filter配置可能不匹配

**建议配置：** 在向量搜索节点的metadata filter中：

```json
{
  "project_id": "{{ $('Merge').first().json.project_id }}",
  "status": "active"
}
```

## 4. 聊天历史存储调整

**当前问题：** `Create a row`节点的字段映射可能不完整

**建议字段映射：**
- `content`: `{{ $('1-Parse-Input-Parameters').item.json.chatInput }}`
- `ai_content`: `{{ $('6-Final-AI-Answer').item.json.output }}`
- `role`: `"user"` (用户消息) 或 `"assistant"` (AI回复)
- `agent_type`: `"project_agent"`
- `user_id`: `{{ $('1-Parse-Input-Parameters').item.json.userId }}`
- `project_id`: `{{ $('Merge').first().json.project_id }}`
- `organization_id`: `{{ $('Merge').first().json.organization_id }}`
- `created_at`: `{{ $now }}`

## 5. 特殊UUID处理逻辑

**当前问题：** 工作流使用特殊UUID但项目可能使用null值

**建议修改：** 在处理空值时，使用null而不是特殊UUID：

```javascript
// 修改前：
const EMPTY_PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const EMPTY_ORG_UUID = '00000000-0000-0000-0000-000000000000';

// 修改后：使用null值
let processedProjectId = projectId || null;
let processedOrganizationId = organizationId || null;
```

## 6. 工具节点配置优化

### get_chat_history工具
确保查询条件正确：
```sql
SELECT * FROM chat_history 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 20
```

### get_tasks工具
确保字段匹配：
```sql
SELECT * FROM tasks 
WHERE assignee_id = $1 
AND status IN ('pending', 'in_progress')
ORDER BY due_date ASC, priority DESC
```

### get_mannual工具
确保查询特定的使用手册文档：
```sql
SELECT * FROM documents 
WHERE document_type = 'manual' 
AND status = 'active'
ORDER BY updated_at DESC
```

## 7. 数据库连接配置

确保N8N中的数据库连接配置匹配您的Supabase设置：

- **Host**: 您的Supabase数据库URL
- **Database**: postgres
- **Username**: postgres
- **Password**: 您的数据库密码
- **SSL**: 启用（对于Supabase必需）

## 8. 环境变量配置

在N8N环境中设置必要的变量：

- `SUPABASE_URL`: Supabase项目URL
- `SUPABASE_SERVICE_KEY`: Service role key
- `GOOGLE_GEMINI_API_KEY`: Google Gemini API密钥

## 9. 测试数据准备

确保数据库中有测试数据：

```sql
-- 插入测试用户
INSERT INTO auth.users (id, email) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com');

-- 插入测试组织
INSERT INTO organizations (id, name, org_code) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '测试组织', 'TEST_ORG');

-- 插入测试项目
INSERT INTO projects (id, organization_id, name, project_code, owner_id) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '测试项目', 'TEST_PROJECT', '550e8400-e29b-41d4-a716-446655440000');

-- 插入测试文档
INSERT INTO documents (title, content, project_id, organization_id, user_id, document_type) VALUES 
('项目介绍', '这是一个测试项目，用于验证AI聊天功能。', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'project_info'),
('使用手册', '平台使用指南：1. 登录系统 2. 设置OKR目标 3. 与AI助手对话', null, '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'manual');
```

## 10. 调试建议

1. **逐节点测试**: 先测试每个节点是否能正常运行
2. **日志输出**: 在关键节点添加console.log输出便于调试
3. **数据验证**: 每次运行后检查数据库中的数据是否正确存储
4. **错误处理**: 添加适当的错误处理和回退机制

这些调整完成后，工作流应该能够与您的项目完美集成。