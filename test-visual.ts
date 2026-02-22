import { chromium } from 'playwright';
import * as path from 'path';

async function visualTest() {
  console.log('🚀 启动浏览器...');
  
  // 启动浏览器（非 headless 模式）
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // 放慢操作以便观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 导航到页面
  console.log('📱 导航到 http://localhost:5174 ...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });
  
  // 等待页面加载
  await page.waitForTimeout(2000);
  
  // 截图
  const screenshotPath = path.join(process.cwd(), 'screenshots', 'test-page.png');
  console.log('📸 截图保存到:', screenshotPath);
  await page.screenshot({ 
    path: screenshotPath, 
    fullPage: true 
  });
  
  // 获取页面信息
  const title = await page.title();
  console.log('\n📋 页面标题:', title);
  
  // 获取主要元素
  const headings = await page.$$eval('h1, h2, h3', els => els.map(e => ({
    tag: e.tagName,
    text: e.textContent?.trim().substring(0, 100)
  })));
  console.log('\n📝 页面标题元素:', JSON.stringify(headings, null, 2));
  
  // 获取页面文本内容（用于分析）
  const bodyText = await page.$eval('body', el => el.innerText);
  console.log('\n📄 页面主要内容预览 (前 2000 字符):');
  console.log(bodyText.substring(0, 2000));
  
  // 检查民宿列表相关元素
  const villaCards = await page.$$('[class*="villa"], [class*="card"], [class*="list"], [class*="item"]');
  console.log('\n🏠 找到的可能民宿列表元素数量:', villaCards.length);
  
  // 获取图片数量
  const images = await page.$$eval('img', imgs => imgs.map(img => ({
    alt: img.alt,
    src: img.src?.substring(0, 80)
  })));
  console.log('\n🖼️ 页面图片数量:', images.length);
  if (images.length > 0) {
    console.log('图片信息:', JSON.stringify(images.slice(0, 5), null, 2));
  }
  
  // 保持浏览器打开一段时间以便观察
  console.log('\n⏳ 等待 3 秒后关闭浏览器...');
  await page.waitForTimeout(3000);
  
  // 关闭浏览器
  await browser.close();
  console.log('✅ 测试完成，浏览器已关闭');
}

visualTest().catch(err => {
  console.error('❌ 测试出错:', err);
  process.exit(1);
});
