import { test, expect } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';

/**
 * E2Eテスト: フロントエンド機能フラグ制御
 * Issue: #97
 *
 * 機能フラグに基づいてUIの表示/非表示を制御する
 */

// 機能フラグAPIのモックレスポンスを作成するヘルパー関数
function createFeatureFlagsResponse(flags: Partial<Record<string, boolean>> = {}) {
  return {
    success: true,
    data: {
      featureFlags: {
        enableStaffSelection: flags.enableStaffSelection ?? false,
        enableStaffShiftManagement: flags.enableStaffShiftManagement ?? false,
        enableCustomerManagement: flags.enableCustomerManagement ?? false,
        enableReservationUpdate: flags.enableReservationUpdate ?? false,
        enableReminderEmail: flags.enableReminderEmail ?? false,
        enableManualReservation: flags.enableManualReservation ?? false,
        enableAnalyticsReport: flags.enableAnalyticsReport ?? false,
        enableRepeatRateAnalysis: flags.enableRepeatRateAnalysis ?? false,
        enableCouponFeature: flags.enableCouponFeature ?? false,
        enableLineNotification: flags.enableLineNotification ?? false,
      },
    },
  };
}

test.describe('フロントエンド機能フラグ制御', () => {
  test('スタッフ指名機能が有効な場合、予約フォームにスタッフ選択が表示される', async ({ page }) => {
    // Given: 機能フラグ "enableStaffSelection" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableStaffSelection: true })),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択フィールドが表示される
    await bookingPage.expectStaffSelectVisible();
  });

  test('スタッフ指名機能が無効な場合、予約フォームにスタッフ選択が表示されない', async ({ page }) => {
    // Given: 機能フラグ "enableStaffSelection" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableStaffSelection: false })),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択フィールドが表示されない
    await bookingPage.expectStaffSelectNotVisible();
  });

  test('顧客管理機能が有効な場合、管理画面に顧客メニューが表示される', async ({ page }) => {
    // Given: 機能フラグ "enableCustomerManagement" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableCustomerManagement: true })),
      });
    });

    // When: 管理者ダッシュボードにアクセスする
    const dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Then: サイドバーに "顧客管理" メニューが表示される
    await dashboardPage.expectCustomersMenuVisible();
  });

  test('顧客管理機能が無効な場合、管理画面に顧客メニューが表示されない', async ({ page }) => {
    // Given: 機能フラグ "enableCustomerManagement" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableCustomerManagement: false })),
      });
    });

    // When: 管理者ダッシュボードにアクセスする
    const dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Then: サイドバーに "顧客管理" メニューが表示されない
    await dashboardPage.expectCustomersMenuNotVisible();
  });

  test('分析レポート機能が有効な場合、ダッシュボードに分析セクションが表示される', async ({ page }) => {
    // Given: 機能フラグ "enableAnalyticsReport" が有効である
    await page.route('**/api/feature-flags', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableAnalyticsReport: true })),
      });
    });

    // Mock admin stats API
    await page.route('**/api/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            todayReservations: 5,
            monthlyReservations: 42,
            monthlyRevenue: 357000,
            repeatRate: 65,
            todayReservationsList: [],
            weeklyStats: [
              { date: '2026-01-06', day: '月', count: 6 },
              { date: '2026-01-07', day: '火', count: 8 },
              { date: '2026-01-08', day: '水', count: 5 },
              { date: '2026-01-09', day: '木', count: 7 },
              { date: '2026-01-10', day: '金', count: 9 },
              { date: '2026-01-11', day: '土', count: 4 },
              { date: '2026-01-12', day: '日', count: 3 },
            ],
          },
        }),
      });
    });

    // When: 管理者ダッシュボードにアクセスする
    const dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Then: "分析レポート" セクションが表示される
    await dashboardPage.expectAnalyticsReportVisible();
  });

  test('分析レポート機能が無効な場合、ダッシュボードに分析セクションが表示されない', async ({ page }) => {
    // Given: 機能フラグ "enableAnalyticsReport" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableAnalyticsReport: false })),
      });
    });

    // Mock admin stats API
    await page.route('**/api/admin/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            todayReservations: 5,
            monthlyReservations: 42,
            monthlyRevenue: 357000,
            repeatRate: 65,
            todayReservationsList: [],
            weeklyStats: [
              { date: '2026-01-06', day: '月', count: 6 },
              { date: '2026-01-07', day: '火', count: 8 },
              { date: '2026-01-08', day: '水', count: 5 },
              { date: '2026-01-09', day: '木', count: 7 },
              { date: '2026-01-10', day: '金', count: 9 },
              { date: '2026-01-11', day: '土', count: 4 },
              { date: '2026-01-12', day: '日', count: 3 },
            ],
          },
        }),
      });
    });

    // When: 管理者ダッシュボードにアクセスする
    const dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    // Then: "分析レポート" セクションが表示されない
    await dashboardPage.expectAnalyticsReportNotVisible();
  });

  test('クーポン機能が有効な場合、予約フォームにクーポン入力が表示される', async ({ page }) => {
    // Given: 機能フラグ "enableCouponFeature" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableCouponFeature: true })),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: クーポン入力フィールドが表示される
    await bookingPage.expectCouponInputVisible();
  });

  test('クーポン機能が無効な場合、予約フォームにクーポン入力が表示されない', async ({ page }) => {
    // Given: 機能フラグ "enableCouponFeature" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableCouponFeature: false })),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: クーポン入力フィールドが表示されない
    await bookingPage.expectCouponInputNotVisible();
  });

  test('複数の機能を同時に制御できる', async ({ page }) => {
    // Given: 機能フラグ "enableStaffSelection" が有効である
    // And: 機能フラグ "enableCouponFeature" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          createFeatureFlagsResponse({
            enableStaffSelection: true,
            enableCouponFeature: false,
          })
        ),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択フィールドが表示される
    await bookingPage.expectStaffSelectVisible();
    // And: クーポン入力フィールドが表示されない
    await bookingPage.expectCouponInputNotVisible();
  });

  test('機能フラグ取得エラー時はすべての機能が無効になる', async ({ page }) => {
    // Given: 機能フラグAPIがエラーを返す
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    });

    // When: 予約ページにアクセスする
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択フィールドが表示されない
    await bookingPage.expectStaffSelectNotVisible();
    // And: クーポン入力フィールドが表示されない
    await bookingPage.expectCouponInputNotVisible();
  });
});
