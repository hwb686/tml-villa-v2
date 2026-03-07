# Supabase + Render 部署指南

## 📦 项目信息

- **项目名称**: TML Villa - 泰国民宿预订平台
- **域名**: https://tml-villa.onrender.com
- **数据库**: Supabase PostgreSQL
- **后端部署**: Render (https://render.com)
- **前端部署**: Render Static Site

---

## 🚀 快速部署步骤

### 前提条件

1. ✅ GitHub 账号
2. ✅ Render 账号（使用 GitHub 登录）
3. ✅ Supabase 账号（使用 GitHub 登录）
4. ✅ 项目代码已推送到 GitHub
5. ✅ Render CLI 和 Supabase CLI 已安装

---

## 步骤 1: 安装 CLI 工具

### 安装 Render CLI

```bash
# macOS
brew tap render-oss/tap
brew install render

# 或使用安装脚本
curl -fsSL https://raw.githubusercontent.com/render-oss/cli/main/bin/install.sh | bash

# 验证安装
render --version
```

### 安装 Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# 验证安装
supabase --version
```

---

## 步骤 2: 配置 Supabase 项目

### 2.1 创建 Supabase 项目

1. 访问 https://supabase.com/dashboard
2. 点击 **"New Project"**
3. 填写信息：
   - **Organization**: 选择或创建组织
   - **Project Name**: `tml-villa`
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: `Southeast Asia (Singapore)`
4. 点击 **"Create New Project"**
5. 等待项目创建完成（约 2-3 分钟）

### 2.2 获取数据库连接信息

在项目 Dashboard 中：

1. 点击左侧菜单 **"Project Settings"** → **"Database"**
2. 找到 **"Connection string"** 部分
3. 复制 **URI** 格式的连接字符串

连接字符串格式：
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 2.3 配置 Prisma 连接池（推荐）

Supabase 推荐使用 PgBouncer 连接池：

```bash
# 数据库连接 URL（用于应用程序 - 使用连接池）
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"

# 直接连接 URL（用于 Prisma Migrate）
DIRECT_DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 2.4 获取 Supabase API 密钥

在 Supabase Dashboard：

1. 点击左侧菜单 **"Project Settings"** → **"API"**
2. 复制以下信息：
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public**: 用于前端
   - **service_role secret**: 用于后端（⚠️ 保密！）

---

## 步骤 3: 初始化本地 Supabase 项目

```bash
# 在项目根目录初始化 Supabase
supabase init

# 登录 Supabase
supabase login

# 链接到远程项目
supabase link --project-ref [your-project-ref]

# 推送数据库架构到 Supabase
supabase db push
```

### 使用 Prisma 迁移（替代方案）

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 数据库连接信息

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库架构
npx prisma db push

# 填充种子数据
npx prisma db seed
```

---

## 步骤 4: 使用 Render CLI 部署

### 4.1 登录 Render

```bash
# 登录 Render
render login

# 验证登录状态
render whoami
```

### 4.2 使用 Blueprint 部署

```bash
# 在项目根目录执行
render blueprint launch

# 或指定 blueprint 文件
render blueprint launch --file render-blueprint.yaml
```

### 4.3 配置环境变量

部署后需要在 Render Dashboard 手动设置以下环境变量：

#### 后端服务环境变量

| Key | Value | 来源 |
|-----|-------|------|
| `DATABASE_URL` | 连接池 URL | Supabase Dashboard → Database |
| `DIRECT_DATABASE_URL` | 直接连接 URL | Supabase Dashboard → Database |
| `SUPABASE_URL` | `https://[project-ref].supabase.co` | Supabase Dashboard → API |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | Supabase Dashboard → API |
| `JWT_SECRET` | *点击 Generate 生成* | Render 自动生成 |

#### 前端服务环境变量

| Key | Value | 来源 |
|-----|-------|------|
| `VITE_API_BASE_URL` | `https://tml-villa-backend.onrender.com/api` | Render 后端服务 URL |
| `VITE_SUPABASE_URL` | `https://[project-ref].supabase.co` | Supabase Dashboard → API |
| `VITE_SUPABASE_ANON_KEY` | anon key | Supabase Dashboard → API |

---

## 步骤 5: 手动部署（不使用 Blueprint）

### 5.1 创建后端服务

```bash
# 创建 Web Service
render services create web \
  --name tml-villa-backend \
  --region singapore \
  --branch main \
  --root-directory backend \
  --build-command "npm install" \
  --start-command "npm start" \
  --env-var NODE_ENV=production \
  --env-var PORT=10000 \
  --env-var JWT_SECRET=<generated> \
  --env-var ALLOWED_ORIGINS=https://tml-villa.onrender.com
```

### 5.2 创建前端服务

```bash
# 创建 Static Site
render services create static \
  --name tml-villa-frontend \
  --region singapore \
  --branch main \
  --root-directory app \
  --build-command "npm install && npm run build" \
  --publish-directory dist \
  --env-var NODE_ENV=production \
  --env-var VITE_API_BASE_URL=https://tml-villa-backend.onrender.com/api
```

---

## 步骤 6: 数据库迁移

### 方法 1：使用 Supabase CLI

```bash
# 推送本地数据库变更到 Supabase
supabase db push

# 查看迁移状态
supabase migration list
```

### 方法 2：使用 Prisma（推荐）

```bash
cd backend

# 生成迁移文件
npx prisma migrate dev --name init

# 部署迁移到 Supabase
npx prisma migrate deploy

# 填充种子数据
npx prisma db seed
```

### 方法 3：使用 Render Shell

在 Render Dashboard：

1. 选择 `tml-villa-backend` 服务
2. 点击 **"Shell"** 标签
3. 运行迁移命令：

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 填充种子数据
npx prisma db seed
```

---

## 步骤 7: 验证部署

### 使用 CLI 验证

```bash
# 查看服务状态
render services list

# 查看服务日志
render logs --service tml-villa-backend
render logs --service tml-villa-frontend

# 重启服务
render services restart --name tml-villa-backend
```

### 浏览器验证

访问以下地址验证：

- 🏠 **前端**: https://tml-villa.onrender.com
- 🔧 **后端**: https://tml-villa-backend.onrender.com
- 🏥 **健康检查**: https://tml-villa-backend.onrender.com/api/health

---

## 📝 环境变量完整清单

### Supabase 环境变量

```bash
# Supabase 项目配置
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 数据库连接
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
DIRECT_DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### Render 后端环境变量

```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=<64位随机字符串>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://tml-villa.onrender.com
FRONTEND_URL=https://tml-villa.onrender.com
```

### Render 前端环境变量

```bash
NODE_ENV=production
VITE_API_BASE_URL=https://tml-villa-backend.onrender.com/api
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔧 常用 CLI 命令

### Render CLI

```bash
# 登录
render login

# 查看服务列表
render services list

# 查看服务详情
render services describe --name tml-villa-backend

# 查看日志
render logs --service tml-villa-backend --follow

# 重启服务
render services restart --name tml-villa-backend

# 更新环境变量
render env set --service tml-villa-backend KEY=value

# 打开服务 Dashboard
render dashboard --service tml-villa-backend
```

### Supabase CLI

```bash
# 登录
supabase login

# 查看项目列表
supabase projects list

# 链接项目
supabase link --project-ref [project-ref]

# 数据库迁移
supabase db push
supabase migration new [name]

# 生成类型定义
supabase gen types typescript --linked > types/supabase.ts

# 启动本地开发环境
supabase start

# 停止本地环境
supabase stop

# 查看状态
supabase status
```

---

## 🔐 安全建议

### 1. 数据库安全

- 使用 Supabase 的 Row Level Security (RLS)
- 仅通过 Prisma 访问数据库
- 定期轮换数据库密码

```sql
-- 在 Supabase SQL Editor 中启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Users can only view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id);
```

### 2. API 密钥管理

- **service_role key**: 仅用于后端，永不暴露给前端
- **anon key**: 可以安全地用于前端
- 定期轮换密钥

### 3. JWT Secret

生成强密钥：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. CORS 配置

确保 `ALLOWED_ORIGINS` 只包含您的域名：

```bash
ALLOWED_ORIGINS=https://tml-villa.onrender.com
```

---

## 🐛 常见问题解决

### 问题 1: Supabase 连接失败

**症状**: 后端无法连接 Supabase

**解决方案**:
```bash
# 1. 检查 DATABASE_URL 格式
# 必须包含 pgbouncer=true 参数

