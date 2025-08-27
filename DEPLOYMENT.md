# 启明星平台 Vercel 部署指南

## 🚀 快速部署

### 1. 准备工作

确保您已经：
- 将代码推送到 GitHub 仓库
- 拥有 Vercel 账户
- 项目已经在本地测试通过

### 2. 部署步骤

#### 方法一：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入您的 GitHub 仓库：`https://github.com/Abyssrever/AIO`
4. 选择 `qiming-star-prototype` 目录作为根目录
5. 配置环境变量（见下方配置）
6. 点击 "Deploy"

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目根目录执行部署
vercel

# 生产环境部署
vercel --prod
```

### 3. 环境变量配置

在 Vercel Dashboard 的项目设置中添加以下环境变量：

#### 必需的环境变量
```
NEXT_PUBLIC_APP_NAME=启明星平台
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
```

#### 可选的环境变量
```
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

#### 如果使用外部服务，添加相应的 API 密钥
```
OPENAI_API_KEY=your-openai-api-key
NEXTAUTH_SECRET=your-nextauth-secret
DATABASE_URL=your-database-url
```

### 4. 域名配置

部署成功后，Vercel 会自动分配一个域名，格式如：
```
https://qiming-star-platform-xxx.vercel.app
```

如需自定义域名：
1. 在项目设置中点击 "Domains"
2. 添加您的自定义域名
3. 按照提示配置 DNS 记录

### 5. 自动部署

配置完成后，每次推送到 `main` 分支都会自动触发部署。

### 6. 性能优化

项目已配置：
- 静态资源缓存（1年）
- 安全头部设置
- 函数超时设置（30秒）
- 路由重写和重定向

### 7. 监控和日志

- 在 Vercel Dashboard 中查看部署日志
- 使用 Vercel Analytics 监控性能
- 配置 Sentry 进行错误监控（可选）

### 8. 故障排除

#### 常见问题

1. **构建失败**
   - 检查 `package.json` 中的依赖版本
   - 确保所有必需的环境变量已设置

2. **页面 404**
   - 检查 `vercel.json` 中的路由配置
   - 确保文件路径正确

3. **API 路由不工作**
   - 检查 API 路由文件位置
   - 确认函数配置正确

#### 调试命令

```bash
# 本地预览生产构建
npm run build
npm run start

# 检查构建输出
vercel build

# 查看部署日志
vercel logs
```

### 9. 更新部署

```bash
# 推送更新到 GitHub
git add .
git commit -m "update: 功能更新"
git push origin main

# Vercel 会自动检测并重新部署
```

## 📞 支持

如遇到部署问题，请检查：
- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- 项目 GitHub Issues

---

**注意**：首次部署可能需要 2-5 分钟，后续更新通常在 1-2 分钟内完成。