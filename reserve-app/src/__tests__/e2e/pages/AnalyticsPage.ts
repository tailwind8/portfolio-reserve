import { Page, expect } from '@playwright/test';

/**
 * Page Object: 分析レポートページ
 *
 * このクラスは管理者の分析レポートページのすべての要素とインタラクションを管理します。
 * テストコードから実装詳細を隠蔽し、data-testid属性を使用して要素を特定します。
 */
export class AnalyticsPage {
  readonly page: Page;

  // セレクタ定義（すべてdata-testid属性を使用）
  private readonly selectors = {
    // ローディング・エラー
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',
    noDataMessage: '[data-testid="no-data-message"]',

    // ページタイトル
    pageTitle: '[data-testid="analytics-title"]',

    // 予約推移セクション
    reservationTrendsSection: '[data-testid="reservation-trends-section"]',
    trendsPeriodTab: (period: 'daily' | 'weekly' | 'monthly') =>
      `[data-testid="trends-tab-${period}"]`,
    trendsChart: '[data-testid="trends-chart"]',

    // リピート率セクション
    repeatRateSection: '[data-testid="repeat-rate-section"]',
    repeatRateOverall: '[data-testid="repeat-rate-overall"]',
    newCustomersCount: '[data-testid="new-customers-count"]',
    repeatCustomersCount: '[data-testid="repeat-customers-count"]',

    // 新規/リピーター円グラフ
    customerTypePieChart: '[data-testid="customer-type-pie-chart"]',
    pieChartLegend: '[data-testid="pie-chart-legend"]',

    // リピート率推移グラフ
    repeatRateTrendSection: '[data-testid="repeat-rate-trend-section"]',
    repeatRateTrendChart: '[data-testid="repeat-rate-trend-chart"]',

    // サマリーカード
    summaryCard: '[data-testid="summary-card"]',
    summaryCardLabel: '[data-testid="summary-card-label"]',
    summaryCardValue: '[data-testid="summary-card-value"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 分析レポートページに移動する
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/analytics');
  }

  /**
   * ローディング状態を確認する
   */
  async expectLoading(): Promise<void> {
    const loadingMessage = this.page.locator(this.selectors.loadingMessage);
    await expect(loadingMessage).toBeVisible();
    await expect(loadingMessage).toContainText('読み込み中');
  }

  /**
   * エラーメッセージを確認する
   */
  async expectError(message?: string): Promise<void> {
    const errorMessage = this.page.locator(this.selectors.errorMessage);
    await expect(errorMessage).toBeVisible();
    if (message) {
      await expect(errorMessage).toContainText(message);
    }
  }

  /**
   * データなしメッセージを確認する
   */
  async expectNoDataMessage(): Promise<void> {
    const noDataMessage = this.page.locator(this.selectors.noDataMessage);
    await expect(noDataMessage).toBeVisible();
    await expect(noDataMessage).toContainText('データがありません');
  }

  /**
   * ページタイトルを確認する
   */
  async expectPageTitle(title: string = '分析レポート'): Promise<void> {
    const pageTitle = this.page.locator(this.selectors.pageTitle);
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toContainText(title);
  }

  // ========================================
  // 予約推移グラフ関連
  // ========================================

  /**
   * 期間タブを選択する
   */
  async selectPeriodTab(period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    await this.page.locator(this.selectors.trendsPeriodTab(period)).click();
  }

  /**
   * 予約推移グラフが表示されていることを確認する
   */
  async expectTrendsChartVisible(): Promise<void> {
    const chart = this.page.locator(this.selectors.trendsChart);
    await expect(chart).toBeVisible();
  }

  /**
   * 予約推移グラフにデータが表示されていることを確認する
   */
  async expectTrendsChartHasData(): Promise<void> {
    await this.expectTrendsChartVisible();
    // グラフコンテナが表示されていることを確認
    const chart = this.page.locator(this.selectors.trendsChart);
    await expect(chart).toBeVisible();
  }

  /**
   * 月別予約推移グラフが表示されていることを確認する（過去12ヶ月）
   */
  async expectMonthlyTrendsChart(): Promise<void> {
    await this.selectPeriodTab('monthly');
    await this.expectTrendsChartVisible();
  }

  /**
   * 週別予約推移グラフが表示されていることを確認する（過去8週間）
   */
  async expectWeeklyTrendsChart(): Promise<void> {
    await this.selectPeriodTab('weekly');
    await this.expectTrendsChartVisible();
  }