# 2. 测试连接
cd backend
npx prisma db pull

# 3. 检查 Supabase 项目状态
supabase status
```

### 问题 2: Prisma 迁移失败

**症状**: `prisma migrate deploy` 报错

**解决方案**:
```bash
# 使用直接连接 URL 运行迁移
DIRECT_DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 或重置迁移状态
npx prisma migrate resolve --rolled-back [migration-name]
npx prisma migrate deploy
```

### 问题 3: Render 服务启动失败

**症状**: 后端服务无法启动

**解决方案**:
```bash
# 查看日志
render logs --service tml-villa-backend --tail 100

# 检查环境变量
render env list --service tml-villa-backend

# 本地测试
npm run build
npm start
```

### 问题 4: 前端无法连接后端

**症状**: API 请求 404 或 CORS 错误

**解决方案**:
1. 检查 `VITE_API_BASE_URL` 环境变量
2. 检查后端 `ALLOWED_ORIGINS` 配置
3. 验证后端服务 URL 是否正确

---

## 🔄 CI/CD 自动化

### GitHub Actions 配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
      
      - name: Run Database Migrations
        run: |
          cd backend
          npx prisma migrate deploy
        env:
          DIRECT_DATABASE_URL: ${{ secrets.DIRECT_DATABASE_URL }}
```

