# Render 部署指南

## 📦 项目信息

- **项目名称**: TML Villa - 泰国民宿预订平台
- **域名**: https://tml-villa.onrender.com
- **部署平台**: Render (https://render.com)

---

## 🚀 快速部署步骤

### 前提条件

1. ✅ GitHub 账号
2. ✅ Render 账号（使用 GitHub 登录）
3. ✅ 项目代码已推送到 GitHub

---

## 步骤 1: 准备 GitHub 仓库

```bash
# 1. 初始化 Git（如果还没有）
git init

# 2. 添加所有文件
git add .

# 3. 提交更改
git commit -m "准备部署到 Render"

# 4. 添加远程仓库
git remote add origin https://github.com/yourusername/tml-villa.git

# 5. 推送到 GitHub
git push -u origin main
```

---

## 步骤 2: 在 Render 创建数据库

### 2.1 登录 Render

访问 https://dashboard.render.com/

### 2.2 创建 PostgreSQL 数据库

1. 点击 **"New"** → **"PostgreSQL"**
2. 填写信息：
   - **Name**: `tml-villa-db`
   - **Database**: `tml_villa`
   - **User**: `tml_villa_user`
   - **Region**: `Singapore` (东南亚)
   - **Plan**: `Free`
3. 点击 **"Create Database"**
4. 等待数据库创建完成（约 2-3 分钟）
5. 复制 **Internal Database URL** 和 **External Database URL**

---

## 步骤 3: 部署后端服务

### 3.1 创建 Web Service

1. 点击 **"New"** → **"Web Service"**
2. 连接 GitHub 仓库
3. 选择 `tml-villa` 仓库

### 3.2 配置后端服务

填写以下信息：

**基本信息**：
- **Name**: `tml-villa-backend`
- **Region**: `Singapore`
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

**环境变量**：

点击 **"Advanced"** → **"Add Environment Variable"**，添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `10000` | 端口号 |
| `JWT_SECRET` | *点击 Generate 生成* | JWT 密钥（自动生成） |
| `JWT_EXPIRES_IN` | `24h` | Token 过期时间 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh Token 过期时间 |
| `DATABASE_URL` | *从数据库复制* | 内部数据库 URL |
| `DIRECT_DATABASE_URL` | *从数据库复制* | 外部数据库 URL |
| `ALLOWED_ORIGINS` | `https://tml-villa.onrender.com` | 允许的前端域名 |
| `FRONTEND_URL` | `https://tml-villa.onrender.com` | 前端 URL |

### 3.3 部署后端

1. 点击 **"Create Web Service"**
2. 等待构建完成（约 5-10 分钟）
3. 记录后端 URL: `https://tml-villa-backend.onrender.com`

---

## 步骤 4: 部署前端服务

### 4.1 创建 Static Site

1. 点击 **"New"** → **"Static Site"**
2. 连接 GitHub 仓库
3. 选择 `tml-villa` 仓库

### 4.2 配置前端服务

填写以下信息：

**基本信息**：
- **Name**: `tml-villa-frontend`
- **Region**: `Singapore`
- **Branch**: `main`
- **Root Directory**: `app`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Plan**: `Free`

**环境变量**：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `VITE_API_BASE_URL` | `https://tml-villa-backend.onrender.com/api` | 后端 API 地址 |

### 4.3 配置路由重定向

在 **"Advanced"** → **"Rewrites and Redirects"**：

- **Source**: `/*`
- **Destination**: `/index.html`
- **Action**: `Rewrite`

### 4.4 配置响应头

在 **"Advanced"** → **"Headers"**：

| Path | Name | Value |
|------|------|-------|
| `/*` | `X-Frame-Options` | `DENY` |
| `/*` | `X-XSS-Protection` | `1; mode=block` |
| `/*` | `X-Content-Type-Options` | `nosniff` |
| `/assets/*` | `Cache-Control` | `public, max-age=31536000, immutable` |

### 4.5 部署前端

1. 点击 **"Create Static Site"**
2. 等待构建完成（约 3-5 分钟）
3. 访问: `https://tml-villa.onrender.com`

---

## 步骤 5: 初始化数据库

### 5.1 连接到生产数据库

在 Render 后端服务页面：

1. 点击 **"Shell"** 标签
2. 运行 Prisma 迁移：

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# （可选）填充初始数据
npx prisma db seed
```

### 5.2 验证数据库

```bash
# 查看数据库状态
npx prisma studio
```

---

## 📝 环境变量清单

### 后端必需环境变量

```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=<自动生成或手动设置强密码>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL=<从 Render 数据库复制>
DIRECT_DATABASE_URL=<从 Render 数据库复制>
ALLOWED_ORIGINS=https://tml-villa.onrender.com
FRONTEND_URL=https://tml-villa.onrender.com
```

### 前端必需环境变量

```bash
NODE_ENV=production
VITE_API_BASE_URL=https://tml-villa-backend.onrender.com/api
```

---

## 🔧 常见问题解决

### 问题 1: 构建失败

**症状**: 前端构建报错

**解决方案**:
```bash
# 本地测试构建
cd app
npm install
npm run build

# 检查是否有 TypeScript 错误
npm run type-check
```

### 问题 2: API 请求失败

**症状**: 前端无法连接后端 API

**解决方案**:
1. 检查 `VITE_API_BASE_URL` 环境变量是否正确
2. 检查后端 CORS 配置中的 `ALLOWED_ORIGINS`
3. 检查后端服务是否正常运行

### 问题 3: 数据库连接失败

**症状**: 后端无法连接数据库

**解决方案**:
1. 检查 `DATABASE_URL` 格式是否正确
2. 确认数据库已创建并运行
3. 检查数据库用户权限

### 问题 4: 页面 404 错误

**症状**: 刷新页面显示 404

**解决方案**:
确保配置了重定向规则：
- **Source**: `/*`
- **Destination**: `/index.html`

---

## 🔄 更新部署

### 自动部署

每次推送到 `main` 分支，Render 会自动重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 手动部署

在 Render Dashboard：
1. 选择服务
2. 点击 **"Manual Deploy"**
3. 选择分支
4. 点击 **"Deploy"**

---

## 📊 监控与日志

### 查看日志

1. 在 Render Dashboard 选择服务
2. 点击 **"Logs"** 标签
3. 实时查看应用日志

### 监控服务状态

- **Free Plan**: 
  - 服务在 15 分钟无活动后会休眠
  - 首次访问可能需要 30-60 秒唤醒

- **升级到付费计划**:
  - 无休眠时间
  - 更好的性能
  - 自定义域名

---

## 🔐 安全建议

### 1. JWT Secret

```bash
# 生成强密码
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

将生成的密钥设置到 `JWT_SECRET` 环境变量。

### 2. 数据库访问

- 只使用内部数据库 URL（`DATABASE_URL`）
- 限制外部访问（仅用于调试时使用 `DIRECT_DATABASE_URL`）

### 3. CORS 配置

确保 `ALLOWED_ORIGINS` 只包含您的域名：

```bash
ALLOWED_ORIGINS=https://tml-villa.onrender.com
```

---

## 💰 成本估算

### Free Plan

- **静态站点**: 免费
- **Web Service**: 免费（有限制）
- **PostgreSQL**: 免费（1GB 存储）
- **总计**: **$0/月**

### 升级选项

- **Starter Plan**: $7/月
  - 无休眠
  - 更好的性能
  - 自定义域名

---

## 📞 获取帮助

- **Render 文档**: https://render.com/docs
- **社区支持**: https://community.render.com
- **状态页面**: https://status.render.com

---

## ✅ 部署检查清单

部署前确认：

- [ ] 所有代码已提交到 GitHub
- [ ] 环境变量已正确配置
- [ ] 数据库已创建
- [ ] 后端服务已部署并正常运行
- [ ] 前端服务已部署
- [ ] 路由重定向已配置
- [ ] 安全响应头已配置
- [ ] 数据库迁移已执行

部署后验证：

- [ ] 访问 `https://tml-villa.onrender.com` 正常加载
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] API 请求正常
- [ ] 搜索功能正常
- [ ] 页面刷新不会 404

---

**部署完成后，您的应用将可在以下地址访问**：

🏠 **前端**: https://tml-villa.onrender.com  
🔧 **后端**: https://tml-villa-backend.onrender.com  
🏥 **健康检查**: https://tml-villa-backend.onrender.com/api/health

---

**最后更新**: 2026-03-06
