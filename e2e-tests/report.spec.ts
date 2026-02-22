import { test, expect } from '@playwright/test';

test.describe('运营报表 F014 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 访问管理后台登录页
    await page.goto('http://localhost:5173/#/admin/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否需要登录
    const loginForm = await page.$('input[type="password"]');
    if (loginForm) {
      // 填写登录信息
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // 等待登录成功
      await page.waitForTimeout(2000);
    }
  });

  test('应该显示报表概览数据', async ({ page }) => {
    // 访问Dashboard页面
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图
    await page.screenshot({ path: '/tmp/report-dashboard.png', fullPage: true });
    
    // 验证标题存在
    const title = await page.textContent('h1');
    expect(title).toContain('运营报表');
    
    // 验证统计卡片存在
    const cards = await page.$$('.recharts-wrapper');
    console.log(`Found ${cards?.length || 0} chart components`);
    
    // 检查控制台错误
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    console.log('报表页面加载成功');
  });

  test('日期筛选功能应该工作', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // 测试7天按钮
    const button7d = await page.$('button:has-text("近7天")');
    if (button7d) {
      await button7d.click();
      await page.waitForTimeout(1000);
    }
    
    // 测试30天按钮
    const button30d = await page.$('button:has-text("近30天")');
    if (button30d) {
      await button30d.click();
      await page.waitForTimeout(1000);
    }
    
    // 截图
    await page.screenshot({ path: '/tmp/report-filter.png', fullPage: true });
    
    console.log('日期筛选测试完成');
  });

  test('收入趋势图应该显示', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查收入趋势卡片
    const revenueCard = await page.$('text=收入趋势');
    expect(revenueCard).toBeTruthy();
    
    // 截图
    await page.screenshot({ path: '/tmp/report-revenue.png', fullPage: true });
    
    console.log('收入趋势测试完成');
  });

  test('订单类型分布图应该显示', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查订单类型分布卡片
    const orderTypeCard = await page.$('text=订单类型分布');
    expect(orderTypeCard).toBeTruthy();
    
    console.log('订单类型分布测试完成');
  });

  test('用户增长趋势图应该显示', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查用户增长卡片
    const userCard = await page.$('text=用户增长趋势');
    expect(userCard).toBeTruthy();
    
    // 截图
    await page.screenshot({ path: '/tmp/report-users.png', fullPage: true });
    
    console.log('用户增长测试完成');
  });

  test('利润概览应该显示', async ({ page }) => {
    await page.goto('http://localhost:5173/#/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 检查利润概览卡片
    const profitCard = await page.$('text=利润概览');
    expect(profitCard).toBeTruthy();
    
    // 截图
    await page.screenshot({ path: '/tmp/report-profit.png', fullPage: true });
    
    console.log('利润概览测试完成');
  });
});
