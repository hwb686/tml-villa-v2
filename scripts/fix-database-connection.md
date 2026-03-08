# Supabase 数据库配置指南

## 问题："Tenant or user not found" 错误

这个错误通常是因为 Supabase Connection Pooler 配置问题。

## 解决方案

### 方案 1：使用直连方式（推荐）

在 Render Dashboard 中更新环境变量：

```bash
DATABASE_URL="postgresql://postgres:Kaokao686!!@db.tlorpxejqqmrdcfgvyhl.supabase.co:5432/postgres?sslmode=require"
DIRECT_DATABASE_URL="postgresql://postgres:Kaokao686!!@db.tlorpxejqqmrdcfgvyhl.supabase.co:5432/postgres?sslmode=require"
```

### 方案 2：使用 Connection Pooler

如果要用 Pooler（端口 6543），需要确保：
1. 在 Supabase Dashboard → Database → Connection Pooling 中启用
2. 使用正确的用户名格式：`postgres.tlorpxejqqmrdcfgvyhl`

```bash
DATABASE_URL="postgresql://postgres.tlorpxejqqmrdcfgvyhl:Kaokao686!!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5"
DIRECT_DATABASE_URL="postgresql://postgres.tlorpxejqqmrdcfgvyhl:Kaokao686!!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

## 推荐配置

对于 Render 部署，建议使用**直连方式**（方案 1），更简单可靠。

## 完整环境变量

```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=rK9mP2nQ5vX8bC4dF7gH1jK3lN6pR9sU2wY5zA8dE1gH4jK7mN0q
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# 使用直连方式
DATABASE_URL="postgresql://postgres:Kaokao686!!@db.tlorpxejqqmrdcfgvyhl.supabase.co:5432/postgres?sslmode=require"
DIRECT_DATABASE_URL="postgresql://postgres:Kaokao686!!@db.tlorpxejqqmrdcfgvyhl.supabase.co:5432/postgres?sslmode=require"

SUPABASE_URL=https://tlorpxejqqmrdcfgvyhl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ALLOWED_ORIGINS=https://tml-villa.onrender.com
FRONTEND_URL=https://tml-villa.onrender.com
```

## 步骤

1. 访问 https://dashboard.render.com/web/srv-[tml-villa-api-id]
2. 点击 **Environment** 标签
3. 更新 `DATABASE_URL` 和 `DIRECT_DATABASE_URL` 为上述值
4. 点击 **Save Changes**
5. 服务会自动重新部署
6. 等待 2-3 分钟后测试 API
