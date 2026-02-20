# TML Villa 功能规划文档

## 1. 业务模式分析

### 1.1 与 Airbnb 的核心差异

| 维度 | Airbnb | TML Villa |
|------|--------|-----------|
| **商家模式** | 商家入驻平台 | 所有业务自有 |
| **业务范围** | 民宿为主 | 民宿 + 租车 + 订餐 + 票务 |
| **库存管理** | 商家自行管理 | 平台统一管理 |
| **成本核算** | 平台抽佣 | 自负盈亏，需计算成本利润 |
| **员工管理** | 无需管理 | 需管理司机、清洁、前台等 |

### 1.2 业务流程图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ 民宿预订 │  │ 租车服务 │  │ 餐饮订购 │  │ 票务预订 │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                    ┌────▼────┐                              │
│                    │  支付   │                              │
│                    └────┬────┘                              │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    管理后台                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │订单管理 │ │库存管理 │ │员工管理 │ │财务报表 │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                        管理端                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 功能清单总览

### 2.1 统计数据

| 指标 | 数量 |
|------|------|
| 功能总数 | 25 |
| 已完成 | 3 |
| 缺失 | 14 |
| 部分实现 | 5 |
| 未来规划 | 3 |

### 2.2 优先级分布

```
P0 (核心缺失)  ████████████████████  8 个
P1 (重要功能)  █████████████████     7 个
P2 (增强功能)  ████████████          6 个
P3 (未来规划)  ██████                3 个
```

---

## 3. P0 - 核心缺失功能

### F004 - 用户注册/登录系统

**现状：** 只有管理员登录，缺少用户端登录

**需求：**
- 用户邮箱注册
- 邮箱验证
- 登录/登出
- 密码找回
- Token 管理（JWT）

**数据模型：**
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String   // 加密存储
  name         String?
  phone        String?
  avatar       String?
  status       String   @default("active")  // active, inactive, banned
  emailVerified Boolean @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  orders       Order[]
  reviews      Review[]
  favorites    Favorite[]
}
```

**API 设计：**
```
POST /api/auth/register    - 用户注册
POST /api/auth/login       - 用户登录
POST /api/auth/logout      - 用户登出
POST /api/auth/verify      - 邮箱验证
POST /api/auth/forgot      - 忘记密码
POST /api/auth/reset       - 重置密码
GET  /api/auth/me          - 获取当前用户
```

---

### F005 - 民宿预订流程完整性

**现状：** 有详情页和日历组件，但预订流程不完整

**完整流程：**
```
1. 选择日期 → 2. 选择人数 → 3. 填写信息 → 4. 确认订单 → 5. 支付 → 6. 订单确认
```

**需要实现：**
- 日期选择时校验库存
- 订单预览页面
- 订单确认逻辑
- 订单状态流转（pending → paid → confirmed → completed/cancelled）

**订单状态流转：**
```
                    ┌──────────────┐
                    │   pending    │ (待支付)
                    └──────┬───────┘
                           │ 支付成功
                           ▼
                    ┌──────────────┐
                    │    paid      │ (已支付)
                    └──────┬───────┘
                           │ 商家确认
                           ▼
                    ┌──────────────┐
           ┌───────│  confirmed   │ (已确认)───────┐
           │       └──────────────┘               │
           │ 取消                                │ 完成
           ▼                                      ▼
    ┌──────────────┐                      ┌──────────────┐
    │  cancelled   │                      │  completed   │
    └──────────────┘                      └──────────────┘
