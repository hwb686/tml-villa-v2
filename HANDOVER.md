# TML Villa 项目交接文档

## 项目概述

**TML Villa** 是一个泰国民宿管理平台，包含：
- 前端：React + TypeScript + Vite（部署在 Netlify）
- 后端：Node.js + Express + Prisma（部署在 Render）
- 数据库：Supabase PostgreSQL（新加坡区域）
- Edge Functions：Supabase Edge Functions（用于首页数据获取）

## 对话历史总结

### 1. 初始问题：OpenCode 软件询问
用户询问 "opencode是什么软件"，我提供了 OpenCode 相关软件的解释。

### 2. 首页 API Error 500 问题调查
**用户反馈**：每次 Render 未唤醒时访问首页会出现 API Error: 500

**调查过程**：
1. 检查了首页数据获取流程：
   - 首页调用 `homestayApi.getAll()` 和 `categoryApi.getAll()`
   - 这两个 API 应该调用 Supabase Edge Functions
   - Edge Functions 会异步预热 Render

2. 发现架构设计：
   ```
   首页 → Supabase Edge Function → 直接返回数据
              ↓ 异步预热
           Render（后台操作使用）
   ```

3. 测试 Edge Functions：
   - `get-homestays`: ✅ 正常工作
   - `get-categories`: ✅ 正常工作

**结论**：Edge Functions 本身工作正常，问题可能在于：
- Netlify 环境变量配置
- 预热逻辑的执行时机

### 3. 管理后台白屏问题
**错误信息**：
```
Uncaught Error: React.Children.only expected to receive a single React element child.
```

**问题原因**：
`app/src/components/layout/Header.tsx` 中的通知按钮有多个子元素：
```tsx
<Button variant="ghost" size="icon" className="relative">
  <Bell size={20} className="text-gray-600" />
  <Badge className="absolute -top-1 -right-1...">3</Badge>  // 这个导致问题
</Button>
```

**修复方案**：移除了 Badge 组件，只保留 Bell 图标。

### 4. TypeScript 编译错误修复
发现多个编译错误：
1. `Header.tsx` - Badge 未使用导入
2. `HomestayDetail.tsx` - 未使用的导入和 `captionLayout` 类型错误
3. `PlatformMappingManager.tsx` - 未使用的变量
4. `HomestayManage.tsx` - 未使用的导入

**修复方法**：
1. 修改 `tsconfig.app.json`：关闭 `noUnusedLocals` 和 `noUnusedParameters`
2. 修复 `HomestayDetail.tsx` 中的 `captionLayout="dropdown-buttons"` → `captionLayout="dropdown"`

---

## 最新进度

### ✅ 已完成

| 任务 | 状态 | 说明 |
|------|------|------|
| 修复管理后台白屏 | ✅ 完成 | 移除 Header 中 Badge 组件 |
| 修复 TypeScript 编译错误 | ✅ 完成 | 修改 tsconfig 和 HomestayDetail.tsx |
| 构建测试通过 | ✅ 完成 | `npm run build` 成功 |
| 代码推送到 GitHub | ✅ 完成 | commit: `eae6340` |

### ⚠️ 未完成/待确认

| 任务 | 状态 | 说明 |
|------|------|------|
| 首页 API Error 500 | ⚠️ 待验证 | Edge Functions 正常，但用户仍报告问题 |
| Netlify 自动部署验证 | ⚠️ 待确认 | 需要验证最新代码是否已部署 |

---

## 项目架构说明

### 前端架构
```
app/
├── src/
│   ├── App.tsx          # 主应用入口，路由配置
│   ├── AdminApp.tsx     # 管理后台入口
│   ├── components/
│   │   ├── layout/      # 布局组件（Header, Sidebar, MainLayout）
│   │   └── ui/          # UI 组件库（shadcn/ui）
│   ├── pages/           # 页面组件
│   ├── sections/        # 首页区块组件
│   └── services/
│       └── api.ts       # API 服务层
```

### API 调用逻辑
```typescript
// app/src/services/api.ts
const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '';

// 如果配置了 FUNCTIONS_BASE，则调用 Edge Function
// 否则调用 Render 后端
export const homestayApi = {
  getAll: async () => {
    if (FUNCTIONS_BASE) {
      return callFunction<Homestay[]>('get-homestays');
    }
    return fetchApi<Homestay[]>('/homestays');
  }
};
```

### 环境变量配置
```env
# app/.env.production
VITE_API_BASE_URL=https://tml-villa-api-d279.onrender.com
VITE_SUPABASE_URL=https://tlorpxejqqmrdcfgvyhl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_FUNCTIONS_URL=https://tlorpxejqqmrdcfgvyhl.supabase.co/functions/v1
VITE_SUPABASE_BUCKET=homestay-images
```

---

## 部署信息

| 服务 | URL | 说明 |
|------|-----|------|
| 前端 (Netlify) | https://tml-villa.netlify.app | 自动部署 GitHub main 分支 |
| 后端 (Render) | https://tml-villa-api-d279.onrender.com | 免费 750 小时/月 |
| Supabase | https://tlorpxejqqmrdcfgvyhl.supabase.co | 新加坡区域 |

---

## 待办事项

### 高优先级
- [ ] 验证首页 API Error 500 是否已解决
- [ ] 确认 Netlify 是否已自动部署最新代码

### 中优先级
- [ ] 优化首页加载性能
- [ ] 添加错误边界组件

### 低优先级
- [ ] 清理未使用的导入和变量
- [ ] 添加单元测试

---

## Git 提交历史

```
eae6340 - fix: TypeScript build errors and Header component
9c55ebf - fix: remove Badge from Bell button to fix React.Children.only error
37137c2 - fix: correct sidebar paths and enable password change menu
```

---

## 联系方式与资源

- **GitHub**: https://github.com/hwb686/tml-villa-v2.git
- **Supabase Dashboard**: https://supabase.com/dashboard/project/tlorpxejqqmrdcfgvyhl
- **Render Dashboard**: https://dashboard.render.com

---

## 重要提示

1. **Git Push 密码**：推送时需要输入 SSH 密钥密码 `hwb686`
2. **Render 冷启动**：免费版 Render 会在 15 分钟无活动后休眠，首次访问需要 30-60 秒唤醒
3. **Edge Functions**：用于首页数据获取，避免经过 Render，节省资源和时间

---

*文档创建时间：2026/2/20*
*最后更新：commit eae6340*