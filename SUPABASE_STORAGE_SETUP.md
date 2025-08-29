# Supabase Storage 设置指南

## 🎯 概述
本项目已经完全集成了 Supabase Storage 文件存储服务。文件不再存储在本地文件系统中，而是存储在 Supabase 的云端存储中，与数据库深度集成。

## 📋 设置步骤

### 1. 数据库架构更新
运行以下 SQL 脚本来更新数据库架构：

```sql
-- 在 Supabase SQL 编辑器中执行
-- 文件路径: database/supabase-storage-setup.sql
```

### 2. 创建存储桶 (Buckets)
在 Supabase Dashboard 中创建以下存储桶：

#### 用户文件桶 (user-files)
- **ID**: `user-files`
- **Public**: `false`
- **File size limit**: `10MB`
- **Allowed MIME types**: 图片、PDF、文本文件

#### 聊天文件桶 (chat-files)
- **ID**: `chat-files`
- **Public**: `false`
- **File size limit**: `10MB`
- **Allowed MIME types**: 文档、图片、文本文件

#### OKR文件桶 (okr-files)
- **ID**: `okr-files`
- **Public**: `false`
- **File size limit**: `10MB`
- **Allowed MIME types**: 文档、表格、图片

#### 作业文件桶 (assignment-files)
- **ID**: `assignment-files`
- **Public**: `false`
- **File size limit**: `50MB`
- **Allowed MIME types**: 全部文档类型 + ZIP

### 3. 配置环境变量
确保在 `.env.local` 中配置了以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 权限策略 (RLS)
系统已自动配置了以下权限策略：

- **用户权限**: 用户只能访问自己上传的文件
- **教师权限**: 教师可以查看学生的 OKR 和作业文件
- **管理员权限**: 管理员可以访问所有文件
- **共享权限**: 支持文件分享给其他用户

## 🗂️ 存储结构

### 文件路径格式
```
{bucket_id}/{user_id}/{timestamp}_{filename}
```

例如：
```
chat-files/12345678-1234-1234-1234-123456789012/1672531200000_document.pdf
```

### 数据库表结构
主要的 `file_attachments` 表字段：

- `id`: 文件唯一标识符
- `original_name`: 原始文件名
- `stored_name`: 存储文件名
- `storage_bucket`: 存储桶名称
- `storage_path`: 存储路径
- `public_url`: 公共访问URL
- `file_size`: 文件大小
- `mime_type`: MIME类型
- `uploaded_by`: 上传用户ID
- `category`: 文件类别
- `status`: 文件状态 (active/archived/deleted)
- `access_level`: 访问级别 (private/shared/public)

## 🔧 API 端点

### 文件上传
```
POST /api/files/upload
Content-Type: multipart/form-data

参数:
- file: 文件对象
- userId: 用户ID
- category: 文件类别 (chat/okr/assignment/profile等)
- chatSessionId: (可选) 聊天会话ID
- okrId: (可选) OKR目标ID
```

### 文件查看/下载
```
GET /api/files/view/{fileId}

返回文件内容或重定向到公共URL
```

### 文件列表
```
GET /api/files/list?userId={userId}&category={category}

返回用户的文件列表
```

### 文件删除
```
DELETE /api/files/view/{fileId}

软删除文件（更新状态为deleted）
```

## 🛡️ 安全特性

### 1. 行级安全 (RLS)
- 自动基于用户身份验证进行权限控制
- 防止用户访问其他人的私有文件

### 2. 文件类型验证
- 服务器端验证允许的MIME类型
- 防止恶意文件上传

### 3. 文件大小限制
- 不同类别的文件有不同的大小限制
- 作业文件最大50MB，其他文件最大10MB

### 4. 路径安全
- 文件名自动清理，防止路径遍历攻击
- 使用UUID作为文件标识符

## 📊 监控和维护

### 存储使用量查询
```sql
SELECT get_user_storage_usage('user_uuid');
```

### 清理孤立文件
```sql
SELECT cleanup_orphaned_storage_files();
```

## 🔄 迁移指南

如果你之前使用的是本地文件存储，需要：

1. 运行数据库架构更新脚本
2. 在 Supabase Dashboard 中创建存储桶
3. 重新部署应用程序
4. (可选) 迁移现有文件到 Supabase Storage

## ⚠️ 注意事项

1. **Service Role Key**: 确保 `SUPABASE_SERVICE_ROLE_KEY` 环境变量安全配置，不要暴露给客户端
2. **存储配额**: 注意 Supabase 的存储配额限制
3. **备份策略**: 考虑设置自动备份策略
4. **CDN**: 对于频繁访问的文件，考虑启用 CDN 加速

## 🎉 优势

- ✅ **可扩展性**: 云端存储，无需担心服务器存储空间
- ✅ **高可用性**: Supabase 提供高可用的文件存储服务
- ✅ **权限控制**: 细粒度的访问权限控制
- ✅ **备份恢复**: 自动备份和恢复机制
- ✅ **全球CDN**: 文件访问速度更快
- ✅ **数据一致性**: 文件元数据和实际文件保持一致