# TML Villa — 泰国民宿管理平台

> 自有业务模式的综合管理平台，涵盖民宿预订、租车服务、餐饮订购、票务预订。

## 技术栈

| 层 | 技术 |
|---|------|
| **前端** | React 19 + TypeScript + Vite 7 + Tailwind CSS + shadcn/ui |
| **后端** | Node.js + Express + Prisma ORM |
| **数据库** | PostgreSQL (Supabase) |
| **部署** | Netlify (前端) + Render (后端) + Supabase (DB + Edge Functions) |

## 快速开始

### 前置条件

- Node.js >= 20
- PostgreSQL 数据库 (或 Supabase 账号)

### 安装

```bash
# 安装所有依赖
cd app && npm install
cd ../backend && npm install

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 填入数据库连接信息

# 生成 Prisma 客户端 & 运行迁移
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 开发

```bash
# 方式一：一键启动前后端
npm run dev

# 方式二：分别启动
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3000

# 停止所有服务
npm run stop
```

### 测试

```bash
npm test              # 前端单元测试 (Vitest)
npm run test:backend  # 后端单元测试 (Jest)
npm run test:e2e      # E2E 测试 (Playwright)
```

### 构建

```bash
npm run build         # 构建前端生产版本
```

## 项目结构

```
tml-villa/
├── app/                  # 前端 React 应用
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   ├── pages/        # 页面组件
│   │   ├── services/     # API 调用
│   │   ├── hooks/        # 自定义 Hooks
│   │   └── lib/          # 工具库 (i18n, utils)
│   └── package.json
├── backend/              # 后端 API 服务
│   ├── api/db.js         # Express 路由 & 业务逻辑
│   ├── lib/prisma.js     # Prisma 客户端
│   └── prisma/
│       ├── schema.prisma # 数据库模型
│       ├── seed.js       # 种子数据
│       └── migrations/   # 数据库迁移
├── supabase/             # Supabase Edge Functions
├── tests/                # E2E 测试
├── netlify.toml          # Netlify 部署配置
└── package.json          # 根工作区脚本
```

## 功能清单 (26/27 完成)

### 用户端
- 🏠 民宿搜索与预订
- 🚗 租车服务（可配司机）
- 🍽️ 餐饮订购
- 🎫 票务预订
- 👤 用户中心（订单、收藏、通知）
- ⭐ 评价系统
- 🌐 多语言 (中/英/泰)
- 📱 移动端适配

### 管理后台
- 📊 运营仪表板 & 报表
- 📦 库存管理（房源 + 车辆）
- 📅 日历视图
- 👥 员工管理 & 排班
- 💰 成本核算 & 财务
- 🎟️ 优惠券 & 促销活动
- 🏪 商家入驻管理
- 👑 会员系统
- ⚙️ 业务配置
- 📡 免费额度监控

## 环境变量

### 后端 (`backend/.env`)

```env
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

### 前端 (Netlify 环境变量)

```env
VITE_API_BASE_URL=https://your-render-url.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 测试账号

| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 普通用户 | test@example.com | password123 |

## License

Private — 未经授权禁止复制或分发。
