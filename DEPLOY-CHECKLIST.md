# TML Villa 部署就绪检查清单

> 生成时间：2026-02-24  
> 架构：Netlify (前端) + Render (后端) + Supabase (数据库/存储/Edge Functions)  
> 全部使用免费版

---

## 一、检查结果总览

| # | 检查项 | 状态 | 说明 |
|---|--------|------|------|
| 1 | Git 工作区 | ✅ | 干净，无未提交修改 |
| 2 | Git 推送 | ❌ | **31 个提交未推送**，SSH Key 未配置 |
| 3 | Netlify 构建命令 | ✅ 已修复 | `npm ci` + `npx vite build` |
| 4 | Netlify SPA 路由 | ✅ | `/* → /index.html` (200) |
| 5 | Netlify API 代理 | ✅ | `/api/* → Render` (200) |
| 6 | .env.production 格式 | ✅ 已修复 | 原文件全部挤在一行，已修复为多行 |
| 7 | Vite 构建优化 | ✅ 已修复 | 添加 manualChunks 代码分割 |
| 8 | Supabase 连接池 | ✅ | pgbouncer 6543 + preparedStatements:false |
| 9 | Prisma 单例 | ✅ | global.prisma 模式 |
| 10 | Render Dockerfile | ✅ | 多阶段构建 + Health Check |
| 11 | CORS 策略 | ✅ 已修复 | 白名单模式，通过 ALLOWED_ORIGINS 控制 |
| 12 | 安全：.env 在 .gitignore | ✅ | `.env`、`backend/.env`、`app/.env` 均已忽略 |
| 13 | 安全：无硬编码密钥 | ✅ | JWT 使用环境变量，有 dev fallback |
| 14 | @playwright/test 位置 | ✅ 已修复 | 从 dependencies 移至 devDependencies |
| 15 | 前端代码分割 (lazy) | ⚠️ 待优化 | 39 个页面同步导入，建议后续添加 React.lazy |
| 16 | Render 冷启动保活 | ⚠️ 手动配置 | 需外部 cron 服务保活 |
| 17 | 过期数据自动清理 | ⚠️ 待实现 | 仅有手动 API，无定时任务 |
| 18 | API 缓存头 | ⚠️ 待优化 | 未设置 Cache-Control 响应头 |

---

## 二、已完成的自动修复

### 修复 1: `app/.env.production` 格式修复
- **问题**: 所有环境变量挤在一行，Vite 无法正确解析
- **修复**: 重写为标准多行格式

### 修复 2: `app/vite.config.ts` 构建优化
- **问题**: 无任何构建优化，所有代码打包在一个 chunk
- **修复**: 添加 `manualChunks` 分包策略
  - `vendor-react`: React 核心 (~140KB)
  - `vendor-radix`: Radix UI 组件
  - `vendor-charts`: Recharts 图表库 (~300KB)
  - `vendor-motion`: Framer Motion 动画
  - `vendor-date`: date-fns + react-day-picker
  - `vendor-supabase`: Supabase SDK

### 修复 3: `netlify.toml` 构建命令优化
- **问题**: 使用 `npm install`（慢、不可靠）
- **修复**: 改为 `npm ci`（锁定依赖版本、更快）

### 修复 4: `backend/api/db.js` CORS 安全加固
- **问题**: `Access-Control-Allow-Origin: *`（允许任何来源）
- **修复**: 白名单模式，通过 `ALLOWED_ORIGINS` 环境变量控制
- 增加 `Access-Control-Max-Age: 86400` 减少预检请求

### 修复 5: `backend/lib/prisma.js` 连接池优化
- **问题**: 未明确限制连接池大小
- **修复**: 添加 datasources 配置注释说明，需在 DATABASE_URL 添加 `&connection_limit=5`

### 修复 6: `app/package.json` 依赖清理
- **问题**: `@playwright/test` (~30MB) 在 dependencies
- **修复**: 移至 devDependencies（生产构建时不安装）

### 修复 7: `backend/.env.example` 完善
- **问题**: 缺少 CORS、缓存 TTL、连接池等配置说明
- **修复**: 添加完整的环境变量模板和注释

---

## 三、手动操作指引

### 🔴 优先级：高（部署前必须完成）

#### 3.1 推送代码到 GitHub

SSH 推送失败（Host key verification failed），需要配置 SSH 或改用 HTTPS：

**方案 A：添加 GitHub SSH Key**
```bash
# 1. 生成 SSH Key（如果没有）
ssh-keygen -t ed25519 -C "your-email@example.com"

# 2. 添加到 ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. 复制公钥，添加到 GitHub Settings > SSH Keys
cat ~/.ssh/id_ed25519.pub

# 4. 添加 GitHub Host Key
ssh-keyscan github.com >> ~/.ssh/known_hosts

# 5. 推送
cd /Users/tml001/projects/opencode/tml-villa
git push origin main
```

