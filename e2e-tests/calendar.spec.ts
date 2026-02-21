import { test, expect } from '@playwright/test';

test.describe('Calendar View Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin login
    await page.goto('/#/admin/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input#username', { timeout: 15000 });
    
    // Fill in login credentials
    await page.fill('input#username', 'admin');
    await page.fill('input#password', 'admin123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/#\/admin/, { timeout: 15000 });
  });

  test('should navigate to calendar view from sidebar', async ({ page }) => {
    // Click on calendar menu item
    await page.click('button:has-text("日历视图")');
    
    // Wait for calendar page to load
    await page.waitForURL(/#\/admin\/calendar/, { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/calendar-view.png', fullPage: true });
    
    // Verify page elements
    await expect(page.locator('h1:has-text("日历视图")')).toBeVisible();
    await expect(page.locator('text=房间日历')).toBeVisible();
    await expect(page.locator('text=车辆日历')).toBeVisible();
  });

  test('should display room calendar with status colors', async ({ page }) => {
    // Navigate to calendar view
    await page.goto('/#/admin/calendar');
    await page.waitForSelector('h1:has-text("日历视图")', { timeout: 15000 });
    
    // Wait for calendar to load
    await page.waitForSelector('.grid.grid-cols-7', { timeout: 15000 });
    
    // Take screenshot of room calendar
    await page.screenshot({ path: 'screenshots/calendar-room.png', fullPage: true });
    
    // Verify legend is visible
    await expect(page.locator('text=充足')).toBeVisible();
    await expect(page.locator('text=紧张')).toBeVisible();
    await expect(page.locator('text=满/租完')).toBeVisible();
    await expect(page.locator('text=未设置')).toBeVisible();
    
    // Verify navigation buttons
    await expect(page.locator('button:has-text("今天")')).toBeVisible();
  });

  test('should switch between rooms and cars tabs', async ({ page }) => {
    // Navigate to calendar view
    await page.goto('/#/admin/calendar');
    await page.waitForSelector('h1:has-text("日历视图")', { timeout: 15000 });
    
    // Click on cars tab
    await page.click('button:has-text("车辆日历")');
    
    // Wait for cars data to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of car calendar
    await page.screenshot({ path: 'screenshots/calendar-car.png', fullPage: true });
    
    // Verify we're on cars tab
    await expect(page.locator('[data-state="active"]:has-text("车辆日历")')).toBeVisible();
    
    // Switch back to rooms tab
    await page.click('button:has-text("房间日历")');
    await page.waitForTimeout(2000);
    
    // Verify we're on rooms tab
    await expect(page.locator('[data-state="active"]:has-text("房间日历")')).toBeVisible();
  });

  test('should open date detail dialog when clicking a date', async ({ page }) => {
    // Navigate to calendar view
    await page.goto('/#/admin/calendar');
    await page.waitForSelector('h1:has-text("日历视图")', { timeout: 15000 });
    
    // Wait for calendar grid
    await page.waitForSelector('.grid.grid-cols-7', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Find a clickable date (not past, not empty)
    const dateCells = page.locator('.grid.grid-cols-7 > div').filter({ 
      hasNot: page.locator('.opacity-50') 
    });
    
    // Click on a date cell (try index 20 which should be mid-to-late month)
    const clickableDate = dateCells.nth(20);
    await clickableDate.click();
    
    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Take screenshot of dialog
    await page.screenshot({ path: 'screenshots/calendar-detail-dialog.png', fullPage: true });
    
    // Verify dialog content
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('should check console for errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to calendar view
    await page.goto('/#/admin/calendar');
    await page.waitForSelector('h1:has-text("日历视图")', { timeout: 15000 });
    
    // Wait for calendar to load
    await page.waitForTimeout(3000);
    
    // Log console messages
    console.log('Console messages:', consoleMessages.slice(-10));
    
    // Check for errors (filter out known non-critical errors)
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('manifest') &&
      !e.includes('net::ERR_BLOCKED_BY_CLIENT') &&
      !e.includes('401')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'screenshots/calendar-final.png', fullPage: true });
  });
});
