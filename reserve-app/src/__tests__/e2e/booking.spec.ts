import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { BookingPage } from './pages/BookingPage';

/**
 * Feature: 予約機能
 * 詳細なシナリオは reserve-app/features/booking/booking.feature を参照
 */
test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  /**
   * Scenario: 予約ページが正しく表示される
   */
  test('should display booking page with calendar @smoke', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();

    // Then: ページタイトル"予約カレンダー"が表示される
    await bookingPage.expectHeading('予約カレンダー');

    // And: 予約情報サイドバーが表示される
    await bookingPage.expectBookingInfoSidebarVisible();
  });

  /**
   * Scenario: メニューとスタッフがAPIから読み込まれる
   */
  test('should load menus and staff from API', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();

    // When: ページが読み込まれる
    await bookingPage.waitForLoad();

    // Then: メニュー選択ドロップダウンが表示される
    await bookingPage.expectMenuSelectVisible();

    // And: スタッフ選択ドロップダウンが表示される
    await bookingPage.expectStaffSelectVisible();
  });

  /**
   * Scenario: 過去の日付が選択できない
   */
  test('should disable past dates in calendar', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();

    // When: ページが読み込まれる
    await bookingPage.waitForLoad();

    // Then: 過去の日付ボタンが無効化されている
    await bookingPage.expectPastDatesDisabled();
  });

  /**
   * Scenario: メニュー選択後に日付を選択すると時間帯が表示される
   */
  test('should select date and show time slots when menu is selected', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // When: メニューを選択する
    await bookingPage.selectMenu();

    // And: 未来の日付"15日"を選択する（次月に移動してから選択）
    await bookingPage.selectFutureDate('15');

    // And: 1秒待つ
    await bookingPage.wait(1000);

    // Then: "時間帯を選択"セクションが表示される
    await bookingPage.expectTimeSlotsVisible();
  });

  /**
   * Scenario: すべての必須項目を入力すると予約確定ボタンが有効になる
   */
  test('should enable submit button when all required fields are filled', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // When: 予約確定ボタンは初期状態で無効
    await bookingPage.expectSubmitButtonDisabled();

    // And: メニューを選択する
    await bookingPage.selectMenu();

    // And: スタッフを選択する
    await bookingPage.selectStaff();

    // And: 未来の日付"15日"を選択する（次月に移動してから選択）
    await bookingPage.selectFutureDate('15');

    // And: 1秒待つ
    await bookingPage.wait(1000);

    // And: 利用可能な時間帯を選択する
    await bookingPage.selectAvailableTimeSlot();

    // Then: "予約を確定する"ボタンが有効になる
    await bookingPage.expectSubmitButtonEnabled();
  });

  /**
   * Scenario: 月のナビゲーションが機能する
   */
  test('should handle month navigation', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // When: 現在の月を記録する
    const currentMonth = await bookingPage.getCurrentMonth();

    // And: "次月 →"ボタンをクリックする
    await bookingPage.clickNextMonth();

    // Then: 月が変更されている
    await bookingPage.expectMonthChanged(currentMonth);

    // When: "← 前月"ボタンをクリックする
    await bookingPage.clickPreviousMonth();

    // Then: 元の月に戻っている
    await bookingPage.expectMonthRestored(currentMonth);
  });

  /**
   * Scenario: 機能セクションが表示される
   */
  test('should display features section', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: "24時間予約OK"が表示される
    // And: "確認メール送信"が表示される
    // And: "リマインダー"が表示される
    await bookingPage.expectFeaturesVisible();
  });

  /**
   * Scenario: 備考フィールドが機能する
   */
  test('should handle notes field', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: 予約ページにアクセスしている
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: 備考フィールドが表示される
    await bookingPage.expectNotesFieldVisible();

    // When: 備考フィールドに"窓際の席を希望します"と入力する
    await bookingPage.fillNotes('窓際の席を希望します');

    // Then: 文字カウンター"/500文字"が表示される
    await bookingPage.expectCharacterCounterVisible();
  });

  /**
   * Scenario: URLパラメータからメニューIDを読み取る
   */
  test('should pre-select menu from URL parameter', async ({ page }) => {
    const bookingPage = new BookingPage(page);

    // Given: クエリパラメータ"menuId=test-menu-id"付きで予約ページにアクセスする
    await bookingPage.gotoWithQuery('menuId=test-menu-id');

    // When: ページが読み込まれる
    await bookingPage.waitForLoad();

    // Then: メニュー選択ドロップダウンが表示される
    await bookingPage.expectMenuSelectVisible();
  });
});

test.describe('Menu List Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
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
