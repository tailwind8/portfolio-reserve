import { test, expect } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';

/**
 * 機能フラグ連動のE2Eテスト
 *
 * 目的:
 * - スーパー管理者が設定した機能フラグに応じて、ユーザー画面が動的に変更されることを検証
 * - 一般ユーザー向けAPI（GET /api/feature-flags）の動作検証
 * - useFeatureFlagsフックの動作検証
 *
 * テスト対象:
 * 1. 一般ユーザー向け機能フラグAPI
 * 2. 予約フォームでの機能フラグ制御（スタッフ選択、クーポン入力）
 * 3. 管理者ダッシュボードでの機能フラグ制御（分析レポート、リピート率分析）
 * 4. 管理者メニューでの機能フラグ制御（スタッフ管理、顧客管理）
 */

test.describe('機能フラグ連動 - API', () => {
  test('一般ユーザーが機能フラグを取得できる', async ({ request }) => {
    const response = await request.get('/api/feature-flags');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.featureFlags).toBeDefined();

    // 主要な機能フラグが含まれていることを確認
    const flags = body.data.featureFlags;
    expect(flags).toHaveProperty('enableStaffSelection');
    expect(flags).toHaveProperty('enableStaffShiftManagement');
    expect(flags).toHaveProperty('enableCustomerManagement');
    expect(flags).toHaveProperty('enableReservationUpdate');
    expect(flags).toHaveProperty('enableReminderEmail');
    expect(flags).toHaveProperty('enableManualReservation');
    expect(flags).toHaveProperty('enableAnalyticsReport');
    expect(flags).toHaveProperty('enableRepeatRateAnalysis');
    expect(flags).toHaveProperty('enableCouponFeature');
    expect(flags).toHaveProperty('enableLineNotification');
  });

  test('認証なしでも機能フラグを取得できる（読み取り専用）', async ({ request }) => {
    // 認証ヘッダーなしでリクエスト
    const response = await request.get('/api/feature-flags');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.featureFlags).toBeDefined();
  });
});

test.describe('機能フラグ連動 - 予約フォーム', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
  });

  test('スタッフ指名機能がONの場合、予約フォームにスタッフ選択が表示される', async ({ page }) => {
    // データベースでenableStaffSelection = trueの状態を前提
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // スタッフ選択フィールドが表示される
    await bookingPage.expectStaffSelectVisible();
  });

  test.skip('スタッフ指名機能がOFFの場合、予約フォームにスタッフ選択が表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableStaffSelectionをfalseに設定後にテスト
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // スタッフ選択フィールドが表示されない
    const staffSelect = page.locator('select#staff');
    await expect(staffSelect).not.toBeVisible();
  });

  test.skip('クーポン機能がONの場合、予約フォームにクーポン入力が表示される', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableCouponFeatureをtrueに設定後にテスト
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // クーポン入力フィールドが表示される
    const couponInput = page.locator('[data-testid="coupon-input"]');
    await expect(couponInput).toBeVisible();
  });

  test.skip('クーポン機能がOFFの場合、予約フォームにクーポン入力が表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // データベースでenableCouponFeature = falseの状態を前提
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // クーポン入力フィールドが表示されない
    const couponInput = page.locator('[data-testid="coupon-input"]');
    await expect(couponInput).not.toBeVisible();
  });
});

test.describe('機能フラグ連動 - 管理者ダッシュボード', () => {
  let adminDashboard: AdminDashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    adminDashboard = new AdminDashboardPage(page);
    loginPage = new LoginPage(page);

    // 管理者としてログイン
    if (process.env.SKIP_AUTH_IN_TEST !== 'true') {
      await loginPage.goto();
      await loginPage.loginAsAdmin();
    }
  });

  test('管理者ダッシュボードにアクセスできる', async ({ page }) => {
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // ダッシュボードが表示される
    await adminDashboard.expectDashboardVisible();
  });

  test.skip('分析レポート機能がONの場合、ダッシュボードに分析レポートが表示される', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // データベースでenableAnalyticsReport = trueの状態を前提
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // 分析レポートセクションが表示される
    const analyticsReport = page.locator('[data-testid="analytics-report"]');
    await expect(analyticsReport).toBeVisible();
  });

  test.skip('分析レポート機能がOFFの場合、ダッシュボードに分析レポートが表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableAnalyticsReportをfalseに設定後にテスト
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // 分析レポートセクションが表示されない
    const analyticsReport = page.locator('[data-testid="analytics-report"]');
    await expect(analyticsReport).not.toBeVisible();
  });

  test.skip('リピート率分析機能がONの場合、ダッシュボードにリピート率分析が表示される', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableRepeatRateAnalysisをtrueに設定後にテスト
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // リピート率分析セクションが表示される
    const repeatRateAnalysis = page.locator('[data-testid="repeat-rate-analysis"]');
    await expect(repeatRateAnalysis).toBeVisible();
  });

  test.skip('リピート率分析機能がOFFの場合、ダッシュボードにリピート率分析が表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // データベースでenableRepeatRateAnalysis = falseの状態を前提
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // リピート率分析セクションが表示されない
    const repeatRateAnalysis = page.locator('[data-testid="repeat-rate-analysis"]');
    await expect(repeatRateAnalysis).not.toBeVisible();
  });
});