```

---

### F006 - 支付集成

**现状：** 无支付功能

**推荐方案：**

| 支付方式 | 适用场景 | 实现难度 |
|----------|----------|----------|
| Stripe | 国际用户、信用卡 | 中 |
| Omise/Opn Payments | 泰国本地支付 | 中 |
| 支付宝/微信 | 中国游客 | 高（需企业资质） |
| 银行转账 | 备用方案 | 低 |

**建议：** 优先集成 Stripe（支持泰国）

**API 设计：**
```
POST /api/payments/create-intent  - 创建支付意图
POST /api/payments/confirm        - 确认支付
POST /api/payments/webhook        - 支付回调
GET  /api/payments/:id            - 查询支付状态
```

---

### F007 - 民宿库存管理

**现状：** 数据库有 HouseStock 模型但功能未实现

**需求：**
- 设置每个民宿的房间数量
- 日期维度的库存管理
- 预订时扣减库存
- 取消时释放库存
- 超售保护

**库存模型：**
```prisma
model HouseStock {
  id         String   @id @default(cuid())
  houseId    String
  date       DateTime @db.Date
  totalStock Int      // 总库存
  bookedStock Int     // 已预订
  availableStock Int  // 可用 = 总库存 - 已预订
  price      Int?     // 当日价格（可浮动）
}
```

**管理端功能：**
- 日历视图显示库存状态
- 批量设置库存
- 价格日历（节假日调价）

---

### F008 - 车辆库存管理（含配司机）

**现状：** CarConfig 存在，但缺少库存和司机管理

**需求：**
- 车辆数量管理
- **配司机选项**（核心差异化）
- 司机排班
- 日期维度的可用性

**数据模型扩展：**
```prisma
model CarConfig {
  id          String   @id @default(cuid())
  name        String
  carType     String   // SUV、轿车、MPV等
  seats       Int
  price       Int      // 基础价格/天
  withDriver  Boolean  @default(false)  // 是否配司机
  driverPrice Int?     // 配司机额外价格
  images      String[]
  isActive    Boolean  @default(true)
  stocks      CarStock[]
}

model CarStock {
  id         String   @id @default(cuid())
  carId      String
  date       DateTime @db.Date
  totalStock Int
  bookedStock Int
  driverId   String?  // 分配的司机
}

model Driver {
  id        String   @id @default(cuid())
  name      String
  phone     String
  avatar    String?
  license   String   // 驾照信息
  status    String   @default("active")
  schedules DriverSchedule[]
}

model DriverSchedule {
  id        String   @id @default(cuid())
  driverId  String
  date      DateTime @db.Date
  carId     String?  // 分配的车辆
  status    String   // available, assigned, off
}
```

---

## 4. P1 - 重要功能

### F009 - 用户中心

**页面内容：**
- 个人信息管理
- 我的订单（全部/待支付/待出行/已完成）
- 收藏列表
- 消息通知

---

### F010 - 评价系统

**数据模型：**
```prisma
model Review {
  id        String   @id @default(cuid())
  userId    String
  orderId   String
  targetId  String   // 民宿/车辆/票务ID
  targetType String  // homestay, car, ticket
  rating    Int      // 1-5
  comment   String?
  images    String[]
  reply     String?  // 商家回复
  createdAt DateTime @default(now())
}
```

---

### F011 - 消息通知系统

**通知类型：**
- 订单确认通知
- 支付成功通知
- 入住提醒（提前1天）
- 评价提醒

**实现方式：**
- 站内消息（数据库存储）
- 邮件通知（SendGrid / Resend）
- 未来可扩展短信通知

---

### F012 - 员工管理（自有业务特有）

**员工角色：**
| 角色 | 职责 |
|------|------|
| 司机 | 车辆驾驶、接送服务 |
| 清洁 | 房间清洁、换床 |
| 前台 | 接待、入住办理 |
| 管家 | 客户服务、问题处理 |

**数据模型：**
```prisma
model Staff {
  id        String   @id @default(cuid())
  name      String
  phone     String   @unique
  role      String   // driver, cleaner, receptionist, butler
  avatar    String?
  status    String   @default("active")
  salary    Int?     // 薪资
  schedules StaffSchedule[]
  createdAt DateTime @default(now())
}

