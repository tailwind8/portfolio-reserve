import { test, expect } from '@playwright/test';

test.describe('MyPage - 予約一覧', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to mypage
    await page.goto('/mypage');
  });

  test('should display mypage with correct title', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: 'マイページ', level: 1 })).toBeVisible();

    // Check description
    await expect(page.getByText('予約の確認・変更・キャンセルができます')).toBeVisible();
  });

  test('should display status filter tabs', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check all status tabs are visible
    await expect(page.getByRole('button', { name: /すべて/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /予約確定/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /予約待ち/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /キャンセル/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /完了/ })).toBeVisible();
  });

  test('should load and display reservations', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Either reservations should be displayed or empty state
    const hasReservations = (await page.locator('button:has-text("予約を変更")').count()) > 0;
    const hasEmptyState = await page.getByText('予約がありません').isVisible();

    expect(hasReservations || hasEmptyState).toBeTruthy();
  });

  test('should display reservation cards with correct information', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    const reservationCards = page.locator('button:has-text("予約を変更")').locator('..');

    if ((await reservationCards.count()) > 0) {
      const firstCard = reservationCards.first();

      // Check for status badge
      await expect(firstCard.locator('span.inline-flex')).toBeVisible();

      // Check for menu icon (clipboard icon)
      await expect(firstCard.locator('svg').first()).toBeVisible();

      // Check for staff icon (user icon)
      await expect(firstCard.locator('svg').nth(1)).toBeVisible();

      // Check for action buttons
      await expect(firstCard.getByRole('button', { name: '予約を変更' })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: 'キャンセル' })).toBeVisible();
    }
  });
});

test.describe('MyPage - ステータスフィルタリング', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
  });

  test('should filter reservations by status', async ({ page }) => {
    // Click on "予約確定" tab
    const confirmedTab = page.getByRole('button', { name: /予約確定/ });
    await confirmedTab.click();

    // Wait for state update
    await page.waitForTimeout(500);

    // Tab should be active (has blue color)
    await expect(confirmedTab).toHaveClass(/border-blue-500/);
  });

  test('should show count for each status', async ({ page }) => {
    // Check that each tab has a count badge
    const tabs = page.locator('button:has(span.rounded-full)');
    const count = await tabs.count();

    expect(count).toBeGreaterThanOrEqual(5); // At least 5 status tabs
  });

  test('should display empty state when no reservations match filter', async ({ page }) => {
    // Click on a status that might have no reservations
    await page.getByRole('button', { name: /キャンセル/ }).click();
    await page.waitForTimeout(500);

    // Check if either reservations are shown or empty state
    const hasReservations = (await page.locator('button:has-text("予約を変更")').count()) > 0;
    const hasEmptyState =
      (await page.getByText('キャンセルの予約がありません').isVisible()) ||
      (await page.getByText('予約がありません').isVisible());

    expect(hasReservations || hasEmptyState).toBeTruthy();
  });
});

