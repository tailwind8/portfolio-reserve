import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { AnalyticsPage } from './pages/AnalyticsPage';

/**
 * Feature: 分析レポート機能
 * 詳細なシナリオは reserve-app/features/analytics.feature を参照
 *
 * Issue #26: 予約推移グラフ
 * Issue #27: リピート率分析
 */
test.describe('Analytics Report', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  /**
   * Scenario: 月別予約推移グラフを表示する（Issue #26）
   */
  test('should display monthly reservation trends chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // Then: ページタイトルが表示される
    await analyticsPage.expectPageTitle('分析レポート');

    // When: "月別"タブを選択する
    await analyticsPage.selectPeriodTab('monthly');

    // Then: 月別予約推移グラフが表示される
    await analyticsPage.expectMonthlyTrendsChart();

    // And: グラフに過去12ヶ月分のデータが表示される
    await analyticsPage.expectTrendsChartHasData();

    // And: 各月の予約件数が表示される
    await analyticsPage.expectChartAxesVisible();
  });

  /**
   * Scenario: 週別予約推移グラフを表示する（Issue #26）
   */
  test('should display weekly reservation trends chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // When: "週別"タブを選択する
    await analyticsPage.selectPeriodTab('weekly');

    // Then: 週別予約推移グラフが表示される
    await analyticsPage.expectWeeklyTrendsChart();

    // And: グラフに過去8週間分のデータが表示される
    await analyticsPage.expectTrendsChartHasData();

    // And: 各週の予約件数が表示される
    await analyticsPage.expectChartAxesVisible();
  });

  /**
   * Scenario: 日別予約推移グラフを表示する（Issue #26）
   */
  test('should display daily reservation trends chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // When: "日別"タブを選択する
    await analyticsPage.selectPeriodTab('daily');

    // Then: 日別予約推移グラフが表示される
    await analyticsPage.expectDailyTrendsChart();

    // And: グラフに過去30日分のデータが表示される
    await analyticsPage.expectTrendsChartHasData();

    // And: 各日の予約件数が表示される
    await analyticsPage.expectChartAxesVisible();
  });

  /**
   * Scenario: リピート率の詳細を表示する（Issue #27）
   */
  test('should display repeat rate details', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // When: "リピート率"セクションを確認する
    await analyticsPage.expectRepeatRateSectionVisible();

    // Then: 全体のリピート率が表示される
    await analyticsPage.expectOverallRepeatRate();

    // And: 新規顧客数が表示される
    await analyticsPage.expectNewCustomersCount();

    // And: リピート顧客数が表示される
    await analyticsPage.expectRepeatCustomersCount();

    // And: 新規/リピーター比率の円グラフが表示される
    await analyticsPage.expectCustomerTypePieChart();
    await analyticsPage.expectPieChartLegend();
  });

  /**
   * Scenario: リピート率の推移を表示する（Issue #27）
   */
  test('should display repeat rate trend chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // When: "リピート率推移"グラフを確認する
    await analyticsPage.expectRepeatRateTrendChart();

    // Then: 月別のリピート率推移グラフが表示される
    await analyticsPage.expectRepeatRateTrendHasData();

    // And: グラフに過去6ヶ月分のデータが表示される
    // （データがある場合にライングラフが表示される）
  });

  /**
   * Scenario: データが存在しない場合のメッセージ表示
   */
  test('should display no data message when data is empty', async ({ page }) => {
    // MSWハンドラーを空データ用に上書き
    await page.route('**/api/admin/analytics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            reservationTrends: { daily: [], weekly: [], monthly: [] },
            repeatRate: {
              overall: 0,
              newCustomers: 0,
              repeatCustomers: 0,
              monthlyTrends: [],
            },
          },
        }),
      });
    });

    const analyticsPage = new AnalyticsPage(page);

    // Given: 予約データが1件も存在しない
    // And: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // Then: "データがありません"というメッセージが表示される
    await analyticsPage.expectNoDataMessage();

    // And: グラフは表示されない
    await analyticsPage.expectNoChartsVisible();
  });

  /**
   * Scenario: ローディング状態の表示
   */
  test('should display loading state while fetching data', async ({ page }) => {
    // APIレスポンスを遅延させる
    await page.route('**/api/admin/analytics**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // Then: ローディングメッセージが表示される
    await analyticsPage.expectLoading();
  });

  /**
   * Scenario: APIエラー時のエラーメッセージ表示
   */
  test('should display error message when API fails', async ({ page }) => {
    // APIエラーをシミュレート
    await page.route('**/api/admin/analytics**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'データの取得に失敗しました',
        }),
      });
    });

    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // Then: エラーメッセージが表示される
    await analyticsPage.expectError('データの取得に失敗しました');
  });

  /**
   * Scenario: リピート率の値が正しく表示される
   */
  test('should display correct repeat rate value', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);

    // Given: 分析レポートページにアクセスしている
    await analyticsPage.goto();

    // When: リピート率を取得する
    const repeatRate = await analyticsPage.getRepeatRate();

    // Then: リピート率がパーセント形式で表示される
    expect(repeatRate).toMatch(/%$/);

    // And: 新規顧客数とリピート顧客数が表示される
    const newCustomers = await analyticsPage.getNewCustomersCount();
    const repeatCustomers = await analyticsPage.getRepeatCustomersCount();

    expect(newCustomers).toBeTruthy();
    expect(repeatCustomers).toBeTruthy();
  });
});
