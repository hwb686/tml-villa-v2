# TML Villa - Render 部署指南

## 概述

本文档介绍如何将 TML Villa 项目部署到 Render 平台。

**部署架构：**
- **前端**: Render Static Site（静态站点）
- **后端**: Render Web Service（Node.js）
- **数据库**: Supabase PostgreSQL（外部托管）

---

## 部署前准备

### 1. 确保本地代码已提交到 Git

```bash
git add .
git commit -m "修复 Render 部署配置"
git push origin main
```

### 2. 准备 Supabase 数据库连接信息

登录 [Supabase Dashboard](https://supabase.com/dashboard) 获取以下信息：

- **DATABASE_URL**: Transaction Pooler 连接字符串
  - 格式：`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5`
  
- **DIRECT_DATABASE_URL**: Session Pooler 连接字符串
  - 格式：`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

- **SUPABASE_URL**: 项目 URL
  - 格式：`https://[project-ref].supabase.co`

- **SUPABASE_SERVICE_ROLE_KEY**: Service Role Key（用于后端）
- **SUPABASE_ANON_KEY**: Anon Key（用于前端）

---

## 部署方式一：使用 Blueprint 一键部署（推荐）

### 步骤 1: 登录 Render Dashboard

访问 [Render Dashboard](https://dashboard.render.com/)

### 步骤 2: 创建 Blueprint 实例

1. 点击 **"New +"** → **"Blueprint"**
2. 选择你的 GitHub 仓库：`tml-villa`
3. Render 会自动检测到 `render.yaml` 文件
4. 点击 **"Apply"**

### 步骤 3: 配置环境变量

部署创建后，需要为每个服务配置环境变量：

#### 后端服务 (tml-villa-backend)

进入服务设置 → Environment，添加以下变量：

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Supabase Transaction Pooler URL |
| `DIRECT_DATABASE_URL` | `postgresql://...` | Supabase Session Pooler URL |
| `SUPABASE_URL` | `https://...supabase.co` | Supabase 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Supabase Service Role Key |

注意：
- `JWT_SECRET` 会自动生成，无需手动设置
- `JWT_EXPIRES_IN` 默认为 24h
- `JWT_REFRESH_EXPIRES_IN` 默认为 7d

#### 前端服务 (tml-villa-frontend)

进入服务设置 → Environment，添加以下变量：

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_SUPABASE_URL` | `https://...supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Supabase Anon Key |

注意：
- `VITE_API_BASE_URL` 已在 `render.yaml` 中预设为 `https://tml-villa-backend.onrender.com/api`

### 步骤 4: 运行数据库迁移

首次部署时，需要手动运行数据库迁移：

```bash
# 在本地运行（需要 DATABASE_URL 环境变量）
cd backend
npx prisma migrate deploy
```

或者使用 Supabase Dashboard 的 SQL 编辑器执行迁移。

### 步骤 5: 验证部署

1. 访问前端 URL：`https://tml-villa-frontend.onrender.com`
2. 访问后端健康检查：`https://tml-villa-backend.onrender.com/api/health`
   - 应返回：`{"code":200,"msg":"OK","timestamp":"..."}`
3. 测试登录功能

---

## 部署方式二：手动创建服务

如果你不想使用 Blueprint，可以手动创建服务：

### 创建后端服务

1. 点击 **"New +"** → **"Web Service"**
2. 选择 GitHub 仓库
3. 配置：
   - **Name**: `tml-villa-backend`
   - **Region**: `Singapore` (或离你最近的区域)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. 选择 **Free** 计划（或更高）
5. 添加环境变量（同上）
6. 点击 **"Create Web Service"**

### 创建前端服务

1. 点击 **"New +"** → **"Static Site"**
2. 选择 GitHub 仓库
3. 配置：
   - **Name**: `tml-villa-frontend`
   - **Branch**: `main`
   - **Root Directory**: (留空，根目录)
   - **Build Command**: `cd app && npm install && npm run build`
   - **Publish Directory**: `app/dist`
4. 添加环境变量：
   - `VITE_API_BASE_URL`: `https://tml-villa-backend.onrender.com/api`
   - `VITE_SUPABASE_URL`: 你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key
5. 点击 **"Create Static Site"**

---

## 配置自定义域名（可选）

### 前端自定义域名

1. 进入 `tml-villa-frontend` 服务
2. 点击 **"Settings"** → **"Custom Domains"**
3. 点击 **"Add Custom Domain"**
4. 输入你的域名，例如：`www.tml-villa.com`
5. 按照 Render 提供的 DNS 配置说明，在你的域名注册商处添加 CNAME 记录

### 后端自定义域名

1. 进入 `tml-villa-backend` 服务
2. 点击 **"Settings"** → **"Custom Domains"**
3. 添加域名，例如：`api.tml-villa.com`
4. 更新前端环境变量 `VITE_API_BASE_URL` 为新的自定义域名

---

## 常见问题和故障排除

### 1. 部署失败："Port not opening"

**原因**: 应用没有监听 Render 提供的 `PORT` 环境变量

**解决**: 检查 `backend/api/app.js` 是否正确使用 `process.env.PORT`：
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. 数据库连接失败

**原因**: 数据库连接字符串错误或 IP 白名单限制

**解决**: 
- 检查 `DATABASE_URL` 和 `DIRECT_DATABASE_URL` 是否正确
- 在 Supabase Dashboard 中，确保允许 Render 的 IP 访问

### 3. 前端刷新后 404

**原因**: 单页应用需要配置 rewrite 规则

**解决**: `render.yaml` 中已配置：
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### 4. CORS 错误

**原因**: 后端 CORS 配置不允许前端域名

**解决**: 检查后端环境变量 `ALLOWED_ORIGINS` 是否包含前端 URL

### 5. 数据库迁移失败

**原因**: 迁移文件不存在或数据库状态不一致

**解决**:
```bash
# 本地运行迁移
cd backend
npx prisma migrate deploy

# 或重置数据库（慎用！会丢失数据）
npx prisma migrate reset
```

---

## 更新部署

### 自动部署

Render 默认会在每次推送到 `main` 分支时自动重新部署。

### 禁用自动部署

如果你不想每次推送都自动部署：

1. 进入服务设置
2. 找到 **"Auto-Deploy"** 选项
3. 选择 **"No"**（改为手动部署）

### 手动部署

1. 进入服务页面
2. 点击 **"Manual Deploy"** → **"Deploy latest commit"**

---

## 监控和日志

### 查看日志

1. 进入服务页面
2. 点击 **"Logs"** 标签
3. 可以看到实时日志和历史日志

### 设置告警（付费功能）

1. 进入服务设置
2. 配置 **"Health Check"** 和 **"Alerting"**

---

## 相关文件

| 文件 | 说明 |
|-----|------|
| `render.yaml` | Render Blueprint 配置（前后端） |
| `backend/render.yaml` | 后端单独配置 |
| `backend/package.json` | 后端依赖和脚本 |
| `app/package.json` | 前端依赖和脚本 |
| `netlify.toml` | Netlify 配置（如保留 Netlify 部署） |

---

## 参考链接

- [Render Blueprint 文档](https://render.com/docs/blueprint-spec)
- [Render 环境变量](https://render.com/docs/configure-environment-variables)
- [Render 自定义域名](https://render.com/docs/custom-domains)
- [Supabase 连接字符串](https://supabase.com/docs/guides/database/connecting-to-postgres)

---

## 部署检查清单

部署前请确认：

- [ ] 所有代码已推送到 GitHub
- [ ] Supabase 数据库已创建并可以连接
- [ ] 环境变量已正确配置
- [ ] 本地测试通过 (`npm run dev`)
- [ ] 数据库迁移文件已生成 (`npx prisma migrate dev`)
- [ ] 前端构建成功 (`cd app && npm run build`)

部署后请确认：

- [ ] 前端页面可以访问
- [ ] 后端健康检查返回 200
- [ ] 登录功能正常
- [ ] 数据库读写正常