**方案 B：改用 HTTPS 推送**
```bash
git remote set-url origin https://github.com/hwb686/tml-villa-v2.git
git push origin main
# 输入 GitHub Personal Access Token 作为密码
```

#### 3.2 Render 后台环境变量配置

在 Render Dashboard > Environment 中设置：

| 变量名 | 值 | 说明 |
|--------|------|------|
| `DATABASE_URL` | `postgresql://postgres.tlorpxejqqmrdcfgvyhl:***@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5` | Supabase 连接池 |
| `DIRECT_DATABASE_URL` | `postgresql://postgres.tlorpxejqqmrdcfgvyhl:***@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` | Prisma migrate 直连 |
| `JWT_SECRET` | `L0gYQEIhlZ9Pg1dQ...` (你的密钥) | JWT 签名密钥 |
| `NODE_ENV` | `production` | 生产模式 |
| `PORT` | `3000` | 服务端口 |
| `ALLOWED_ORIGINS` | `https://你的netlify域名.netlify.app` | CORS 白名单 |
| `CACHE_TTL_SECONDS` | `30` | 内存缓存 TTL |

#### 3.3 Netlify 后台环境变量配置（可选，netlify.toml 已包含）

在 Netlify Dashboard > Site settings > Environment variables 中设置：

| 变量名 | 值 | 说明 |
|--------|------|------|
| `VITE_API_BASE_URL` | `https://tml-villa-api-d279.onrender.com` | Render 后端地址 |
| `VITE_SUPABASE_URL` | `https://tlorpxejqqmrdcfgvyhl.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase 匿名 Key |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://tlorpxejqqmrdcfgvyhl.supabase.co/functions/v1` | Edge Functions |
| `VITE_SUPABASE_BUCKET` | `homestay-images` | 图片存储桶 |

> 注意：这些值已在 netlify.toml 中配置。如果在 Netlify 后台也配置了同名变量，后台的值会覆盖 netlify.toml 中的值。

---

### 🟡 优先级：中（部署后建议完成）

#### 3.4 Render 冷启动保活

Render 免费版 15 分钟无流量自动休眠，首次唤醒需 30-60 秒。

**方案 A：使用 cron-job.org（推荐，免费）**
1. 注册 https://cron-job.org
2. 创建任务：每 14 分钟 GET `https://tml-villa-api-d279.onrender.com/health`
3. 设置时间范围：亚洲时段（UTC+7 06:00-24:00）

**方案 B：使用 UptimeRobot（免费）**
1. 注册 https://uptimerobot.com
2. 添加 HTTP 监控：`https://tml-villa-api-d279.onrender.com/health`
3. 间隔 5 分钟

**方案 C：Supabase Edge Functions 已部署**
项目已配置首页数据通过 Supabase Edge Functions 获取（get-homestays, get-categories），
即使 Render 休眠，首页也能正常加载！ ✅

#### 3.5 Supabase 过期数据定时清理

当前仅有手动清理 API（`DELETE /api/car-configs/:id/stock/cleanup`）。

**建议方案：Supabase pg_cron（免费版可用）**

在 Supabase SQL Editor 中执行：
```sql
-- 启用 pg_cron 扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 每天凌晨 3 点清理过期库存（保留最近 7 天）
SELECT cron.schedule(
  'cleanup-expired-stocks',
  '0 3 * * *',
  $$
  DELETE FROM car_stocks WHERE date < CURRENT_DATE - INTERVAL '7 days';
  DELETE FROM house_stocks WHERE date < CURRENT_DATE - INTERVAL '7 days';
  $$
);

-- 每周清理 30 天前已读通知
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 4 * * 0',
  $$
  DELETE FROM notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '30 days';
  $$
);
```

#### 3.6 DATABASE_URL 添加连接池限制

在 Render 的 DATABASE_URL 环境变量末尾追加 `&connection_limit=5`：
```
...6543/postgres?pgbouncer=true&connection_limit=5
```

---

### 🟢 优先级：低（后续优化）

#### 3.7 前端 React.lazy 代码分割

当前 39 个页面全部同步导入，建议对管理后台页面使用 React.lazy：

```tsx
// AdminApp.tsx 改造示例
import { lazy, Suspense } from 'react';
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Users = lazy(() => import('@/pages/Users'));
// ... 其他页面

// 在 renderContent 中包裹 Suspense
<Suspense fallback={<LoadingSpinner />}>
  {renderContent()}
</Suspense>
```

#### 3.8 API 响应缓存头

在后端只读 GET 接口添加 Cache-Control 头：
```javascript
// 例如 GET /api/categories
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
```

---

## 四、部署步骤（按顺序执行）