test.describe('機能フラグ連動 - 管理者メニュー', () => {
  let adminDashboard: AdminDashboardPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    adminDashboard = new AdminDashboardPage(page);
    loginPage = new LoginPage(page);

    // 管理者としてログイン
    if (process.env.SKIP_AUTH_IN_TEST !== 'true') {
      await loginPage.goto();
      await loginPage.loginAsAdmin();
    }
  });

  test('スタッフシフト管理機能がONの場合、管理者メニューに「スタッフ管理」が表示される', async ({ page }) => {
    // データベースでenableStaffShiftManagement = trueの状態を前提
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // ナビゲーションに「スタッフ管理」リンクが表示される
    const staffManagementLink = page.locator('[data-testid="nav-staff-management"]');
    await expect(staffManagementLink).toBeVisible();
  });

  test.skip('スタッフシフト管理機能がOFFの場合、管理者メニューに「スタッフ管理」が表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableStaffShiftManagementをfalseに設定後にテスト
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // ナビゲーションに「スタッフ管理」リンクが表示されない
    const staffManagementLink = page.locator('[data-testid="nav-staff-management"]');
    await expect(staffManagementLink).not.toBeVisible();
  });

  test('顧客管理機能がONの場合、管理者メニューに「顧客管理」が表示される', async ({ page }) => {
    // データベースでenableCustomerManagement = trueの状態を前提
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // ナビゲーションに「顧客管理」リンクが表示される
    const customerManagementLink = page.locator('[data-testid="nav-customer-management"]');
    await expect(customerManagementLink).toBeVisible();
  });

  test.skip('顧客管理機能がOFFの場合、管理者メニューに「顧客管理」が表示されない', async ({ page }) => {
    // TODO: Phase 4実装後に有効化
    // スーパー管理者がenableCustomerManagementをfalseに設定後にテスト
    await adminDashboard.goto();
    await adminDashboard.waitForLoad();

    // ナビゲーションに「顧客管理」リンクが表示されない
    const customerManagementLink = page.locator('[data-testid="nav-customer-management"]');
    await expect(customerManagementLink).not.toBeVisible();
  });
});

test.describe('機能フラグ連動 - エラーハンドリング', () => {
  test.skip('API取得失敗時は安全側に倒す（すべてOFF）', async ({ page, context }) => {
    // TODO: Phase 4実装後に有効化
    // APIをモックしてエラーを返す
    await context.route('/api/feature-flags', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // エラー時はすべての機能がOFFになる
    const staffSelect = page.locator('select#staff');
    await expect(staffSelect).not.toBeVisible();

    const couponInput = page.locator('[data-testid="coupon-input"]');
    await expect(couponInput).not.toBeVisible();
  });
});

test.describe('機能フラグ連動 - リアルタイム更新', () => {
  test.skip('機能フラグが変更されたらページをリロードすると反映される', async ({ page, request }) => {
    // TODO: Phase 4実装後に有効化
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // 初期状態: クーポン機能がOFF
    let couponInput = page.locator('[data-testid="coupon-input"]');
    await expect(couponInput).not.toBeVisible();

    // スーパー管理者がenableCouponFeatureをtrueに変更（APIを直接呼び出し）
    // 注: 実際にはスーパー管理者の認証トークンが必要
    // await request.patch('/api/super-admin/feature-flags', {
    //   data: {
    //     tenantId: 'demo-booking',
    //     featureFlags: { enableCouponFeature: true }
    //   }
    // });

    // ページをリロード
    await page.reload();
    await bookingPage.waitForLoad();

    // クーポン入力フィールドが表示される
    couponInput = page.locator('[data-testid="coupon-input"]');
    await expect(couponInput).toBeVisible();
  });
});
