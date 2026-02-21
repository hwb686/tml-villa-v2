# TML LocalLife Platform - 技术规格文档

## 1. 组件清单

### shadcn/ui 组件
| 组件名 | 用途 | 自定义 |
|--------|------|--------|
| Button | 所有按钮 | 金色主题 |
| Card | 服务卡片、评价卡片 | 圆角16px |
| Input | 表单输入 | 金色聚焦边框 |
| Sheet | 移动端导航抽屉 | - |
| Separator | 分隔线 | - |

### 自定义组件
| 组件名 | 用途 | 复杂度 |
|--------|------|--------|
| Navbar | 导航栏 | 中 |
| HeroSection | 主视觉区 | 高 |
| ServiceCard | 服务卡片 | 低 |
| FeatureSection | 特色优势 | 中 |
| StatsSection | 数据统计 | 中 |
| TestimonialCard | 评价卡片 | 低 |
| PartnersSection | 合作伙伴 | 低 |
| CTASection | 行动号召 | 低 |
| Footer | 页脚 | 中 |
| ScrollReveal | 滚动动画包装器 | 中 |
| CountUp | 数字计数动画 | 中 |

## 2. 动画实现规划

| 动画 | 库 | 实现方式 | 复杂度 |
|------|-----|---------|--------|
| 页面加载淡入 | Framer Motion | AnimatePresence + motion.div | 低 |
| 导航栏滚动变化 | React hooks | useState + useEffect + scroll listener | 低 |
| Hero内容依次出现 | Framer Motion | staggerChildren + motion.div | 中 |
| 滚动触发显示 | Framer Motion | whileInView + viewport | 中 |
| 卡片悬停效果 | Framer Motion | whileHover | 低 |
| 数字计数动画 | 自定义hook | useCountUp + Intersection Observer | 中 |
| 按钮悬停 | Tailwind CSS | transition + hover: | 低 |
| 图片视差 | Framer Motion | useScroll + useTransform | 中 |

## 3. 动画库选择

### 主要库: Framer Motion
- 原因: React生态最佳动画库，声明式API，支持手势、布局动画
- 用途: 所有组件动画、页面过渡、滚动触发

### 辅助: Tailwind CSS Transitions
- 用途: 简单悬停效果、颜色过渡

## 4. 项目文件结构

```
app/
├── src/
│   ├── sections/
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── StatsSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── PartnersSection.tsx
│   │   ├── CTASection.tsx
│   │   └── Footer.tsx
│   ├── components/
│   │   ├── ScrollReveal.tsx
│   │   ├── CountUp.tsx
│   │   ├── ServiceCard.tsx
│   │   └── TestimonialCard.tsx
│   ├── hooks/
│   │   ├── useScrollPosition.ts
│   │   └── useCountUp.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── images/
│   │   ├── hero-bg.jpg
│   │   ├── feature-img.jpg
│   │   └── logo.png
│   └── fonts/
├── components/ui/    # shadcn/ui 组件
├── tailwind.config.ts
└── package.json
```

## 5. 依赖清单

### 核心依赖
```bash
# 动画库
npm install framer-motion

# 图标库
npm install lucide-react

# 字体
# 通过 Google Fonts CDN 引入
```

### shadcn/ui 组件
```bash
npx shadcn add button card input sheet separator
```

## 6. Tailwind 配置扩展

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        'champagne': {
          DEFAULT: '#C9A962',
          dark: '#B8944F',
          light: '#E8D5A8',
        },
        'ink': '#1A1A1A',
        'charcoal': '#333333',
        'warm-gray': '#666666',
        'cream': '#F8F7F4',
        'off-white': '#FAFAF8',
      },
      fontFamily: {
        'serif': ['Cormorant Garamond', 'Noto Serif SC', 'serif'],
        'sans': ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
}
```

## 7. 性能优化

### 动画性能
- 使用 `transform` 和 `opacity` 进行动画
- 添加 `will-change` 到动画元素
- 使用 `motion.div` 的 `layout` 属性谨慎

### 图片优化
- 使用 WebP 格式
- 懒加载非首屏图片
- 使用适当的图片尺寸

### 代码分割
- 按需加载非关键组件
- 使用 React.lazy 和 Suspense

## 8. 可访问性

- 支持 `prefers-reduced-motion` 媒体查询
- 所有交互元素有焦点状态
- 图片有 alt 文本
- 颜色对比度符合 WCAG 标准

## 9. API 调用规范 ⭐

### 路径处理规范
- 禁止在组件中手动拼接API URL路径
- 必须统一使用封装的API服务方法进行调用
- API_BASE_URL环境变量格式：`https://your-api-domain.com/api`
- API服务层负责完整的URL构造，避免路径重复

### 错误处理规范
- 生产环境错误提示不得包含开发环境地址
- 应根据部署环境动态显示适当错误信息
- 避免暴露内部技术细节给最终用户

## 10. 部署注意事项 ⭐

### 前端部署
- 构建时必须设置正确的环境变量
- 验证构建产物中的API配置是否正确注入
- 部署后测试关键功能确保正常工作

### 后端部署
- 构建命令必须包含数据库迁移：`npm install && npm run db:generate && npm run db:deploy`
- 确认Prisma客户端在构建过程中正确生成
- 验证数据库连接和表结构完整性

### 数据库架构
- 项目使用外部数据库服务（如Supabase），数据不存储在应用部署环境中
- 数据库连接通过环境变量配置
- 部署文档需明确说明数据存储的实际位置

## 11. 开发规范

### 代码质量
- 遵循TypeScript最佳实践
- 组件命名使用PascalCase
- 文件命名使用kebab-case
- 提交前运行代码检查和测试

### Git工作流
- 国内网络环境下优先使用SSH方式进行Git推送
- 提交信息遵循约定式提交规范
- 功能开发使用特性分支
- 定期清理临时文件和测试脚本

### 任务收尾
- 完成开发任务后主动清理临时文件
- 验证所有功能按预期工作
- 更新相关文档和注释
- 确保项目环境整洁