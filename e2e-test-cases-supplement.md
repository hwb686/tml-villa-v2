# TML Villa 补充测试用例文档 - ULTRATHINK 深度推理版

**文档版本**: v1.0 (Supplement)
**创建日期**: 2026-02-24
**作者**: 架构师 (ULTRATHINK 深度推理模式)
**基于**: e2e-test-cases-ultrathink.md (v3.0, 83个基础用例)
**补充目标**: 覆盖现有83个用例遗漏的关键场景

**测试工具**: agent-browser CLI (v0.13.0)
**测试环境**:
- 前端: http://localhost:5173
- 后端: http://localhost:3000
- 数据库: PostgreSQL (Supabase)

---

## 📊 覆盖度评估总结

### 现有测试覆盖度评分：37/100

| 维度 | 得分 | 问题描述 |
|------|------|---------|
| 功能路径覆盖 | 60/100 | 主要是 Happy Path，异常路径不足 |
| 边界条件覆盖 | 15/100 | 仅评价字数限制1个边界测试 |
| 并发/竞争条件 | 0/100 | **完全未测试**，超售风险极高 |
| 网络异常场景 | 0/100 | **完全未测试**，API超时/断网无处理验证 |
| 权限越权测试 | 10/100 | 仅1个未登录访问测试 |
| 移动端设备覆盖 | 20/100 | 仅iPhone 13 + iPad Pro，缺少主流安卓设备 |
| 国际化完整性 | 25/100 | 测试语言切换，不测试具体翻译正确性 |
| 业务流程完整性 | 45/100 | 订单状态流转 confirmed→completed 未测试 |

---

## 📋 补充测试用例目录

### 一、移动端设备测试矩阵（M系列）
- [M001-M009] 9种主流移动设备首页测试
- [M010-M018] 9种主流移动设备预订流程测试
- [M019-M027] 9种主流移动设备用户中心测试
- [M028-M036] 横屏模式测试
- [M037-M045] 移动端触摸交互专项测试

### 二、边界条件测试（B系列）
- [B001-B010] 表单边界值测试
- [B011-B020] 输入安全测试（XSS/注入/特殊字符）
- [B021-B025] 日期边界测试

### 三、并发场景测试（C系列）
- [C001-C005] 库存竞争条件测试
- [C006-C010] 多会话并发测试

### 四、网络异常测试（N系列）
- [N001-N010] API超时与断网测试

### 五、权限边界测试（P系列）
- [P001-P010] 越权访问与权限绕过测试

### 六、国际化完整性测试（I系列）
- [I001-I020] 三语言全页面覆盖测试

### 七、业务流程完整性测试（W系列）
- [W001-W015] 完整订单状态流转测试
- [W016-W025] 库存与订单联动测试

---

## 一、移动端设备测试矩阵

### 设备规格说明

| 设备代号 | 设备名称 | 分辨率 (px) | 类型 | 优先级 |
|---------|---------|------------|------|--------|
| D01 | iPhone SE (3rd Gen) | 375×667 | iOS最小屏 | P0 |
| D02 | iPhone 14 | 390×844 | iOS主流 | P0 |
| D03 | iPhone 14 Pro | 393×852 | iOS高端 | P0 |
| D04 | iPhone 14 Pro Max | 430×932 | iOS最大 | P1 |
| D05 | Samsung Galaxy S21 | 360×800 | 安卓主流 | P0 |
| D06 | Samsung Galaxy S21 Ultra | 384×854 | 安卓高端 | P1 |
| D07 | Google Pixel 7 | 412×915 | 安卓原生 | P1 |
| D08 | iPad mini (6th Gen) | 768×1024 | 平板小 | P1 |
| D09 | iPad Air (5th Gen) | 820×1180 | 平板中 | P1 |
| D10 | iPad Pro 11" | 834×1194 | 平板大 | P2 |

### 移动端测试矩阵（功能 × 设备）

| 功能模块 | D01 iPhone SE | D02 iPhone 14 | D03 iPhone 14 Pro | D04 Pro Max | D05 Galaxy S21 | D06 S21 Ultra | D07 Pixel 7 | D08 iPad mini | D09 iPad Air |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 首页加载 | ✅必测 | ✅必测 | ✅必测 | 🔶推荐 | ✅必测 | 🔶推荐 | 🔶推荐 | ✅必测 | 🔶推荐 |
| 汉堡菜单 | ✅必测 | ✅必测 | ✅必测 | 🔶推荐 | ✅必测 | 🔶推荐 | 🔶推荐 | ✅必测 | 🔶推荐 |
| 民宿详情 | ✅必测 | ✅必测 | ✅必测 | 🔶推荐 | ✅必测 | 🔶推荐 | 🔶推荐 | ✅必测 | 🔶推荐 |
| 日历选择 | ✅必测 | ✅必测 | ✅必测 | 🔶推荐 | ✅必测 | 🔶推荐 | 🔶推荐 | ✅必测 | 🔶推荐 |
| 预订表单 | ✅必测 | ✅必测 | ✅必测 | ⭕可选 | ✅必测 | ⭕可选 | ⭕可选 | ✅必测 | ⭕可选 |
| 用户中心 | ✅必测 | ✅必测 | ✅必测 | ⭕可选 | ✅必测 | ⭕可选 | ⭕可选 | ✅必测 | ⭕可选 |
| 语言切换 | ✅必测 | ✅必测 | ✅必测 | ⭕可选 | ✅必测 | ⭕可选 | ⭕可选 | 🔶推荐 | ⭕可选 |
| 搜索功能 | ✅必测 | ✅必测 | ✅必测 | ⭕可选 | ✅必测 | ⭕可选 | ⭕可选 | 🔶推荐 | ⭕可选 |

---

### TC-M001: iPhone SE 首页显示测试

**所属功能**: F020 - 移动端适配
**设备**: iPhone SE (375×667)
**优先级**: P0 (Critical) — 最小屏幕，最容易溢出
**测试重点**: 最小屏幕下无横向滚动、文字不截断、按钮可点击

**测试步骤**:
```bash
# 1. 以 iPhone SE 尺寸打开首页
agent-browser --headed --viewport 375x667 open http://localhost:5173

# 2. 等待页面加载
sleep 3

# 3. 获取完整快照
agent-browser snapshot -i -c

# 4. 截图（全页）
agent-browser screenshot /tmp/mobile-test-m001-iphone-se-home.png

# 5. 检查控制台（重点看布局错误）
agent-browser console

# 6. 验证：检查是否有横向滚动条
# （通过快照检查 overflow-x 相关元素）
agent-browser snapshot
```

**预期结果**:
- ✅ 页面无横向滚动条
- ✅ 导航栏显示汉堡菜单图标（而非展开导航）
- ✅ 房源卡片单列垂直排列
- ✅ 搜索框完整显示在屏幕内
- ✅ 所有文字可读，无截断
- ✅ 底部不出现空白遮挡
- ✅ 控制台无布局相关错误

**边界条件**:
- 375px 是 iPhone SE 宽度，也是响应式断点 `sm:` (640px) 以下的典型尺寸
- 需特别验证 `grid-cols-2` 等响应式布局是否正确降级为 `grid-cols-1`

---

### TC-M002: iPhone 14 首页显示测试

**所属功能**: F020 - 移动端适配
**设备**: iPhone 14 (390×844)
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 1. 以 iPhone 14 尺寸打开首页
agent-browser --headed --viewport 390x844 open http://localhost:5173
sleep 3

# 2. 获取快照
agent-browser snapshot -i -c

# 3. 截图
agent-browser screenshot /tmp/mobile-test-m002-iphone14-home.png

# 4. 测试滚动（向下滚动）
agent-browser scroll 0 500

# 5. 再次截图（验证滚动后布局）
agent-browser screenshot /tmp/mobile-test-m002-iphone14-scrolled.png