---

## 💰 成本估算

### 免费层

| 服务 | 费用 |
|------|------|
| Supabase (Free) | $0/月 (500MB 存储, 2GB 带宽) |
| Render Web Service (Free) | $0/月 (有休眠) |
| Render Static Site | $0/月 (无限制) |
| **总计** | **$0/月** |

### 升级选项

**Supabase Pro**: $25/月
- 8GB 存储
- 100GB 带宽
- 无连接限制

**Render Starter**: $7/月
- 无休眠
- 更好的性能

---

## 📞 获取帮助

### Render
- **文档**: https://render.com/docs
- **CLI 文档**: https://render.com/docs/cli
- **社区**: https://community.render.com

### Supabase
- **文档**: https://supabase.com/docs
- **CLI 文档**: https://supabase.com/docs/guides/cli
- **社区**: https://github.com/supabase/supabase/discussions

---

## ✅ 部署检查清单

部署前确认：

- [ ] Supabase 项目已创建
- [ ] 数据库连接字符串已获取
- [ ] API 密钥已获取
- [ ] Render CLI 已登录
- [ ] Supabase CLI 已登录
- [ ] 环境变量已配置

部署步骤：

- [ ] 运行 `supabase db push` 推送数据库架构
- [ ] 运行 `render blueprint launch` 部署服务
- [ ] 在 Render Dashboard 配置环境变量
- [ ] 运行数据库迁移
- [ ] 验证前端访问正常
- [ ] 验证后端 API 正常
- [ ] 验证数据库连接正常

---

**部署完成后，您的应用将可在以下地址访问**：

🏠 **前端**: https://tml-villa.onrender.com  
🔧 **后端**: https://tml-villa-backend.onrender.com  
🗄️ **数据库**: Supabase  
🏥 **健康检查**: https://tml-villa-backend.onrender.com/api/health

---

**最后更新**: 2026-03-07
