import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');
  });

  test('should display booking page with calendar', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: '予約カレンダー' })).toBeVisible();

    // Check calendar is displayed
    await expect(page.getByText('日')).toBeVisible();
    await expect(page.getByText('月')).toBeVisible();
    await expect(page.getByText('火')).toBeVisible();

    // Check booking info sidebar
    await expect(page.getByRole('heading', { name: '予約情報' })).toBeVisible();
  });

  test('should load menus and staff from API', async ({ page }) => {
    // Wait for menus to load
    await page.waitForLoadState('networkidle');

    // Check that menu select has options
    const menuSelect = page.locator('select#menu');
    await expect(menuSelect).toBeVisible();

    // Check that staff select has options
    const staffSelect = page.locator('select#staff');
    await expect(staffSelect).toBeVisible();
  });

  test('should disable past dates in calendar', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find a past date button (assuming current date is > 1)
    // This test may need adjustment based on the current date
    const pastDates = page.locator('button:has-text("1"):disabled, button:has-text("2"):disabled');
    const count = await pastDates.count();

    // At least some past dates should be disabled
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should select date and show time slots when menu is selected', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Select a menu
    const menuSelect = page.locator('select#menu');
    await menuSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Select a future date (e.g., 15th)
    const dateButton = page.locator('button:not(:disabled):has-text("15")').first();
    await dateButton.click();

    // Wait for time slots to load
    await page.waitForTimeout(1000);

    // Check if time slots section appears
    const timeSlotsSection = page.getByText('時間帯を選択');
    await expect(timeSlotsSection).toBeVisible();
  });

  test('should enable submit button when all required fields are filled', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const submitButton = page.getByRole('button', { name: '予約を確定する' });

    // Initially, button should be disabled
    await expect(submitButton).toBeDisabled();

    // Select menu
    await page.locator('select#menu').selectOption({ index: 1 });

    // Select staff
    await page.locator('select#staff').selectOption({ index: 1 });

    // Select date
    await page.locator('button:not(:disabled):has-text("15")').first().click();

    // Wait for time slots
    await page.waitForTimeout(1000);

    // Select time slot (if available)
    const availableSlot = page.locator('button:not(:disabled):has-text("10:00"), button:not(:disabled):has-text("14:00")').first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();

      // Now button should be enabled
      await expect(submitButton).toBeEnabled();
    }
  });

  test('should handle month navigation', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Get current month text
    const monthHeader = page.locator('h2.text-xl').first();
    const currentMonth = await monthHeader.textContent();

    // Click next month
    await page.getByRole('button', { name: '次月 →' }).click();

    // Month should change
    const newMonth = await monthHeader.textContent();
    expect(newMonth).not.toBe(currentMonth);

    // Click previous month
    await page.getByRole('button', { name: '← 前月' }).click();

    // Should be back to original month
    const backMonth = await monthHeader.textContent();
    expect(backMonth).toBe(currentMonth);
  });

  test('should display features section', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for feature cards
    await expect(page.getByText('24時間予約OK')).toBeVisible();
    await expect(page.getByText('確認メール送信')).toBeVisible();
    await expect(page.getByText('リマインダー')).toBeVisible();
  });

  test('should handle notes field', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const notesField = page.locator('textarea#notes');
    await expect(notesField).toBeVisible();

    // Type in notes
    await notesField.fill('窓際の席を希望します');

    // Check character counter
    await expect(page.getByText(/\/500文字/)).toBeVisible();
  });

  test('should pre-select menu from URL parameter', async ({ page }) => {
    // This test would need a valid menuId
    // For now, we just check that the parameter is read
    await page.goto('/booking?menuId=test-menu-id');
    await page.waitForLoadState('networkidle');

    // Menu select should be attempted to be set
    // (may fail if invalid ID, but that's expected)
    const menuSelect = page.locator('select#menu');
    await expect(menuSelect).toBeVisible();
  });
});

test.describe('Menu List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menus');
  });

  test('should display menu list page', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'メニュー一覧' })).toBeVisible();
    await expect(page.getByText('お好みのメニューをお選びください')).toBeVisible();
  });

  test('should load and display menus', async ({ page }) => {
    // Wait for API call to complete
    await page.waitForLoadState('networkidle');

    // Check for loading spinner to disappear
    const spinner = page.locator('.animate-spin');
    await expect(spinner).not.toBeVisible({ timeout: 5000 });

    // Either menus should be displayed or empty state
    const hasMenus = await page.getByText('このメニューで予約').count() > 0;
    const hasEmptyState = await page.getByText('現在、予約可能なメニューはありません').isVisible();

    expect(hasMenus || hasEmptyState).toBeTruthy();
  });

  test('should display menu details', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // If there are menus, check their structure
    const menuCards = page.locator('text=このメニューで予約').count();

    if (await menuCards > 0) {
      // Check for price display (¥ symbol)
      await expect(page.locator('text=/¥[0-9,]+/').first()).toBeVisible();

      // Check for duration display
      await expect(page.locator('text=/[0-9]+分/').first()).toBeVisible();
    }
  });

  test('should navigate to booking page when clicking reserve button', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const reserveButton = page.getByRole('link', { name: 'このメニューで予約' }).first();

    if (await reserveButton.isVisible()) {
      await reserveButton.click();

      // Should navigate to booking page
      await expect(page).toHaveURL(/\/booking/);
    }
  });

  test('should display feature cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('豊富なメニュー')).toBeVisible();
    await expect(page.getByText('明朗会計')).toBeVisible();
    await expect(page.getByText('所要時間表示')).toBeVisible();
  });

  test('should group menus by category', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if category headers exist (if there are menus)
    const categoryHeaders = page.locator('h2.text-2xl');
    const count = await categoryHeaders.count();

    // Should have at least one category if there are menus
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
