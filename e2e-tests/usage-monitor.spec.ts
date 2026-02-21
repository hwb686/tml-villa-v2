/**
 * F016 免费额度监控功能测试
 * Free Quota Monitoring Feature Test
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173/#/admin';

test.describe('F016 - 免费额度监控', () => {
  
  test.beforeEach(async ({ page }) => {
    // 登录管理后台
    await page.goto(ADMIN_URL);
    
    // 等待登录页面加载
    await page.waitForSelector('input[type="text"], input[placeholder*="用户名"]', { timeout: 10000 });
    
    // 输入登录信息
    await page.fill('input[type="text"], input[placeholder*="用户名"]', 'admin');
    await page.fill('input[type="password"], input[placeholder*="密码"]', 'admin123');
    
    // 点击登录按钮
    await page.click('button:has-text("登录")');
    
    // 等待跳转到仪表板
    await page.waitForURL(/#\/admin\/dashboard/, { timeout: 10000 });
  });

  test('导航栏应显示"额度监控"菜单项', async ({ page }) => {
    // 验证侧边栏有额度监控菜单
    await expect(page.locator('text=额度监控')).toBeVisible();
  });

  test('应能从侧边栏进入额度监控页面', async ({ page }) => {
    // 点击额度监控菜单
    await page.click('text=额度监控');
    
    // 验证URL变化
    await page.waitForURL(/#\/admin\/usage-monitor/, { timeout: 5000 });
    expect(page.url()).toContain('usage-monitor');
    
    // 截图
    await page.screenshot({ path: 'test-results/usage-monitor-page.png' });
  });

  test('额度监控页面应显示标题和说明', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/usage-monitor`);
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    await expect(page.locator('h1:has-text("免费额度监控")')).toBeVisible();
    
    // 验证说明文字
    await expect(page.locator('text=Supabase / Netlify / Render')).toBeVisible();
  });

  test('额度监控页面应显示服务使用情况卡片', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/usage-monitor`);
    await page.waitForLoadState('networkidle');
    
    // 等待数据加载
    await page.waitForTimeout(2000);
    
    // 验证Supabase服务卡片
    const supabaseCard = page.locator('text=Supabase').first();
    await expect(supabaseCard).toBeVisible();
    
    // 验证Netlify服务卡片
    const netlifyCard = page.locator('text=Netlify').first();
    await expect(netlifyCard).toBeVisible();
    
    // 验证Render服务卡片
    const renderCard = page.locator('text=Render').first();
    await expect(renderCard).toBeVisible();
    
    // 截图
    await page.screenshot({ path: 'test-results/usage-monitor-services.png' });
  });

  test('应能生成模拟数据', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/usage-monitor`);
    await page.waitForLoadState('networkidle');
    
    // 点击"模拟数据"按钮
    const simulateButton = page.locator('button:has-text("模拟数据")');
    await expect(simulateButton).toBeVisible();
    await simulateButton.click();
    
    // 等待数据生成
    await page.waitForTimeout(3000);
    
    // 截图
    await page.screenshot({ path: 'test-results/usage-monitor-simulated.png' });
  });

  test('应显示进度条和百分比', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/usage-monitor`);
    await page.waitForLoadState('networkidle');
    
    // 先生成模拟数据
    await page.click('button:has-text("模拟数据")');
    await page.waitForTimeout(3000);
    
    // 验证进度条存在
    const progressBar = page.locator('.bg-green-500, .bg-yellow-500, .bg-red-500').first();
    await expect(progressBar).toBeVisible();
    
    // 验证百分比显示（如 "75.5%"）
    const percentage = page.locator('text=/\\d+\\.\\d+%/').first();
    await expect(percentage).toBeVisible();
  });

  test('应显示免费额度说明卡片', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/usage-monitor`);
    await page.waitForLoadState('networkidle');
    
    // 验证免费额度说明
    await expect(page.locator('text=免费额度说明')).toBeVisible();
    
    // 验证Supabase限额说明
    await expect(page.locator('text=500MB').first()).toBeVisible();
    
    // 验证Netlify限额说明
    await expect(page.locator('text=100GB').first()).toBeVisible();
    
    // 验证Render限额说明
    await expect(page.locator('text=750小时').first()).toBeVisible();
  });
});