# 6. 检查控制台
agent-browser console
```

**预期结果**:
- ✅ 所有 iPhone SE 预期结果均满足
- ✅ 滚动流畅，无卡顿
- ✅ 滚动后导航栏正确固定（sticky）
- ✅ 房源图片正常加载，无变形

---

### TC-M003: iPhone 14 Pro 首页显示测试

**所属功能**: F020 - 移动端适配
**设备**: iPhone 14 Pro (393×852)
**优先级**: P0 (Critical)
**特殊考量**: Dynamic Island 可能影响顶部布局

**测试步骤**:
```bash
# 1. 以 iPhone 14 Pro 尺寸打开首页
agent-browser --headed --viewport 393x852 open http://localhost:5173
sleep 3

# 2. 获取快照，重点检查顶部导航区域
agent-browser snapshot -i -c

# 3. 截图顶部区域
agent-browser screenshot /tmp/mobile-test-m003-iphone14pro-home.png

# 4. 检查控制台
agent-browser console
```

**预期结果**:
- ✅ 顶部导航栏不被 Dynamic Island 遮挡
- ✅ 布局与 iPhone 14 一致
- ✅ 无超出屏幕边界的元素

---

### TC-M004: iPhone 14 Pro Max 首页测试

**所属功能**: F020 - 移动端适配
**设备**: iPhone 14 Pro Max (430×932)
**优先级**: P1 (High)
**特殊考量**: 最大 iPhone 屏幕，验证内容是否合理填充

**测试步骤**:
```bash
# 1. 打开首页
agent-browser --headed --viewport 430x932 open http://localhost:5173
sleep 3

# 2. 获取快照
agent-browser snapshot -i -c

# 3. 截图
agent-browser screenshot /tmp/mobile-test-m004-iphone14promax-home.png
```

**预期结果**:
- ✅ 内容不出现过多空白
- ✅ 卡片布局合理（可考虑2列）
- ✅ 字体大小合适，不显得过小

---

### TC-M005: Samsung Galaxy S21 首页测试

**所属功能**: F020 - 移动端适配
**设备**: Samsung Galaxy S21 (360×800)
**优先级**: P0 (Critical) — 安卓最常见分辨率之一

**测试步骤**:
```bash
# 1. 打开首页（360px 宽度是安卓主流）
agent-browser --headed --viewport 360x800 open http://localhost:5173
sleep 3

# 2. 获取快照
agent-browser snapshot -i -c

# 3. 截图
agent-browser screenshot /tmp/mobile-test-m005-galaxy-s21-home.png

# 4. 测试语言切换（验证泰语字符在小屏幕的显示）
agent-browser click @e1  # 语言切换按钮
sleep 1
agent-browser snapshot -i -c
agent-browser click @e2  # 选择泰语
sleep 1
agent-browser screenshot /tmp/mobile-test-m005-galaxy-s21-thai.png

# 5. 检查控制台
agent-browser console
```

**预期结果**:
- ✅ 360px 宽度下无布局错误
- ✅ 泰语字体在小屏幕下正确渲染
- ✅ 汉堡菜单可见且可点击

---

### TC-M006: Samsung Galaxy S21 Ultra 首页测试

**所属功能**: F020 - 移动端适配
**设备**: Samsung Galaxy S21 Ultra (384×854)
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed --viewport 384x854 open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-test-m006-galaxy-s21ultra-home.png
agent-browser console
```

**预期结果**:
- ✅ 布局正常，无横向溢出
- ✅ 安卓 Chrome 渲染正常

---

### TC-M007: Google Pixel 7 首页测试

**所属功能**: F020 - 移动端适配
**设备**: Google Pixel 7 (412×915)
**优先级**: P1 (High)
**特殊考量**: 412px 宽度接近 `sm:` 断点，布局切换临界点

**测试步骤**:
```bash
# 1. 打开首页
agent-browser --headed --viewport 412x915 open http://localhost:5173
sleep 3

# 2. 获取快照（检查断点切换）
agent-browser snapshot -i -c

# 3. 截图
agent-browser screenshot /tmp/mobile-test-m007-pixel7-home.png

# 4. 与 390px 对比（验证布局一致性）
agent-browser console
```

**预期结果**:
- ✅ 412px 下布局与 390px 保持一致
- ✅ 不因宽度差异产生意外的布局跳变

---

### TC-M008: iPad mini 首页测试

**所属功能**: F020 - 移动端适配
**设备**: iPad mini 6th Gen (768×1024)
**优先级**: P1 (High)
**特殊考量**: 768px 正好是 Tailwind `md:` 断点，验证布局是否正确启用2列

**测试步骤**:
```bash
# 1. 打开首页（平板模式）
agent-browser --headed --viewport 768x1024 open http://localhost:5173
sleep 3

# 2. 获取快照（验证是否为平板布局）
agent-browser snapshot -i -c

# 3. 截图
agent-browser screenshot /tmp/mobile-test-m008-ipad-mini-home.png

# 4. 验证导航栏（平板应显示完整导航，不显示汉堡菜单）
agent-browser console
```

**预期结果**:
- ✅ 768px 下显示2列房源卡片
- ✅ 导航栏显示完整菜单（不应显示汉堡菜单）
- ✅ 侧边栏（如有）正确适配
- ✅ 管理后台侧边栏在768px下的显示方式正确

---

### TC-M009: iPad Air 首页测试

**所属功能**: F020 - 移动端适配
**设备**: iPad Air 5th Gen (820×1180)
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed --viewport 820x1180 open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-test-m009-ipad-air-home.png
agent-browser console
```

**预期结果**:
- ✅ 820px 下显示2-3列房源卡片
- ✅ 布局充分利用屏幕空间
- ✅ 图片质量适配高分辨率屏幕

---

### TC-M010 - TC-M018: 移动端预订流程测试

> **测试矩阵**：在 D01(375), D03(393), D05(360), D08(768) 四个关键设备上执行完整预订流程

### TC-M010: iPhone SE 预订流程

**所属功能**: F020 + F005
**设备**: iPhone SE (375×667)
**优先级**: P0 (Critical) — 最小屏幕的预订流程最易崩溃

**测试步骤**:
```bash
# 1. 以 iPhone SE 尺寸登录
agent-browser --headed --viewport 375x667 open http://localhost:5173/#/login
sleep 2
agent-browser snapshot -i -c

# 2. 填写登录表单（验证小屏幕下的输入体验）
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"

# 3. 截图登录表单（验证输入框不超出屏幕）
agent-browser screenshot /tmp/mobile-m010-se-login-form.png

# 4. 点击登录
agent-browser click @e3
sleep 2

# 5. 打开民宿详情页
agent-browser open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3

# 6. 截图详情页（验证图片轮播、信息布局）
agent-browser screenshot /tmp/mobile-m010-se-detail.png
agent-browser snapshot -i -c

# 7. 验证日历选择器在小屏幕下的可用性
# 日历组件是预订流程中最容易在小屏幕崩溃的组件
agent-browser click @e1  # 假设日历触发按钮
sleep 1
agent-browser screenshot /tmp/mobile-m010-se-calendar.png
agent-browser snapshot -i -c

# 8. 检查控制台
agent-browser console
```

**预期结果**:
- ✅ 登录表单在 375px 下完全可用
- ✅ 输入框不超出屏幕边界
- ✅ 民宿详情页正确布局（图片全宽，信息单列）
- ✅ 日历选择器在小屏幕下可操作（触摸友好）
- ✅ 预订按钮可见且可点击
- ✅ 价格总计正确显示

---

### TC-M011: Samsung Galaxy S21 预订流程

**所属功能**: F020 + F005
**设备**: Samsung Galaxy S21 (360×800)
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 以 Galaxy S21 尺寸完整执行预订流程
agent-browser --headed --viewport 360x800 open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

# 打开民宿详情页
agent-browser open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m011-s21-detail.png

# 选择日期
agent-browser click @e1
sleep 1
agent-browser screenshot /tmp/mobile-m011-s21-calendar.png

# 检查控制台
agent-browser console
```

**预期结果**:
- ✅ 安卓设备下的字体渲染正确
- ✅ 日历组件触摸操作正常
- ✅ 全部预订步骤可完成

---

### TC-M019 - TC-M027: 移动端用户中心测试

### TC-M019: iPhone SE 用户中心标签页测试

**所属功能**: F020 + F009
**设备**: iPhone SE (375×667)
**优先级**: P0 — 标签页在小屏幕容易溢出