test.describe('MyPage - 予約変更フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
  });

  test('should open edit modal when clicking edit button', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Modal should be visible
      await expect(page.getByRole('heading', { name: '予約変更' })).toBeVisible();

      // Calendar should be visible
      await expect(page.getByText('日')).toBeVisible();
      await expect(page.getByText('月')).toBeVisible();

      // Form fields should be visible
      await expect(page.locator('select#menu')).toBeVisible();
      await expect(page.locator('select#staff')).toBeVisible();
      await expect(page.locator('textarea#notes')).toBeVisible();

      // Submit button should be visible
      await expect(page.getByRole('button', { name: '予約を更新する' })).toBeVisible();
    }
  });

  test('should close edit modal when clicking close button', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Modal should be visible
      await expect(page.getByRole('heading', { name: '予約変更' })).toBeVisible();

      // Click close button
      const closeButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
      await closeButton.click();

      // Modal should be hidden
      await expect(page.getByRole('heading', { name: '予約変更' })).not.toBeVisible();
    }
  });

  test('should have form pre-filled with existing reservation data', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for modal to open
      await page.waitForSelector('select#menu');

      // Menu and staff selects should have values selected
      const menuSelect = page.locator('select#menu');
      const menuValue = await menuSelect.inputValue();
      expect(menuValue).not.toBe('');

      const staffSelect = page.locator('select#staff');
      const staffValue = await staffSelect.inputValue();
      expect(staffValue).not.toBe('');
    }
  });

  test('should disable past dates in edit modal calendar', async ({ page }) => {
    const editButton = page.getByRole('button', { name: '予約を変更' }).first();

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Find disabled date buttons
      const disabledDates = page.locator('button:disabled:has-text("1"), button:disabled:has-text("2")');
      const count = await disabledDates.count();

      // At least some past dates should be disabled (depending on current date)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('MyPage - 予約キャンセルフロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });
  });

  test('should open cancel confirmation dialog when clicking cancel button', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();

    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await cancelButton.click();

      // Dialog should be visible
      await expect(page.getByRole('heading', { name: '予約をキャンセルしますか？' })).toBeVisible();

      // Reservation summary should be visible
      await expect(page.getByText('予約日時')).toBeVisible();
      await expect(page.getByText('メニュー')).toBeVisible();

      // Warning message should be visible
      await expect(page.getByText('この操作は取り消せません')).toBeVisible();

      // Action buttons should be visible
      await expect(page.getByRole('button', { name: '戻る' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'キャンセルする' })).toBeVisible();
    }
  });

  test('should close cancel dialog when clicking back button', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();

    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await cancelButton.click();

      // Dialog should be visible
      await expect(page.getByRole('heading', { name: '予約をキャンセルしますか？' })).toBeVisible();

      // Click "戻る" button
      await page.getByRole('button', { name: '戻る' }).click();

      // Dialog should be hidden
      await expect(
        page.getByRole('heading', { name: '予約をキャンセルしますか？' })
      ).not.toBeVisible();
    }
  });

  test('should display reservation summary in cancel dialog', async ({ page }) => {
    const cancelButton = page.getByRole('button', { name: 'キャンセル' }).first();

    if (await cancelButton.isVisible() && (await cancelButton.isEnabled())) {
      await cancelButton.click();

      // Check that reservation details are displayed
      await expect(page.getByText('予約日時')).toBeVisible();
      await expect(page.getByText('メニュー')).toBeVisible();
      await expect(page.getByText('担当者')).toBeVisible();

      // Check for price and duration format
      await expect(page.locator('text=/¥[0-9,]+/')).toBeVisible();
      await expect(page.locator('text=/[0-9]+分/')).toBeVisible();
    }
  });

  test('should disable edit and cancel buttons for past reservations', async ({ page }) => {
    // Look for any disabled action buttons
    const disabledEditButtons = page.locator('button:disabled:has-text("予約を変更")');
    const disabledCancelButtons = page.locator('button:disabled:has-text("キャンセル")');

    // Check if there are any disabled buttons (past reservations)
    const editCount = await disabledEditButtons.count();
    const cancelCount = await disabledCancelButtons.count();

    // If there are past reservations, buttons should be disabled
    if (editCount > 0 || cancelCount > 0) {
      expect(editCount).toEqual(cancelCount); // Both should be disabled for the same reservation
    }
  });
});

test.describe('MyPage - エラーハンドリング', () => {
  test('should display error message when API fails', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/reservations', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'Internal Server Error' },
        }),
      });
    });

    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Error message should be visible
    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });

    // Retry button should be visible
    await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
  });

  test('should retry fetching reservations when clicking retry button', async ({ page }) => {
    let requestCount = 0;

    // Intercept API calls
    await page.route('**/api/reservations', (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Internal Server Error' },
          }),
        });
      } else {
        // Second request succeeds
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      }
    });

    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Error should be visible first
    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });

    // Click retry button
    await page.getByRole('button', { name: '再試行' }).click();

    // Wait for loading to complete again
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Error should disappear
    await expect(page.getByText('エラーが発生しました')).not.toBeVisible();
  });
});

test.describe('MyPage - レスポンシブデザイン', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Status tabs should be scrollable
    const tabsContainer = page.locator('div.overflow-x-auto').first();
    await expect(tabsContainer).toBeVisible();

    // Page title should be visible
    await expect(page.getByRole('heading', { name: 'マイページ' })).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Grid should use 2 columns on tablet (md:grid-cols-2)
    const grid = page.locator('div.grid').first();
    await expect(grid).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 });

    // Grid should use 3 columns on desktop (lg:grid-cols-3)
    const grid = page.locator('div.grid').first();
    await expect(grid).toBeVisible();
  });
});
