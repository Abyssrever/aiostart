# Vercel 部署指南

## 环境变量配置

在 Vercel 项目设置中，需要配置以下环境变量：

### 必需的环境变量

1. **NEXT_PUBLIC_SUPABASE_URL**
   - 值：`https://sxhfiadommaopzoigtbz.supabase.co`
   - 描述：Supabase 项目 URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - 值：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDAzMDcsImV4cCI6MjA3MTMxNjMwN30.XuGU_SfH185ZVSqZwEtPaIPZv_nPnNHRtJPzkWnVgBc`
   - 描述：Supabase 匿名访问密钥

## 配置步骤

### 1. 在 Vercel Dashboard 中配置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加上述两个环境变量：
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://sxhfiadommaopzoigtbz.supabase.co`
   - Environment: `Production`, `Preview`, `Development` (全选)
   
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aGZpYWRvbW1hb3B6b2lndGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NDAzMDcsImV4cCI6MjA3MTMxNjMwN30.XuGU_SfH185ZVSqZwEtPaIPZv_nPnNHRtJPzkWnVgBc`
   - Environment: `Production`, `Preview`, `Development` (全选)

### 2. 重新部署

配置环境变量后，需要重新部署项目：

1. 在 Vercel Dashboard 中，进入 **Deployments** 页面
2. 点击最新部署旁边的三个点菜单
3. 选择 **Redeploy**
4. 确认重新部署

### 3. 验证部署

部署完成后，访问你的 Vercel 应用 URL，确认：

- ✅ 页面正常加载
- ✅ 登录功能正常工作
- ✅ 数据库连接正常
- ✅ 角色跳转功能正常

## 测试账户

部署成功后，可以使用以下测试账户验证功能：

- **学生账户：** `1956094526@qq.com` (验证码: `123456`)
- **教师账户：** `teacher@example.com` (验证码: `123456`)
- **管理员账户：** `admin@example.com` (验证码: `123456`)

## 故障排除

### 如果仍然出现 Supabase 错误：

1. **检查环境变量名称**：确保变量名完全正确，包括 `NEXT_PUBLIC_` 前缀
2. **检查环境变量值**：确保没有多余的空格或换行符
3. **检查环境范围**：确保环境变量应用到了 Production 环境
4. **清除构建缓存**：在重新部署时选择 "Clear cache and deploy"

### 如果页面无法访问：

1. 检查 Vercel 部署日志中的错误信息
2. 确认所有必需的依赖都已正确安装
3. 检查 Next.js 配置是否正确

## 联系支持

如果遇到问题，请检查：
1. Vercel 部署日志
2. 浏览器开发者工具控制台
3. Supabase 项目状态

---

**注意：** 这些是生产环境的真实 API 密钥，请妥善保管，不要在公开场所分享。