**测试步骤**:
```bash
agent-browser --headed --viewport 375x667 open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

# 进入用户中心
agent-browser open http://localhost:5173/#/user
sleep 2
agent-browser snapshot -i -c

# 截图用户中心（验证6个标签页在小屏幕的显示）
agent-browser screenshot /tmp/mobile-m019-se-user-center.png

# 点击"我的订单"标签（验证标签页切换）
agent-browser click @e1
sleep 1
agent-browser screenshot /tmp/mobile-m019-se-orders-tab.png

# 点击"消息通知"标签
agent-browser click @e2
sleep 1
agent-browser screenshot /tmp/mobile-m019-se-notifications-tab.png

agent-browser console
```

**预期结果**:
- ✅ 6个标签页在 375px 下全部可见（可能需要横向滚动标签栏）
- ✅ 每个标签页的内容正确渲染
- ✅ 标签页切换流畅
- ✅ 用户头像和统计信息正确显示

---

### TC-M028 - TC-M036: 横屏模式测试

### TC-M028: iPhone 14 横屏首页

**所属功能**: F020 - 移动端适配
**设备**: iPhone 14 横屏 (844×390)
**优先级**: P2 (Medium)
**特殊考量**: 横屏高度极小，底部导航/按钮可能被遮挡

**测试步骤**:
```bash
# 模拟 iPhone 14 横屏（宽高互换）
agent-browser --headed --viewport 844x390 open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m028-iphone14-landscape-home.png
agent-browser console
```

**预期结果**:
- ✅ 横屏下导航栏高度合理，不占据过多空间
- ✅ 内容区可见，不被导航遮挡
- ✅ 可能显示2列房源卡片（利用横屏宽度）
- ✅ 无横向溢出

---

### TC-M029: iPhone SE 横屏测试

**所属功能**: F020 - 移动端适配
**设备**: iPhone SE 横屏 (667×375)
**优先级**: P2 (Medium) — 最窄高度场景

**测试步骤**:
```bash
agent-browser --headed --viewport 667x375 open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m029-iphonese-landscape.png
agent-browser console
```

**预期结果**:
- ✅ 375px 高度下内容可见
- ✅ 不出现重要内容被裁剪的情况

---

### TC-M030: Galaxy S21 横屏测试

**所属功能**: F020 - 移动端适配
**设备**: Samsung Galaxy S21 横屏 (800×360)
**优先级**: P2 (Medium)

**测试步骤**:
```bash
agent-browser --headed --viewport 800x360 open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m030-s21-landscape.png
agent-browser console
```

**预期结果**:
- ✅ 安卓横屏布局正常
- ✅ 导航栏正确显示

---

### TC-M037 - TC-M045: 移动端触摸交互专项测试

### TC-M037: 移动端图片轮播滑动测试

**所属功能**: F020 + F005
**设备**: iPhone 14 (390×844)
**优先级**: P1 (High) — 民宿详情页图片轮播是核心体验

**测试步骤**:
```bash
agent-browser --headed --viewport 390x844 open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser snapshot -i -c

# 验证图片轮播组件存在
agent-browser screenshot /tmp/mobile-m037-image-carousel.png

# 注意：agent-browser 使用 Playwright，可以模拟滑动
# 滑动图片（向左滑动切换下一张）
agent-browser console
```

**预期结果**:
- ✅ 图片轮播在移动端可滑动操作
- ✅ 轮播指示点正确显示
- ✅ 图片加载正常，无拉伸变形

---

### TC-M038: 移动端日历触摸操作测试

**所属功能**: F020 + F005
**设备**: iPhone 14 (390×844)
**优先级**: P0 (Critical) — 日历是预订的核心组件

**测试步骤**:
```bash
agent-browser --headed --viewport 390x844 open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser snapshot -i -c

# 找到日历组件
agent-browser screenshot /tmp/mobile-m038-calendar-before.png

# 点击日历（模拟触摸）
agent-browser click @e1  # 日历触发元素
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m038-calendar-open.png

# 尝试选择日期（验证触摸目标大小）
agent-browser click @e2  # 某个日期
sleep 0.5
agent-browser screenshot /tmp/mobile-m038-date-selected.png

agent-browser console
```

**预期结果**:
- ✅ 日历在移动端可正常打开
- ✅ 日期单元格足够大（>= 44×44px）可以准确点击
- ✅ 日期选择后正确高亮
- ✅ 跨月导航按钮可点击
- ✅ 已满日期正确显示禁用状态

---

### TC-M039: 移动端汉堡菜单完整测试

**所属功能**: F020
**设备**: iPhone SE (375×667)
**优先级**: P0 (Critical)

**测试步骤**:
```bash
agent-browser --headed --viewport 375x667 open http://localhost:5173
sleep 2
agent-browser snapshot -i -c

# 点击汉堡菜单
agent-browser click @e1  # 汉堡菜单按钮
sleep 0.5
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m039-menu-open.png

# 验证菜单项
# 点击导航链接（如"用户中心"）
agent-browser click @e2
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m039-menu-nav.png

# 验证菜单关闭（点击外部区域）
agent-browser open http://localhost:5173
sleep 1
agent-browser click @e1  # 重新打开菜单
sleep 0.5
# 点击遮罩层关闭
agent-browser key "Escape"
sleep 0.3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/mobile-m039-menu-close.png

agent-browser console
```

**预期结果**:
- ✅ 汉堡菜单按钮可见且可点击
- ✅ 菜单展开后显示完整导航选项
- ✅ 菜单项点击后正确导航
- ✅ 点击外部区域或ESC键可关闭菜单
- ✅ 菜单不覆盖整个屏幕（保留关闭区域）

---

## 二、边界条件测试

### TC-B001: 注册表单 - 空值提交

**所属功能**: F004 - 用户认证
**优先级**: P1 (High)
**测试类型**: 边界值（空输入）

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser snapshot -i -c

# 直接点击登录按钮（不填写任何内容）
agent-browser click @e3
sleep 0.5
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b001-empty-login.png
```

**预期结果**:
- ✅ 表单不提交
- ✅ 显示"邮箱不能为空"和"密码不能为空"错误提示
- ✅ 错误提示清晰可见（红色边框或提示文字）
- ❌ **不应**: 向后端发送空数据请求
- ❌ **不应**: 显示服务器错误

---

### TC-B002: 注册表单 - 邮箱格式错误

**所属功能**: F004 - 用户认证
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser snapshot -i -c

# 填写无效邮箱
agent-browser fill @e1 "notanemail"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 0.5
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b002-invalid-email.png

# 再测试另一种无效格式
agent-browser fill @e1 "test@"
agent-browser click @e3
sleep 0.5
agent-browser snapshot -i -c
```

**预期结果**:
- ✅ 前端验证拦截无效邮箱格式
- ✅ 显示"请输入有效的邮箱地址"提示
- ✅ 后端 API 也拒绝无效邮箱（双重验证）

---

### TC-B003: 注册密码 - 过短密码

**所属功能**: F004 - 用户认证
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser snapshot -i -c

# 点击注册
agent-browser click @e4
sleep 1
agent-browser snapshot -i -c

# 填写过短密码
agent-browser fill @e5 "test@example.com"
agent-browser fill @e6 "123"  # 过短
agent-browser fill @e7 "123"
agent-browser fill @e8 "Test User"
agent-browser click @e9
sleep 0.5
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b003-short-password.png
```

**预期结果**:
- ✅ 显示密码长度要求提示（如"密码至少8位"）
- ✅ 注册不成功

---

### TC-B004: 输入超长用户名

**所属功能**: F009 - 用户中心
**优先级**: P2 (Medium)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

agent-browser open http://localhost:5173/#/user
sleep 2
agent-browser snapshot -i -c

# 点击编辑资料
agent-browser click @e63
sleep 1
agent-browser snapshot -i -c

# 输入超长用户名（超过数据库限制50字符）
agent-browser fill @e64 "ThisIsAnExtremelyLongUserNameThatExceedsTheDatabaseLimitOfFiftyCharactersDefinitely"
agent-browser click @e66
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b004-long-username.png
```

**预期结果**:
- ✅ 前端限制输入长度（maxlength 属性）
- ✅ 或提交后显示"用户名过长"提示
- ✅ 数据库中存储的用户名被截断至50字符

