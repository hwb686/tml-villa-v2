import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('TML Villa 终极防御性测试', () => {

  // --- 1. 网络边界模拟 (F021) ---
  test('网络异常边界处理', async ({ page }) => {
    // 模拟 500 错误
    await page.route('**/api/homestays', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ code: 500, msg: 'Internal Server Error' })
    }));
    await page.goto(`${BASE_URL}/#/`);
    await expect(page.locator('text=加载失败')).toBeVisible();

    // 模拟离线状态
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.locator('text=无网络链接')).toBeVisible({ timeout: 5000 });
    await page.context().setOffline(false);
  });

  // --- 2. 精确视口全设备验证 ---
  const vps = [
    { name: 'iPhone SE', ...devices['iPhone SE'] },
    { name: 'iPhone 13', ...devices['iPhone 13'] },
    { name: 'iPad Air', ...devices['iPad Air'] },
    { name: 'Desktop Chrome', viewport: { width: 1280, height: 720 } }
  ];

  for (const vp of vps) {
    test(`布局验证: ${vp.name}`, async ({ page }) => {
      await page.setViewportSize(vp.viewport);
      await page.goto(BASE_URL);
      // 验证 Logo 是否可见
      await expect(page.locator('img[alt="TML Villa"]')).toBeVisible();
      // 验证搜索栏在移动端是否折叠或显示
      const searchBar = page.locator('.search-bar');
      if (vp.viewport.width < 640) {
        await expect(searchBar).toHaveClass(/max-w-4xl/);
      }
    });
  }

  // --- 3. 并发状态压力测试 (BUG-017) ---
  test('高并发预订冲突验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/login`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("登录")');

    // 同时发起 5 个预订 API 请求
    const results = await page.evaluate(async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homestayId: 'cmlst2joz0002ydjk9s8sbtz6', checkIn: '2026-03-01', checkOut: '2026-03-02' })
        }).then(r => r.status));
      }
      return Promise.all(results);
    });

    // 验证后端是否只允许一个成功 (200) 或全部被库存锁拦截
    const successCount = results.filter(s => s === 200).length;
    expect(successCount).toBeLessThanOrEqual(1);
  });

  // --- 4. 国际化硬编码扫描 ---
  test('中/英/泰三语覆盖验证', async ({ page }) => {
    const languages = ['zh', 'en', 'th'];
    for (const lang of languages) {
      await page.goto(`${BASE_URL}/#/`);
      await page.click('button:has-text("ZH"), button:has-text("EN"), button:has-text("TH")');
      await page.click(`text=${lang.toUpperCase()}`);
      
      // 扫描页面是否还存在未翻译的硬编码中文（排除房源名称等动态数据）
      if (lang !== 'zh') {
        const content = await page.content();
        // 简单正则：如果是非中文语言环境下出现大量连续汉字，可能是漏掉的翻译
        const unTranslated = content.match(/[\u4e00-\u9fa5]{4,}/g);
        // 过滤掉已知的房源名称
        const filtered = unTranslated?.filter(t => !['海景别墅', '豪华公寓'].includes(t));
        expect(filtered?.length || 0).toBeLessThan(5); 
      }
    }
  });
});