model StaffSchedule {
  id        String   @id @default(cuid())
  staffId   String
  date      DateTime @db.Date
  shift     String   // morning, afternoon, night
  task      String?  // 具体任务
  status    String   // scheduled, completed, absent
}
```

---

### F013 - 成本核算（自有业务特有）

**成本类型：**
- 固定成本：房产租金/购买、车辆购买
- 运营成本：水电、维护、保险
- 人力成本：员工薪资
- 变动成本：清洁费、司机餐费

**数据模型：**
```prisma
model Cost {
  id          String   @id @default(cuid())
  type        String   // fixed, operation, labor, variable
  category    String   // property, car, meal, ticket
  amount      Int
  description String
  date        DateTime @db.Date
  createdAt   DateTime @default(now())
}
```

**报表输出：**
- 月度成本报表
- 各业务线成本占比
- 利润率分析

---

### F014 - 运营报表

**报表类型：**
- 收入统计（日/周/月）
- 订单统计（各业务线）
- 入住率/车辆使用率
- 用户增长

**图表展示：**
- 折线图：收入趋势
- 饼图：业务占比
- 柱状图：订单对比

---

### F015 - 日历视图（管理端）

**功能：**
- 月历视图显示房间/车辆可用性
- 颜色标识：可用（绿）、部分可用（黄）、满（红）
- 点击快速预订/查看详情

---

## 5. P2 - 增强功能

### F016 - 搜索优化
- 关键词搜索
- 多条件筛选（价格、评分、设施）
- 排序选项（价格、评分、距离）
- 地图模式（未来）

### F017 - 收藏功能
- 点击收藏/取消收藏
- 收藏列表页面

### F018 - 多语言完善
- 中/英/泰三语完整翻译
- 语言持久化
- 自动检测浏览器语言

### F019 - 移动端适配
- 响应式布局检查
- 触摸交互优化
- 移动端导航优化

### F020 - 错误边界组件
- React ErrorBoundary
- 友好错误提示
- 错误日志上报

### F021 - 营销工具
- 优惠券管理
- 促销活动配置
- 用户领取使用

---

## 6. P3 - 未来规划

### F022 - 商家入驻
- 商家注册审核
- 商品管理
- 订单分成结算

### F023 - 会员系统
- 会员等级（普通/VIP/SVIP）
- 积分获取/消费
- 会员专属权益

### F024 - 分销系统
- 代理商管理
- 分销链接
- 佣金结算

---

## 7. 技术债务

### 7.1 当前问题
- 无单元测试（F025）
- TypeScript 严格模式已关闭
- 部分 unused imports

### 7.2 建议改进
1. 引入 Vitest 测试框架
2. 逐步开启 TypeScript 严格模式
3. 添加 ESLint 规则检查

---

## 8. 开发优先级建议

### 第一阶段（P0 - 核心功能）
1. F004 用户注册/登录
2. F007 民宿库存管理
3. F005 民宿预订流程
4. F006 支付集成
5. F008 车辆库存管理

### 第二阶段（P1 - 重要功能）
6. F009 用户中心
7. F015 日历视图
8. F012 员工管理
9. F013 成本核算
10. F014 运营报表
11. F010 评价系统
12. F011 消息通知

### 第三阶段（P2 - 增强功能）
13. F016 搜索优化
14. F017 收藏功能
15. F018 多语言完善
16. F019 移动端适配
17. F020 错误边界
18. F021 营销工具

### 第四阶段（P3 - 未来规划）
19. F022 商家入驻
20. F023 会员系统
21. F024 分销系统

---

## 9. 数据库迁移计划

需要新增的表：
- `reviews` - 评价
- `favorites` - 收藏
- `notifications` - 通知
- `staff` - 员工
- `staff_schedules` - 员工排班
- `drivers` - 司机
- `driver_schedules` - 司机排班
- `costs` - 成本记录
- `coupons` - 优惠券
- `user_coupons` - 用户优惠券

需要修改的表：
- `users` - 添加 emailVerified 等字段
- `car_configs` - 添加 withDriver, driverPrice 字段
- `car_rentals` - 添加 driverId 字段

---

## 10. 文档更新记录

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-02-20 | 1.0 | 初始版本，功能规划完成 |

---

*文档创建：2026-02-20*
*最后更新：2026-02-20*