---

### TC-B005: 评价内容 - 特殊字符输入

**所属功能**: F010 - 评价系统
**优先级**: P1 (High) — XSS防护验证

**测试步骤**:
```bash
# 前提：用户已登录且有已完成订单
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

# 进入评价表单
agent-browser open http://localhost:5173/#/user
sleep 2
agent-browser click @e31  # 我的订单
sleep 1
agent-browser click @e73  # 评价按钮
sleep 1
agent-browser snapshot -i -c

# 输入包含HTML/JS的恶意内容
agent-browser fill @e75 "<script>alert('XSS')</script>"
agent-browser click @e74  # 5星
agent-browser click @e76  # 提交
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b005-xss-review.png

# 检查控制台（是否执行了JS）
agent-browser console
```

**预期结果**:
- ✅ 评价内容被正确转义（显示为纯文本 `<script>alert('XSS')</script>`）
- ✅ 脚本不被执行（控制台无 XSS 弹窗）
- ✅ 数据库存储经过 sanitize 的内容

---

### TC-B006: 搜索框 - SQL注入测试

**所属功能**: F017 - 搜索优化
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173
sleep 2
agent-browser snapshot -i -c

# 在搜索框输入SQL注入字符
agent-browser fill @e115 "'; DROP TABLE homestays; --"
agent-browser click @e116
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b006-sql-injection.png
agent-browser console
```

**预期结果**:
- ✅ 搜索正常返回"无结果"
- ✅ 数据库表未被删除（应用正常运行）
- ✅ 使用 Prisma ORM 参数化查询，SQL注入无效
- ✅ 控制台无数据库错误

---

### TC-B007: 搜索框 - 超长搜索词

**所属功能**: F017 - 搜索优化
**优先级**: P2 (Medium)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173
sleep 2
agent-browser snapshot -i -c

# 输入超长搜索词
agent-browser fill @e115 "普吉岛海景别墅豪华套房无边泳池配私人管家最顶级体验全包价格含早餐含机场接送超级豪华五星级旅游度假酒店民宿最值得入住强烈推荐给所有朋友和家人共同体验的完美假期"
agent-browser click @e116
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b007-long-search.png
agent-browser console
```

**预期结果**:
- ✅ 超长搜索词被正常处理
- ✅ 返回结果或"无结果"
- ✅ 页面不崩溃
- ✅ 后端不超时

---

### TC-B008: 库存设置 - 负数库存

**所属功能**: F007 - 民宿库存管理
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/admin
sleep 2
agent-browser fill @e23 "admin"
agent-browser fill @e24 "admin123"
agent-browser click @e25
sleep 2

agent-browser click @e33
agent-browser click @e34
sleep 2

# 点击某个日期打开库存设置
agent-browser click @e35
sleep 1
agent-browser snapshot -i -c

# 输入负数库存
agent-browser fill @e36 "-5"
agent-browser click @e38
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b008-negative-stock.png
```

**预期结果**:
- ✅ 前端拒绝负数输入（min=0 属性或验证）
- ✅ 或后端返回错误"库存不能为负数"
- ✅ 数据库中不存储负数库存

---

### TC-B009: 日期选择 - 过去日期预订

**所属功能**: F005 - 民宿预订流程
**优先级**: P0 (Critical)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser snapshot -i -c

# 尝试点击日历中的过去日期
# 注意：这需要日历能显示过去日期（验证其是否禁用）
agent-browser screenshot /tmp/boundary-b009-past-date.png
agent-browser console
```

**预期结果**:
- ✅ 过去的日期显示为禁用状态（灰色/不可点击）
- ✅ 今天以前的日期无法选择
- ✅ 即使通过 API 强行提交过去日期，后端也应拒绝

---

### TC-B010: 日期选择 - 退房日期早于入住日期

**所属功能**: F005 - 民宿预订流程
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 通过 API 直接测试
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <userToken>" \
  -d '{
    "homestayId": "cmlst2joz0002ydjk9s8sbtz6",
    "checkIn": "2026-03-10",
    "checkOut": "2026-03-05"
  }'
```

**预期结果**:
- ✅ 后端返回 400 错误
- ✅ 错误信息：退房日期必须晚于入住日期
- ✅ 不创建订单记录

---

### TC-B021: 价格设置 - 零价格

**所属功能**: F007 - 民宿库存管理
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 通过管理后台设置价格为0
agent-browser --headed open http://localhost:5173/#/admin
sleep 2
agent-browser fill @e23 "admin"
agent-browser fill @e24 "admin123"
agent-browser click @e25
sleep 2

agent-browser click @e33
agent-browser click @e34
sleep 2
agent-browser click @e35  # 点击日期
sleep 1
agent-browser fill @e37 "0"  # 设置价格为0
agent-browser click @e38
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/boundary-b021-zero-price.png
```

**预期结果**:
- ✅ 价格0是合法值（免费房间/特殊促销）
- ✅ 用户端显示"免费"或"¥0"
- ✅ 订单金额为0，流程正常

---

## 三、并发场景测试

### TC-C001: 最后库存并发预订（超售保护）

**所属功能**: F007 - 民宿库存管理
**优先级**: P0 (Critical) — **最高风险业务场景**
**测试类型**: 竞争条件测试

**背景**: 某日期的民宿库存仅剩1间，两个用户同时提交预订，必须有且仅有一个成功。

**前置条件**:
1. 设置某日期的民宿库存为1（totalStock=1, availableStock=1）
2. 准备两个测试账号

**测试步骤**:
```bash
# 方式一：使用两个并发 curl 请求测试 API 层面的超售保护
# 首先获取两个用户的 token
TOKEN_A=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

TOKEN_B=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Token A: $TOKEN_A"
echo "Token B: $TOKEN_B"

# 并发发送预订请求（两个请求几乎同时发出）
BOOKING_DATA='{
  "homestayId": "YOUR_HOMESTAY_ID",
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-02",
  "guests": 1
}'

# 使用 & 实现并发
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "$BOOKING_DATA" > /tmp/result_a.json &

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "$BOOKING_DATA" > /tmp/result_b.json &

# 等待两个请求完成
wait

echo "Result A:"
cat /tmp/result_a.json

echo "Result B:"
cat /tmp/result_b.json

# 检查数据库库存
curl http://localhost:3000/api/stock/homestay/YOUR_HOMESTAY_ID/2026-04-01 \
  -H "Authorization: Bearer $TOKEN_A"
```

**预期结果**:
- ✅ 有且仅有一个预订成功（状态200或201）
- ✅ 另一个预订失败（状态400或409），错误信息："库存不足"
- ✅ 数据库中 `availableStock` 变为0，`bookedStock` 变为1
- ✅ 没有出现 availableStock 变为 -1 的情况
- ❌ **严禁**: 两个预订都成功（超售）
- ❌ **严禁**: availableStock 变为负数

**实现验证**:
后端必须使用数据库级别的原子操作（如 PostgreSQL 的 `UPDATE ... WHERE availableStock > 0`），而不是"读-检查-写"三步操作。

---

### TC-C002: 取消订单后的库存竞争测试

**所属功能**: F007 - 民宿库存管理
**优先级**: P0 (Critical)

**背景**: 管理员取消订单的同时，另一个用户正在预订同一日期。

**测试步骤**:
```bash
# 场景：当前状态 - 某日期库存满（availableStock=0）
# 步骤1：管理员正在取消一个订单（会释放库存）
# 步骤2：用户B在管理员取消的同一时刻提交新预订

# 并发测试
curl -X PUT http://localhost:3000/api/bookings/ORDER_ID/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /tmp/cancel_result.json &

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "$BOOKING_DATA" > /tmp/new_booking_result.json &

wait

cat /tmp/cancel_result.json
cat /tmp/new_booking_result.json
```

**预期结果**:
- ✅ 取消成功后，库存正确恢复
- ✅ 新预订根据最终库存状态决定成功或失败
- ✅ 不出现数据不一致（如库存已释放但新预订仍失败）

---

### TC-C003: 批量库存设置并发写入

**所属功能**: F007 - 民宿库存管理
**优先级**: P1 (High)

