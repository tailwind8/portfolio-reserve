import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者ダッシュボード
 *
 * このクラスは管理者ダッシュボードページのすべての要素とインタラクションを管理します。
 * テストコードから実装詳細を隠蔽し、data-testid属性を使用して要素を特定します。
 */
export class AdminDashboardPage {
  readonly page: Page;

  // セレクタ定義（すべてdata-testid属性を使用）
  private readonly selectors = {
    // ローディング・エラー
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',

    // 統計カード
    todayReservationsCard: '[data-testid="stat-today-reservations"]',
    monthlyReservationsCard: '[data-testid="stat-monthly-reservations"]',
    monthlyRevenueCard: '[data-testid="stat-monthly-revenue"]',
    repeatRateCard: '[data-testid="stat-repeat-rate"]',

    // 統計カード内の要素
    statLabel: '[data-testid="stat-label"]',
    statValue: '[data-testid="stat-value"]',
    statChange: '[data-testid="stat-change"]',

    // 本日の予約
    todayReservationsSection: '[data-testid="today-reservations-section"]',
    todayReservationsTitle: '[data-testid="today-reservations-title"]',
    viewAllButton: '[data-testid="view-all-reservations"]',
    reservationItem: '[data-testid="reservation-item"]',
    reservationTime: '[data-testid="reservation-time"]',
    reservationCustomer: '[data-testid="reservation-customer"]',
    reservationMenu: '[data-testid="reservation-menu"]',
    reservationStaff: '[data-testid="reservation-staff"]',
    reservationStatus: '[data-testid="reservation-status"]',
    noReservationsMessage: '[data-testid="no-reservations-message"]',

    // 週間予約状況
    weeklyStatsSection: '[data-testid="weekly-stats-section"]',
    weeklyStatsTitle: '[data-testid="weekly-stats-title"]',
    weeklyBar: '[data-testid="weekly-bar"]',
    weeklyDayLabel: '[data-testid="weekly-day-label"]',

    // クイックアクション
    quickActionsSection: '[data-testid="quick-actions-section"]',
    addReservationButton: '[data-testid="add-reservation-button"]',
    addCustomerButton: '[data-testid="add-customer-button"]',

    // スタッフ出勤状況
    staffStatusSection: '[data-testid="staff-status-section"]',
    staffStatusTitle: '[data-testid="staff-status-title"]',
    staffItem: '[data-testid="staff-item"]',
    staffName: '[data-testid="staff-name"]',
    staffStatus: '[data-testid="staff-status-text"]',
    staffIndicator: '[data-testid="staff-indicator"]',

    // 最近の活動
    recentActivitySection: '[data-testid="recent-activity-section"]',
    recentActivityTitle: '[data-testid="recent-activity-title"]',
    activityItem: '[data-testid="activity-item"]',
    activityIcon: '[data-testid="activity-icon"]',
    activityAction: '[data-testid="activity-action"]',
    activityTime: '[data-testid="activity-time"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * ダッシュボードページに移動する
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/dashboard');
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
   * 統計カードが表示されていることを確認する
   */
  async expectStatsCardsVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.todayReservationsCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.monthlyReservationsCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.monthlyRevenueCard)).toBeVisible();
    await expect(this.page.locator(this.selectors.repeatRateCard)).toBeVisible();
  }

  /**
   * 本日の予約件数を取得する
   */
  async getTodayReservationsCount(): Promise<string> {
    const card = this.page.locator(this.selectors.todayReservationsCard);
    const value = card.locator(this.selectors.statValue);
    return await value.textContent() || '';
  }

  /**
   * 今月の予約件数を取得する
   */
  async getMonthlyReservationsCount(): Promise<string> {
    const card = this.page.locator(this.selectors.monthlyReservationsCard);
    const value = card.locator(this.selectors.statValue);
    return await value.textContent() || '';
  }

  /**
   * 今月の売上を取得する
   */
  async getMonthlyRevenue(): Promise<string> {
    const card = this.page.locator(this.selectors.monthlyRevenueCard);
    const value = card.locator(this.selectors.statValue);
    return await value.textContent() || '';
  }

  /**
   * リピート率を取得する
   */
  async getRepeatRate(): Promise<string> {
    const card = this.page.locator(this.selectors.repeatRateCard);
    const value = card.locator(this.selectors.statValue);
    return await value.textContent() || '';
  }

  /**
   * 統計カードに変化率が表示されていることを確認する
   */
  async expectStatsWithChanges(): Promise<void> {
    const cards = [
      this.selectors.todayReservationsCard,
      this.selectors.monthlyReservationsCard,
      this.selectors.monthlyRevenueCard,
      this.selectors.repeatRateCard,
    ];

    for (const cardSelector of cards) {
      const card = this.page.locator(cardSelector);
      const change = card.locator(this.selectors.statChange);
      await expect(change).toBeVisible();
    }
  }

  /**
   * 本日の予約一覧の件数を取得する
   */
  async getTodayReservationsListCount(): Promise<number> {
    return await this.page.locator(this.selectors.reservationItem).count();
  }

  /**
   * 本日の予約一覧が表示されていることを確認する
   */
  async expectTodayReservationsListVisible(): Promise<void> {
    const section = this.page.locator(this.selectors.todayReservationsSection);
    await expect(section).toBeVisible();

    const count = await this.getTodayReservationsListCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * 特定の予約アイテムの詳細を確認する
   */
  async expectReservationItem(index: number, expectedData: {
    time?: string;
    customer?: string;
    menu?: string;
    staff?: string;
    status?: string;
  }): Promise<void> {
    const item = this.page.locator(this.selectors.reservationItem).nth(index);
    await expect(item).toBeVisible();

    if (expectedData.time) {
      const time = item.locator(this.selectors.reservationTime);
      await expect(time).toContainText(expectedData.time);
    }

    if (expectedData.customer) {
      const customer = item.locator(this.selectors.reservationCustomer);
      await expect(customer).toContainText(expectedData.customer);
    }

    if (expectedData.menu) {
      const menu = item.locator(this.selectors.reservationMenu);
      await expect(menu).toContainText(expectedData.menu);
    }

    if (expectedData.staff) {
      const staff = item.locator(this.selectors.reservationStaff);
      await expect(staff).toContainText(expectedData.staff);
    }

    if (expectedData.status) {
      const status = item.locator(this.selectors.reservationStatus);
      await expect(status).toBeVisible();
    }
  }

  /**
   * 予約がない場合のメッセージを確認する
   */
  async expectNoReservationsMessage(): Promise<void> {
    const message = this.page.locator(this.selectors.noReservationsMessage);
    await expect(message).toBeVisible();
    await expect(message).toContainText('本日の予約はありません');
  }

  /**
   * 週間予約状況グラフが表示されていることを確認する
   */
  async expectWeeklyStatsVisible(): Promise<void> {
    const section = this.page.locator(this.selectors.weeklyStatsSection);
    await expect(section).toBeVisible();
  }

  /**
   * 週間予約状況の曜日ラベルを確認する
   */
  async expectWeeklyDayLabels(): Promise<void> {
    const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

    for (const day of weekDays) {
      const dayLabel = this.page.locator(this.selectors.weeklyDayLabel, { hasText: day });
      await expect(dayLabel).toBeVisible();
    }
  }

  /**
   * 週間予約状況のバーが表示されていることを確認する
   */
  async expectWeeklyBarsVisible(): Promise<void> {
    const bars = this.page.locator(this.selectors.weeklyBar);
    const count = await bars.count();
    expect(count).toBe(7); // 月〜日の7本
  }

  /**
   * スタッフ出勤状況が表示されていることを確認する
   */
  async expectStaffStatusVisible(): Promise<void> {
    const section = this.page.locator(this.selectors.staffStatusSection);
    await expect(section).toBeVisible();
  }

  /**
   * スタッフアイテムの詳細を確認する
   */
  async expectStaffItem(index: number, expectedData: {
    name?: string;
    status?: string;
    available?: boolean;
  }): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    await expect(item).toBeVisible();

    if (expectedData.name) {
      const name = item.locator(this.selectors.staffName);
      await expect(name).toContainText(expectedData.name);
    }

    if (expectedData.status) {
      const status = item.locator(this.selectors.staffStatus);
      await expect(status).toContainText(expectedData.status);
    }

    if (expectedData.available !== undefined) {
      const indicator = item.locator(this.selectors.staffIndicator);
      await expect(indicator).toBeVisible();
    }
  }

  /**
   * クイックアクションボタンが表示されていることを確認する
   */
  async expectQuickActionsVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.addReservationButton)).toBeVisible();
    await expect(this.page.locator(this.selectors.addCustomerButton)).toBeVisible();
  }

  /**
   * 最近の活動が表示されていることを確認する
   */
  async expectRecentActivityVisible(): Promise<void> {
    const section = this.page.locator(this.selectors.recentActivitySection);
    await expect(section).toBeVisible();
  }

  /**
   * 最近の活動アイテムの詳細を確認する
   */
  async expectActivityItem(index: number, expectedData: {
    action?: string;
    time?: string;
  }): Promise<void> {
    const item = this.page.locator(this.selectors.activityItem).nth(index);
    await expect(item).toBeVisible();

    if (expectedData.action) {
      const action = item.locator(this.selectors.activityAction);
      await expect(action).toContainText(expectedData.action);
    }

    if (expectedData.time) {
      const time = item.locator(this.selectors.activityTime);
      await expect(time).toContainText(expectedData.time);
    }
  }

  /**
   * 新規予約追加ボタンをクリックする
   */
  async clickAddReservation(): Promise<void> {
    await this.page.locator(this.selectors.addReservationButton).click();
  }

  /**
   * 顧客追加ボタンをクリックする
   */
  async clickAddCustomer(): Promise<void> {
    await this.page.locator(this.selectors.addCustomerButton).click();
  }

  /**
   * すべて表示ボタンをクリックする
   */
  async clickViewAll(): Promise<void> {
    await this.page.locator(this.selectors.viewAllButton).click();
  }
}