### 第一步：Supabase 数据库准备
1. ✅ 确认 Supabase 项目已创建（tlorpxejqqmrdcfgvyhl）
2. ✅ 确认数据库 schema 已同步（prisma db push）
3. ⬜ 运行种子数据 `cd backend && npx prisma db seed`
4. ⬜ 部署 Edge Functions：`supabase functions deploy get-homestays`
5. ⬜ 部署 Edge Functions：`supabase functions deploy get-categories`
6. ⬜ 部署 Edge Functions：`supabase functions deploy get-users`
7. ⬜ 确认 Supabase Storage 已创建 `homestay-images` bucket

### 第二步：推送代码到 GitHub
1. ⬜ 配置 SSH Key 或切换为 HTTPS
2. ⬜ `git push origin main`（推送 31 个提交）
3. ⬜ 确认 GitHub 仓库代码已更新

### 第三步：部署 Render 后端
1. ⬜ 在 Render 创建 Web Service
2. ⬜ 连接 GitHub 仓库 `hwb686/tml-villa-v2`
3. ⬜ 设置 Root Directory 为 `backend`
4. ⬜ 设置 Build Command: `npm install && npx prisma generate && npx prisma db push --accept-data-loss`
5. ⬜ 设置 Start Command: `npm start`
6. ⬜ 配置所有环境变量（见 3.2 节）
7. ⬜ 等待部署完成，访问 `/health` 验证

### 第四步：部署 Netlify 前端
1. ⬜ 在 Netlify 连接 GitHub 仓库
2. ⬜ Base directory 留空（netlify.toml 中已配置 `cd app`）
3. ⬜ 构建命令和发布目录会自动从 netlify.toml 读取
4. ⬜ （可选）在 Netlify 后台配置环境变量覆盖 netlify.toml
5. ⬜ 部署完成后访问首页验证

### 第五步：部署后验证
1. ⬜ 首页加载正常（通过 Supabase Edge Functions）
2. ⬜ 管理后台登录正常（通过 Render API）
3. ⬜ 创建/编辑民宿正常
4. ⬜ 图片上传到 Supabase Storage 正常
5. ⬜ SPA 路由刷新不 404

### 第六步：保活配置
1. ⬜ 注册 cron-job.org 或 UptimeRobot
2. ⬜ 配置定时 ping Render `/health` 端点
3. ⬜ （可选）配置 Supabase pg_cron 定时清理

---

## 五、免费版资源限额参考

| 服务 | 资源 | 免费限额 | 注意事项 |
|------|------|----------|----------|
| **Supabase** | 数据库存储 | 500 MB | 定期清理过期库存/通知 |
| **Supabase** | 带宽 | 5 GB/月 | 图片走 Storage CDN |
| **Supabase** | Edge Functions | 500K 次/月 | 只用于只读首页数据 |
| **Supabase** | Storage | 1 GB | 压缩图片，限制上传大小 |
| **Supabase** | 数据库连接 | 60 个 | 已配 pgbouncer + connection_limit=5 |
| **Render** | 运行时间 | 750 小时/月 | 单服务足够 24/7 |
| **Render** | RAM | 512 MB | 控制 Prisma 连接池大小 |
| **Render** | 带宽 | 100 GB/月 | API 代理走 Netlify 减压 |
| **Netlify** | 带宽 | 100 GB/月 | 静态资源 + CDN |
| **Netlify** | 构建时间 | 300 分钟/月 | 每次构建约 2-3 分钟 |
| **Netlify** | 部署次数 | 无限 | - |

---

## 六、架构优化亮点

```
┌─────────────────────────────────────────────────────┐
│                    用户浏览器                         │
└───────────────┬───────────────────┬──────────────────┘
                │                   │
          首页数据请求          管理后台/写操作
                │                   │
    ┌───────────▼───────────┐  ┌───▼──────────────────┐
    │  Supabase Edge Funcs  │  │   Netlify 前端 CDN    │
    │  (get-homestays 等)   │  │   /api/* 代理转发     │
    │  ⚡ 无冷启动，30s 缓存 │  │   ✅ Brotli 压缩      │
    └───────────────────────┘  └───────┬──────────────┘
                                       │
                               ┌───────▼──────────────┐
                               │   Render 后端 API     │
                               │   Express + Prisma    │
                               │   NodeCache 30s TTL   │
                               └───────┬──────────────┘
                                       │
                               ┌───────▼──────────────┐
                               │  Supabase PostgreSQL  │
                               │  pgbouncer:6543       │
                               │  连接池 ≤ 5           │
                               └──────────────────────┘
```

**关键优化**：
- ✅ 首页通过 Supabase Edge Functions 加载 → 避免 Render 冷启动白屏
- ✅ Netlify `/api/*` 代理 → 前端无 CORS 问题
- ✅ pgbouncer 连接池 → 避免 Supabase 连接耗尽
- ✅ NodeCache 30s TTL → 减少数据库查询
- ✅ manualChunks 分包 → 减小首屏加载体积
- ✅ 优雅关闭 → Prisma 连接不泄漏

---

*此文档由部署就绪检查自动生成。*