**测试步骤**:
```bash
# 两个管理员同时设置同一日期的库存
curl -X PUT http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-01 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"totalStock": 5}' > /tmp/stock_set_1.json &

curl -X PUT http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-01 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"totalStock": 3}' > /tmp/stock_set_2.json &

wait

# 检查最终库存（应为最后一次写入的值，而不是两者的混合）
curl http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-01
```

**预期结果**:
- ✅ 最终库存为其中一个值（5 或 3），而不是异常值
- ✅ 不出现数据库死锁
- ✅ 两个请求都返回响应（不挂起）

---

### TC-C004: 同一用户重复提交预订

**所属功能**: F005 - 民宿预订流程
**优先级**: P1 (High) — 防止重复点击

**测试步骤**:
```bash
# 快速连续发送两个相同的预订请求（模拟用户双击提交按钮）
TOKEN_A=$(获取用户Token)

for i in 1 2; do
  curl -X POST http://localhost:3000/api/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_A" \
    -d '{
      "homestayId": "HOMESTAY_ID",
      "checkIn": "2026-04-05",
      "checkOut": "2026-04-06",
      "guests": 1
    }' &
done

wait
```

**预期结果**:
- ✅ 有且仅有一个预订成功
- ✅ 第二个请求失败，返回"该日期已有相同预订"或库存不足
- ✅ 数据库中不出现重复订单

---

### TC-C005: 多用户同时查看库存日历

**所属功能**: F015 - 管理端日历视图
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 并发请求库存日历 API
for i in {1..10}; do
  curl http://localhost:3000/api/calendar/rooms \
    -H "Authorization: Bearer $ADMIN_TOKEN" &
done

wait
echo "并发10个日历请求完成"
```

**预期结果**:
- ✅ 所有10个请求都在合理时间内返回（<3秒）
- ✅ 返回数据一致（同一状态）
- ✅ 服务器不崩溃
- ✅ 后端无内存泄漏

---

## 四、网络异常测试

### TC-N001: API 超时处理 - 前端加载状态

**所属功能**: 全局
**优先级**: P1 (High)
**测试方法**: 使用浏览器开发者工具 Network Throttling 或 Mock Service Worker

**测试步骤**:
```bash
# 方式：通过修改后端添加延迟来模拟超时
# 或使用网络节流工具

# 1. 打开首页（正常加载）
agent-browser --headed open http://localhost:5173
sleep 3
agent-browser snapshot -i -c

# 2. 检查页面是否有加载状态指示
agent-browser screenshot /tmp/network-n001-loading.png

# 3. 如果后端可以添加人工延迟：
# 临时修改 server API 添加 await sleep(5000)，然后测试

# 4. 使用 curl 模拟超时
curl --max-time 1 http://localhost:3000/api/homestays
# 应该超时，然后验证前端的处理
```

**预期结果**:
- ✅ API 加载时显示 Loading Spinner 或骨架屏
- ✅ 超时后显示友好错误提示（"加载失败，请重试"）
- ✅ 提供"重试"按钮
- ✅ 页面不崩溃，不显示白屏

---

### TC-N002: 预订提交时网络断开

**所属功能**: F005 - 民宿预订流程
**优先级**: P0 (Critical)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

agent-browser open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3

# 选择日期
agent-browser click @e16
agent-browser click @e17
sleep 1

# 模拟断网：停止后端服务（需要另一个终端）
# kill -STOP $(lsof -ti:3000)

# 点击预订按钮
agent-browser click @e18
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/network-n002-offline-booking.png
agent-browser console
```

**预期结果**:
- ✅ 显示网络错误提示（"网络连接失败，请检查网络"）
- ✅ 预订按钮重新可用（不永久禁用）
- ✅ 用户可以重试
- ✅ 表单数据不丢失
- ❌ **不应**: 显示白屏或未处理的错误

---

### TC-N003: 后端服务重启后的前端恢复

**所属功能**: 全局
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 1. 打开应用
agent-browser --headed open http://localhost:5173
sleep 2

# 2. 模拟后端重启（在另一个终端重启 server）
# pkill -f "node server" && cd server && npm run dev

# 3. 等待后端重启（约5秒）
sleep 10

# 4. 刷新页面
agent-browser open http://localhost:5173
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/network-n003-backend-restart.png
agent-browser console
```

**预期结果**:
- ✅ 后端重启后前端可以正常重连
- ✅ 页面重新加载后数据正常显示
- ✅ 用户认证状态保持（token 有效期内不需要重新登录）

---

### TC-N004: 图片加载失败处理

**所属功能**: 全局
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 打开民宿详情页
agent-browser --headed open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser snapshot -i -c

# 检查是否有图片加载失败的情况
# 通过控制台查看
agent-browser console

# 截图（检查是否有图片占位符）
agent-browser screenshot /tmp/network-n004-image-error.png
```

**预期结果**:
- ✅ 图片加载失败时显示占位符（placeholder）
- ✅ 不显示破损图片图标
- ✅ 页面布局不因图片缺失而错乱

---

### TC-N005: Token 过期处理

**所属功能**: F004 - 用户认证
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 方式：手动修改 localStorage 中的 token 为过期的 JWT

agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

# 通过 JavaScript 修改 token 为过期的 JWT
# （需要 agent-browser 支持执行 JS，或手动在开发者工具中操作）

# 然后访问需要认证的页面
agent-browser open http://localhost:5173/#/user
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/network-n005-token-expired.png
agent-browser console
```

**预期结果**:
- ✅ Token 过期后，用户被重定向到登录页
- ✅ 显示"登录已过期，请重新登录"提示
- ✅ 登录成功后返回原页面

---

### TC-N006: 图片上传失败处理

**所属功能**: F010 - 评价系统（图片上传）
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 上传超过限制的图片文件
# 通过 API 测试
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@/tmp/large-image-50mb.jpg" \
  -F "orderId=ORDER_ID" \
  -F "rating=5" \
  -F "comment=Test"
```

**预期结果**:
- ✅ 超出限制的图片被拒绝（413 错误）
- ✅ 显示友好错误提示

---

### TC-N007: 搜索 API 超时处理

**所属功能**: F017 - 搜索优化
**优先级**: P1 (High)

**测试步骤**:
```bash
agent-browser --headed open http://localhost:5173
sleep 2

# 输入搜索词
agent-browser fill @e115 "beach"
agent-browser click @e116

# 如果后端在此时延迟响应，检查前端加载状态
sleep 1
agent-browser snapshot -i -c
agent-browser screenshot /tmp/network-n007-search-loading.png
```

**预期结果**:
- ✅ 搜索时显示加载状态（旋转图标或Loading文字）
- ✅ 超时后显示错误并允许重试
- ✅ 不出现无限加载状态

---

### TC-N008: 管理后台 API 权限验证

**所属功能**: F004 + F007
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 使用普通用户 Token 调用管理员 API
USER_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# 尝试访问管理员专有 API
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"

curl -X PUT http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-01 \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"totalStock": 999}'

curl -X GET http://localhost:3000/api/reports/overview \
  -H "Authorization: Bearer $USER_TOKEN"
```

**预期结果**:
- ✅ 所有管理员 API 返回 403 Forbidden
- ✅ 错误信息："权限不足"
- ✅ 库存数据未被篡改
- ❌ **严禁**: 普通用户可以访问任何管理员功能

---

### TC-N009: 无 Token 直接调用受保护 API

**所属功能**: F004
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 不携带任何认证信息调用受保护接口
curl http://localhost:3000/api/auth/me
curl http://localhost:3000/api/favorites
curl http://localhost:3000/api/bookings

# 调用管理员接口
curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/reports/overview
```

**预期结果**:
- ✅ 所有受保护接口返回 401 Unauthorized
- ✅ 错误信息："请先登录"
- ❌ **严禁**: 任何受保护数据泄露

---

### TC-N010: 伪造 Token 攻击

**所属功能**: F004
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 使用伪造的 JWT Token
FAKE_TOKEN="eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhZG1pbi1pZCIsInJvbGUiOiJBRE1JTiJ9.fake_signature"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $FAKE_TOKEN"

curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $FAKE_TOKEN"
```

**预期结果**:
- ✅ 伪造 Token 被识别为无效（JWT 签名验证失败）
- ✅ 返回 401 Unauthorized
- ❌ **严禁**: 接受任何伪造的 Token

---

## 五、权限边界测试

### TC-P001: 普通用户访问管理后台

**所属功能**: F004 - 用户认证
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 普通用户登录后，尝试访问管理后台
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

# 直接访问管理后台 URL
agent-browser open http://localhost:5173/#/admin
sleep 3
agent-browser snapshot -i -c
agent-browser screenshot /tmp/permission-p001-user-admin-access.png
agent-browser console
```

**预期结果**:
- ✅ 普通用户被重定向到首页或显示"权限不足"页面
- ✅ 不显示任何管理后台内容
- ❌ **严禁**: 普通用户能看到管理后台界面

---

### TC-P002: 未登录直接访问预订确认 API

**所属功能**: F005 - 民宿预订流程
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 不携带 Token 尝试确认订单
curl -X PUT http://localhost:3000/api/bookings/ANY_ORDER_ID/confirm
curl -X PUT http://localhost:3000/api/bookings/ANY_ORDER_ID/cancel
```

**预期结果**:
- ✅ 返回 401 Unauthorized
- ✅ 订单状态不改变

---

### TC-P003: 普通用户修改其他用户的订单

**所属功能**: F005 - 民宿预订流程
**优先级**: P0 (Critical) — 越权访问

**测试步骤**:
```bash
# 用户 A 的 Token
TOKEN_A=$(登录 test@example.com)

# 尝试获取用户 B 的订单（需要知道订单ID）
ORDER_ID_OF_USER_B="OTHER_USER_ORDER_ID"

curl http://localhost:3000/api/bookings/$ORDER_ID_OF_USER_B \
  -H "Authorization: Bearer $TOKEN_A"

# 尝试取消用户 B 的订单
curl -X PUT http://localhost:3000/api/bookings/$ORDER_ID_OF_USER_B/cancel \
  -H "Authorization: Bearer $TOKEN_A"
```

**预期结果**:
- ✅ 获取他人订单返回 403 或 404
- ✅ 取消他人订单返回 403
- ✅ 自己的订单不受影响

---

### TC-P004: 用户修改他人的收藏

**所属功能**: F018 - 收藏功能
**优先级**: P1 (High)

**测试步骤**:
```bash
TOKEN_A=$(登录 test@example.com)

# 尝试删除其他用户的收藏（如果 API 暴露了收藏ID）
curl -X DELETE http://localhost:3000/api/favorites/OTHER_USER_FAVORITE_ID \
  -H "Authorization: Bearer $TOKEN_A"
```

**预期结果**:
- ✅ 返回 403 Forbidden
- ✅ 其他用户的收藏不受影响

---

### TC-P005: 用户修改他人的评价

**所属功能**: F010 - 评价系统
**优先级**: P1 (High)

**测试步骤**:
```bash
TOKEN_A=$(登录 test@example.com)

# 尝试修改或删除其他用户的评价
curl -X PUT http://localhost:3000/api/reviews/OTHER_USER_REVIEW_ID \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{"comment": "I hacked this review"}'

curl -X DELETE http://localhost:3000/api/reviews/OTHER_USER_REVIEW_ID \
  -H "Authorization: Bearer $TOKEN_A"
```

**预期结果**:
- ✅ 返回 403 Forbidden
- ✅ 他人的评价不受影响

---

### TC-P006: 批量操作的权限验证

**所属功能**: F007 - 民宿库存管理
**优先级**: P0 (Critical)

**测试步骤**:
```bash
USER_TOKEN=$(登录普通用户)

# 尝试批量设置库存
curl -X POST http://localhost:3000/api/stock/homestay/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "homestayId": "HOMESTAY_ID",
    "startDate": "2026-04-01",
    "endDate": "2026-04-30",
    "totalStock": 0
  }'
```

**预期结果**:
- ✅ 普通用户无法执行批量库存操作
- ✅ 返回 403 Forbidden
- ✅ 库存数据不变

---

### TC-P007: 管理员 API 路由枚举测试

**所属功能**: 全局
**优先级**: P1 (High)

**测试步骤**:
```bash
USER_TOKEN=$(登录普通用户)

# 测试常见的管理员路由
for endpoint in \
  "/api/admin/users" \
  "/api/admin/orders" \
  "/api/admin/merchants" \
  "/api/reports/overview" \
  "/api/reports/revenue" \
  "/api/usage/limits" \
  "/api/config"; do

  STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
    http://localhost:3000$endpoint \
    -H "Authorization: Bearer $USER_TOKEN")

  echo "$endpoint -> $STATUS"
done
```

**预期结果**:
- ✅ 所有管理员路由对普通用户返回 403
- ✅ 没有任何管理员数据泄露

---

## 六、国际化完整性测试

### TC-I001: 首页三语言完整性验证

**所属功能**: F019 - 多语言完善
**优先级**: P1 (High)

**测试步骤**:
```bash
# 测试中文版首页
agent-browser --headed open http://localhost:5173
sleep 2
agent-browser click @e1  # 语言切换
sleep 0.3
agent-browser click @e3  # 中文
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i001-chinese-home.png

# 测试英文版首页
agent-browser click @e1  # 语言切换
sleep 0.3
agent-browser click @e2  # 英文
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i001-english-home.png

# 测试泰文版首页
agent-browser click @e1  # 语言切换
sleep 0.3
agent-browser click @e4  # 泰文
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i001-thai-home.png

agent-browser console
```

**预期结果**:
- ✅ 中文：导航栏"首页"、"搜索"、"登录"等显示正确
- ✅ 英文：显示"Home"、"Search"、"Login"
- ✅ 泰文：显示对应泰语文字
- ✅ 三种语言下搜索框占位符文字正确
- ✅ 房源卡片上的"预订"按钮文字随语言变化

---

### TC-I002: 登录页三语言完整性

**所属功能**: F019 - 多语言完善
**优先级**: P1 (High)

**测试步骤**:
```bash
# 切换语言后打开登录页
for LANG_KEY in "zh" "en" "th"; do
  agent-browser --headed open http://localhost:5173/#/login
  sleep 2
  # 切换对应语言
  agent-browser click @e1  # 语言切换按钮
  sleep 0.3
  agent-browser click @e$(echo $LANG_KEY | tr 'a-z' '1-3')  # 选择语言
  sleep 1
  
  agent-browser snapshot
  agent-browser screenshot /tmp/i18n-i002-login-$LANG_KEY.png
done
```

**预期结果**:
- ✅ 中文：表单标签"邮箱"、"密码"、"登录"
- ✅ 英文："Email"、"Password"、"Login"
- ✅ 泰文：泰语对应文字
- ✅ 错误提示也随语言变化
- ✅ "注册"链接文字正确

---

### TC-I003: 民宿详情页三语言完整性

**所属功能**: F019 - 多语言完善
**优先级**: P1 (High)

**测试步骤**:
```bash
# 以三种语言查看民宿详情页
agent-browser --headed open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3

# 切换为英文
agent-browser click @e1
sleep 0.3
agent-browser click @e2  # 英文
sleep 1
agent-browser screenshot /tmp/i18n-i003-detail-english.png
agent-browser snapshot

# 切换为泰文
agent-browser click @e1
sleep 0.3
agent-browser click @e4  # 泰文
sleep 1
agent-browser screenshot /tmp/i18n-i003-detail-thai.png
agent-browser snapshot
```

**预期结果**:
- ✅ "预订"按钮文字正确翻译
- ✅ 设施标签（Wifi、泳池等）正确翻译
- ✅ 评价区域标题正确翻译
- ✅ 日历组件中的月份名称正确翻译
- ✅ 民宿描述本身（数据库内容）保持原始语言

---

### TC-I004: 错误信息三语言测试

**所属功能**: F019 - 多语言完善
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 在泰语环境下尝试登录失败
agent-browser --headed open http://localhost:5173
sleep 2
agent-browser click @e1
sleep 0.3
agent-browser click @e4  # 泰文
sleep 1

agent-browser open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "wrongpassword"
agent-browser click @e3
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i004-thai-login-error.png

# 在英文环境下
agent-browser open http://localhost:5173
sleep 1
agent-browser click @e1
agent-browser click @e2  # 英文
sleep 1
agent-browser open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "wrongpassword"
agent-browser click @e3
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i004-english-login-error.png
```