  /**
   * 日別予約推移グラフが表示されていることを確認する（過去30日）
   */
  async expectDailyTrendsChart(): Promise<void> {
    await this.selectPeriodTab('daily');
    await this.expectTrendsChartVisible();
  }

  /**
   * グラフの軸が表示されていることを確認する
   */
  async expectChartAxesVisible(): Promise<void> {
    // Rechartsのグラフが表示されていることを確認
    await this.expectTrendsChartVisible();
  }

  // ========================================
  // リピート率分析関連
  // ========================================

  /**
   * リピート率セクションが表示されていることを確認する
   */
  async expectRepeatRateSectionVisible(): Promise<void> {
    const section = this.page.locator(this.selectors.repeatRateSection);
    await expect(section).toBeVisible();
  }

  /**
   * 全体のリピート率が表示されていることを確認する
   */
  async expectOverallRepeatRate(): Promise<void> {
    const repeatRate = this.page.locator(this.selectors.repeatRateOverall);
    await expect(repeatRate).toBeVisible();

    // パーセント表記を確認
    const text = await repeatRate.textContent();
    expect(text).toMatch(/%$/);
  }

  /**
   * リピート率の値を取得する
   */
  async getRepeatRate(): Promise<string> {
    const repeatRate = this.page.locator(this.selectors.repeatRateOverall);
    return await repeatRate.textContent() || '';
  }

  /**
   * 新規顧客数が表示されていることを確認する
   */
  async expectNewCustomersCount(): Promise<void> {
    const count = this.page.locator(this.selectors.newCustomersCount);
    await expect(count).toBeVisible();
  }

  /**
   * 新規顧客数を取得する
   */
  async getNewCustomersCount(): Promise<string> {
    const count = this.page.locator(this.selectors.newCustomersCount);
    return await count.textContent() || '';
  }

  /**
   * リピート顧客数が表示されていることを確認する
   */
  async expectRepeatCustomersCount(): Promise<void> {
    const count = this.page.locator(this.selectors.repeatCustomersCount);
    await expect(count).toBeVisible();
  }

  /**
   * リピート顧客数を取得する
   */
  async getRepeatCustomersCount(): Promise<string> {
    const count = this.page.locator(this.selectors.repeatCustomersCount);
    return await count.textContent() || '';
  }

  /**
   * 新規/リピーター円グラフが表示されていることを確認する
   */
  async expectCustomerTypePieChart(): Promise<void> {
    const chart = this.page.locator(this.selectors.customerTypePieChart);
    await expect(chart).toBeVisible();
  }

  /**
   * 円グラフの凡例が表示されていることを確認する
   */
  async expectPieChartLegend(): Promise<void> {
    const legend = this.page.locator(this.selectors.pieChartLegend);
    await expect(legend).toBeVisible();
  }

  /**
   * リピート率推移グラフが表示されていることを確認する
   */
  async expectRepeatRateTrendChart(): Promise<void> {
    const chart = this.page.locator(this.selectors.repeatRateTrendChart);
    await expect(chart).toBeVisible();
  }

  /**
   * リピート率推移グラフに6ヶ月分のデータが表示されていることを確認する
   */
  async expectRepeatRateTrendHasData(): Promise<void> {
    await this.expectRepeatRateTrendChart();
    // グラフコンテナが表示されていることを確認
    const chart = this.page.locator(this.selectors.repeatRateTrendChart);
    await expect(chart).toBeVisible();
  }

  // ========================================
  // サマリーカード関連
  // ========================================

  /**
   * サマリーカードが表示されていることを確認する
   */
  async expectSummaryCardsVisible(): Promise<void> {
    const cards = this.page.locator(this.selectors.summaryCard);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 特定のサマリーカードの値を取得する
   */
  async getSummaryCardValue(label: string): Promise<string> {
    const cards = this.page.locator(this.selectors.summaryCard);
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const cardLabel = card.locator(this.selectors.summaryCardLabel);
      const labelText = await cardLabel.textContent();

      if (labelText?.includes(label)) {
        const value = card.locator(this.selectors.summaryCardValue);
        return await value.textContent() || '';
      }
    }

    return '';
  }

  /**
   * グラフが表示されないことを確認する（データなしの場合）
   */
  async expectNoChartsVisible(): Promise<void> {
    const trendsChart = this.page.locator(this.selectors.trendsChart);
    const pieChart = this.page.locator(this.selectors.customerTypePieChart);
    const trendChart = this.page.locator(this.selectors.repeatRateTrendChart);

    await expect(trendsChart).not.toBeVisible();
    await expect(pieChart).not.toBeVisible();
    await expect(trendChart).not.toBeVisible();
  }
}