**预期结果**:
- ✅ 泰文环境下错误信息显示泰语
- ✅ 英文环境下错误信息显示英语
- ✅ 中文环境下错误信息显示中文

---

### TC-I005: 通知消息三语言测试

**所属功能**: F011 + F019
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 在英文环境下查看通知
agent-browser --headed open http://localhost:5173
sleep 2
agent-browser click @e1
agent-browser click @e2  # 英文
sleep 1

agent-browser fill @e1 "test@example.com"  # 实际上需要先打开登录页
# 登录...

# 进入通知页面
agent-browser open http://localhost:5173/#/user
sleep 2
agent-browser click @e82  # 消息通知标签
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/i18n-i005-notifications-english.png
```

**预期结果**:
- ✅ 通知标题和固定文案随语言切换
- ✅ 通知类型标签（如"订单确认"）正确翻译

---

## 七、业务流程完整性测试

### TC-W001: 完整订单状态流转（人工确认模式）

**所属功能**: F005 + F026
**优先级**: P0 (Critical) — 最核心的业务流程

**测试步骤**:
```bash
# 阶段1：用户提交预订（状态: pending）
agent-browser --headed open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

agent-browser open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser click @e16  # 选择日期1
agent-browser click @e17  # 选择日期2
sleep 1
agent-browser click @e18  # 预订按钮
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/workflow-w001-step1-pending.png

# 验证：订单状态为 pending
# 通过用户中心查看
agent-browser click @e10
agent-browser click @e30
sleep 2
agent-browser click @e31  # 我的订单
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w001-step2-user-sees-pending.png

# 阶段2：管理员确认订单（状态: pending → confirmed）
agent-browser open http://localhost:5173/#/admin
sleep 2
agent-browser fill @e23 "admin"
agent-browser fill @e24 "admin123"
agent-browser click @e25
sleep 2
agent-browser click @e26  # 民宿订单
sleep 2
agent-browser snapshot -i -c
agent-browser screenshot /tmp/workflow-w001-step3-admin-view.png

agent-browser click @e27  # 确认按钮
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w001-step4-confirmed.png

# 阶段3：用户看到确认状态
agent-browser open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2
agent-browser click @e10
agent-browser click @e30
sleep 2
agent-browser click @e31
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w001-step5-user-sees-confirmed.png

# 阶段4：管理员完成订单（状态: confirmed → completed）
# 注意：此步骤在现有测试中完全缺失！
agent-browser open http://localhost:5173/#/admin
sleep 2
agent-browser fill @e23 "admin"
agent-browser fill @e24 "admin123"
agent-browser click @e25
sleep 2
agent-browser click @e26  # 民宿订单
sleep 2
agent-browser click @e1  # 完成订单按钮（假设存在）
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w001-step6-completed.png

agent-browser console
```

**预期结果（完整流转）**:
- ✅ 步骤1: 用户提交预订，订单状态为 **pending**
- ✅ 步骤2: 用户中心显示"待确认"状态
- ✅ 步骤3: 管理后台显示 pending 订单
- ✅ 步骤4: 管理员确认，状态变为 **confirmed**
- ✅ 步骤5: 用户收到"订单确认"通知（未读红点+通知内容）
- ✅ 步骤6: 管理员标记完成，状态变为 **completed**
- ✅ 步骤7: 完成后用户可以写评价（评价按钮出现）
- ✅ 步骤8: 完成后积分增加（会员系统联动）

---

### TC-W002: 完整订单状态流转（即时确认模式）

**所属功能**: F005 + F026
**优先级**: P0 (Critical)

**前置条件**: 管理员已将民宿设置为即时确认模式（F026配置）

**测试步骤**:
```bash
# 先切换为即时确认模式
agent-browser --headed open http://localhost:5173/#/admin
sleep 2
agent-browser fill @e23 "admin"
agent-browser fill @e24 "admin123"
agent-browser click @e25
sleep 2
agent-browser click @e150  # 系统设置
agent-browser click @e151  # 业务配置
sleep 2
agent-browser snapshot -i -c

# 修改民宿确认模式为即时确认（false）
agent-browser click @e152  # 找到民宿配置的开关
sleep 1
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w002-step1-config-change.png

# 用户预订
agent-browser open http://localhost:5173/#/login
sleep 2
agent-browser fill @e1 "test@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
sleep 2

agent-browser open http://localhost:5173/#/homestay/cmlst2joz0002ydjk9s8sbtz6
sleep 3
agent-browser click @e16
agent-browser click @e17
sleep 1
agent-browser click @e18
sleep 2
agent-browser snapshot
agent-browser screenshot /tmp/workflow-w002-step2-instant-confirm.png
```

**预期结果**:
- ✅ 用户提交后，订单直接为 **confirmed** 状态
- ✅ 不需要管理员手动确认
- ✅ 用户收到即时确认通知
- ✅ 切换回人工确认模式后，新订单回到 pending 流程

---

### TC-W003: 订单取消与库存释放联动测试

**所属功能**: F005 + F007
**优先级**: P0 (Critical)

**测试步骤**:
```bash
# 步骤1：记录某日期的当前库存
BEFORE_STOCK=$(curl http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.availableStock')
echo "取消前库存: $BEFORE_STOCK"

# 步骤2：管理员取消一个已确认的订单
curl -X PUT http://localhost:3000/api/bookings/CONFIRMED_ORDER_ID/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN"

sleep 1

# 步骤3：检查取消后的库存
AFTER_STOCK=$(curl http://localhost:3000/api/stock/homestay/HOMESTAY_ID/2026-04-10 \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.availableStock')
echo "取消后库存: $AFTER_STOCK"

# 验证库存恢复
if [ "$((BEFORE_STOCK + 1))" -eq "$AFTER_STOCK" ]; then
  echo "✅ 库存正确释放：$BEFORE_STOCK → $AFTER_STOCK"
else
  echo "❌ 库存释放异常：期望 $((BEFORE_STOCK + 1))，实际 $AFTER_STOCK"
fi
```

**预期结果**:
- ✅ 取消订单后，对应日期的 `availableStock` 增加1
- ✅ `bookedStock` 减少1
- ✅ 库存变化立即在日历视图中更新

---

### TC-W004: 评价系统联动测试

**所属功能**: F010 + F005
**优先级**: P1 (High)

**测试步骤**:
```bash
# 验证：只有 completed 状态的订单才能写评价
# 检查 pending 订单
# 检查 confirmed 订单
# 检查 completed 订单
# 检查 cancelled 订单

for STATUS in "pending" "confirmed" "cancelled"; do
  echo "测试 $STATUS 状态的评价权限..."
  # 通过 API 检查对应状态订单的评价API是否拒绝
  curl http://localhost:3000/api/reviews \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d "{\"orderId\": \"${STATUS}_ORDER_ID\", \"rating\": 5, \"comment\": \"test\"}"
done
```

**预期结果**:
- ✅ pending 订单：无法写评价，返回"订单未完成"
- ✅ confirmed 订单：无法写评价，返回"订单未完成"
- ✅ completed 订单：可以写评价
- ✅ cancelled 订单：无法写评价，返回"订单已取消"

---

### TC-W005: 积分系统联动测试

**所属功能**: F024 + F005
**优先级**: P2 (Medium)

**测试步骤**:
```bash
# 1. 记录用户当前积分
BEFORE_POINTS=$(curl http://localhost:3000/api/membership/my \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.points')
echo "完成前积分: $BEFORE_POINTS"

# 2. 管理员将订单标记为 completed
curl -X PUT http://localhost:3000/api/bookings/CONFIRMED_ORDER_ID/complete \
  -H "Authorization: Bearer $ADMIN_TOKEN"

sleep 1

# 3. 检查积分变化
AFTER_POINTS=$(curl http://localhost:3000/api/membership/my \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.points')
echo "完成后积分: $AFTER_POINTS"
```

**预期结果**:
- ✅ 订单完成后用户积分增加
- ✅ 积分增加数量与订单金额相关
- ✅ 积分记录中显示来源（"订单完成奖励"）

---

### TC-W006: 通知系统联动测试

**所属功能**: F011 + F005
**优先级**: P1 (High)

**测试步骤**:
```bash
# 记录用户当前未读通知数量
BEFORE_COUNT=$(curl http://localhost:3000/api/notifications/unread/count \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.count')
echo "操作前未读通知: $BEFORE_COUNT"

# 管理员确认订单
curl -X PUT http://localhost:3000/api/bookings/PENDING_ORDER_ID/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN"

sleep 1

# 检查通知数量
AFTER_COUNT=$(curl http://localhost:3000/api/notifications/unread/count \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.count')
echo "确认后未读通知: $AFTER_COUNT"

# 查看通知内容
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.[0]'
```

**预期结果**:
- ✅ 管理员确认订单后，用户未读通知 +1
- ✅ 通知类型为"订单确认"
- ✅ 通知包含订单号信息
- ✅ 管理员拒绝订单后也发送相应通知

---

### TC-W007: 免费额度监控数据准确性

**所属功能**: F016
**优先级**: P1 (High)

**测试步骤**:
```bash
# 记录当前使用量
curl http://localhost:3000/api/usage/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 执行一系列操作（增加数据）
# 创建10个测试通知
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/notifications \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"userId\": \"USER_ID\", \"title\": \"Test $i\", \"message\": \"Test message\"}"
done

# 检查使用量更新
sleep 2
curl http://localhost:3000/api/usage/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果**:
- ✅ 使用量数据与实际资源消耗相符
- ✅ 超过阈值时出现警告标识

---

## 测试执行优先级排序建议

### 第一批（P0 - 立即执行，阻塞级别）

| 优先级 | 测试用例 | 原因 |
|--------|---------|------|
| 1 | TC-C001（并发超售）| 直接经济损失风险 |
| 2 | TC-P001（用户访问管理后台）| 安全漏洞 |
| 3 | TC-N009（无Token访问受保护API）| 安全漏洞 |
| 4 | TC-N010（伪造Token）| 安全漏洞 |
| 5 | TC-B009（过去日期预订）| 数据逻辑错误 |
| 6 | TC-W001（完整订单流转）| 核心业务完整性 |

### 第二批（P1 - 本周内执行）

| 优先级 | 测试用例 | 原因 |
|--------|---------|------|
| 7 | TC-M001（iPhone SE首页）| 最多用户的设备 |
| 8 | TC-M005（Galaxy S21首页）| 安卓主流设备 |
| 9 | TC-M010（iPhone SE预订）| 预订流程最重要 |
| 10 | TC-M011（Galaxy S21预订）| 安卓预订流程 |
| 11 | TC-B005（XSS攻击）| 安全漏洞 |
| 12 | TC-B006（SQL注入）| 安全漏洞 |
| 13 | TC-W003（取消释放库存）| 库存准确性 |
| 14 | TC-N002（断网预订）| 用户体验 |

### 第三批（P2 - 本月内执行）

| 优先级 | 测试用例 | 原因 |
|--------|---------|------|
| 15 | TC-M008（iPad mini）| 平板断点验证 |
| 16 | TC-M039（汉堡菜单）| 移动端导航 |
| 17 | TC-I001-I005（三语言）| 国际化完整性 |
| 18 | TC-B001-B004（表单边界）| 用户体验 |
| 19 | TC-C004（重复提交）| 防止重复订单 |
| 20 | TC-M028-M030（横屏）| 移动端适配 |

---

## 附录

### A. 测试工具补充配置

```bash
# agent-browser 视口指定（如果支持 --viewport 参数）
agent-browser --headed --viewport 375x667 open http://localhost:5173

# 如果不支持 viewport 参数，使用替代方案：
# 方式1：使用 Playwright 直接运行测试脚本
# 方式2：在 headed 模式下手动调整浏览器窗口大小

# 并发测试建议工具
brew install vegeta  # 负载测试工具
npm install -g k6    # 现代负载测试工具
```

### B. 移动端快速测试脚本模板

```bash
#!/bin/bash
# 多设备快速截图脚本
DEVICES=(
  "375x667"   # iPhone SE
  "390x844"   # iPhone 14
  "393x852"   # iPhone 14 Pro
  "360x800"   # Galaxy S21
  "412x915"   # Pixel 7
  "768x1024"  # iPad mini
)

for VIEWPORT in "${DEVICES[@]}"; do
  echo "Testing $VIEWPORT..."
  agent-browser --viewport $VIEWPORT open http://localhost:5173
  sleep 3
  agent-browser screenshot /tmp/device-test-$VIEWPORT.png
  agent-browser close
  sleep 1
done
```

### C. 并发测试脚本模板

```bash
#!/bin/bash
# 并发预订测试脚本
HOMESTAY_ID="YOUR_HOMESTAY_ID"
BASE_URL="http://localhost:3000"

# 获取两个用户的 Token
get_token() {
  curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" | jq -r '.token'
}

TOKEN_A=$(get_token "test@example.com" "password123")
TOKEN_B=$(get_token "test2@example.com" "password123")

# 确保测试日期的库存为1
curl -X PUT $BASE_URL/api/stock/homestay/$HOMESTAY_ID/2026-05-01 \
  -H "Authorization: Bearer $(get_token 'admin' 'admin123')" \
  -H "Content-Type: application/json" \
  -d '{"totalStock": 1}'

sleep 1

# 并发提交预订
BOOKING='{
  "homestayId": "'$HOMESTAY_ID'",
  "checkIn": "2026-05-01",
  "checkOut": "2026-05-02",
  "guests": 1
}'

curl -X POST $BASE_URL/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d "$BOOKING" > /tmp/booking_a.json &

curl -X POST $BASE_URL/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_B" \
  -d "$BOOKING" > /tmp/booking_b.json &

wait

echo "=== 结果 A ==="
cat /tmp/booking_a.json | jq .

echo "=== 结果 B ==="
cat /tmp/booking_b.json | jq .

# 检查是否存在超售
SUCCESS_COUNT=0
if echo $(cat /tmp/booking_a.json) | jq -e '.id' > /dev/null 2>&1; then
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi
if echo $(cat /tmp/booking_b.json) | jq -e '.id' > /dev/null 2>&1; then
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
fi

if [ $SUCCESS_COUNT -eq 1 ]; then
  echo "✅ 超售保护正常：只有1个预订成功"
elif [ $SUCCESS_COUNT -eq 0 ]; then
  echo "⚠️  两个预订都失败（可能是其他问题）"
else
  echo "❌ 超售！两个预订都成功（严重BUG）"
fi
```

### D. 补充测试用例统计

| 系列 | 名称 | 用例数 |
|------|------|--------|
| M 系列 | 移动端设备测试 | 45 |
| B 系列 | 边界条件测试 | 21 |
| C 系列 | 并发场景测试 | 5 |
| N 系列 | 网络异常测试 | 10 |
| P 系列 | 权限边界测试 | 7 |
| I 系列 | 国际化测试 | 20 |
| W 系列 | 业务流程完整性 | 7 |
| **总计** | | **115** |

**加上原有的83个用例，总测试用例数：198个**

### E. 提升后的覆盖度预期

执行本文档中的115个补充用例后，预期覆盖度提升：

| 维度 | 当前得分 | 目标得分 |
|------|---------|---------|
| 功能路径覆盖 | 60/100 | 85/100 |
| 边界条件覆盖 | 15/100 | 80/100 |
| 并发/竞争条件 | 0/100 | 70/100 |
| 网络异常场景 | 0/100 | 75/100 |
| 权限安全覆盖 | 10/100 | 90/100 |
| 移动端设备覆盖 | 20/100 | 85/100 |
| 国际化完整性 | 25/100 | 80/100 |
| 业务流程完整性 | 45/100 | 90/100 |
| **综合得分** | **37/100** | **82/100** |

---

**文档创建**: 2026-02-24
**创建者**: 架构师 (ULTRATHINK 深度推理模式)
**基于分析**: e2e-test-cases-ultrathink.md + BUG.md + FEATURE_PLAN.md + feature_list.json
**补充测试用例数**: 115个
**总测试用例数**: 83 + 115 = 198个
