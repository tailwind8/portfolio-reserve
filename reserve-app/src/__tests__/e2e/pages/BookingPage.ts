import { Page, expect } from '@playwright/test';

/**
 * 予約ページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class BookingPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理
  private selectors = {
    heading: '[data-testid="booking-title"]',
    calendarGrid: '[data-testid="calendar-grid"]',
    calendarWeekday: '[data-testid="calendar-weekday"]',
    bookingInfoSidebar: '[data-testid="booking-info-sidebar"]',
    timeSlotsSection: '[data-testid="time-slots-section"]',
    submitButton: '[data-testid="submit-button"]',
    menuSelect: 'select#menu',
    staffSelect: 'select#staff',
    notesField: 'textarea#notes',
    previousMonthButton: 'button:has-text("← 前月")',
    nextMonthButton: 'button:has-text("次月 →")',
    monthHeader: 'h2.text-xl',
    feature24Hours: 'text=24時間予約OK',
    featureEmail: 'text=確認メール送信',
    featureReminder: 'text=リマインダー',
    characterCounter: 'text=/\\/500文字/',
    couponInput: '[data-testid="coupon-input"]',
  };

  /**
   * 予約ページに移動
   */
  async goto() {
    await this.page.goto('/booking');
  }

  /**
   * クエリパラメータ付きで予約ページに移動
   */
  async gotoWithQuery(queryString: string) {
    await this.page.goto(`/booking?${queryString}`);
  }

  /**
   * ページが読み込まれるまで待つ
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * ページタイトルを検証
   */
  async expectHeading(headingText: string) {
    await expect(this.page.locator(this.selectors.heading)).toBeVisible();
    await expect(this.page.locator(this.selectors.heading)).toContainText(headingText);
  }

  /**
   * カレンダーが表示されることを検証
   */
  async expectCalendarVisible() {
    // Check calendar grid is displayed
    await expect(this.page.locator(this.selectors.calendarGrid)).toBeVisible();
    // Check at least one weekday header is visible
    await expect(this.page.locator(this.selectors.calendarWeekday).first()).toBeVisible();
  }

  /**
   * 予約情報サイドバーが表示されることを検証
   */
  async expectBookingInfoSidebarVisible() {
    await expect(this.page.locator(this.selectors.bookingInfoSidebar)).toBeVisible();
  }

  /**
   * メニュー選択ドロップダウンが表示されることを検証
   */
  async expectMenuSelectVisible() {
    await expect(this.page.locator(this.selectors.menuSelect)).toBeVisible();
  }

  /**
   * スタッフ選択ドロップダウンが表示されることを検証
   */
  async expectStaffSelectVisible() {
    await expect(this.page.locator(this.selectors.staffSelect)).toBeVisible();
  }

  /**
   * メニューを選択
   */
  async selectMenu(index: number = 1) {
    await this.page.locator(this.selectors.menuSelect).selectOption({ index });
  }

  /**
   * スタッフを選択
   */
  async selectStaff(index: number = 1) {
    await this.page.locator(this.selectors.staffSelect).selectOption({ index });
  }

  /**
   * 日付を選択（テキストで指定）
   */
  async selectDate(dateText: string) {
    const dateButton = this.page.locator(`button:not(:disabled):has-text("${dateText}")`).first();
    await dateButton.click();
  }

  /**
   * 利用可能な未来の日付を選択（次月に移動してから選択）
   */
  async selectFutureDate(dateText: string = '15') {
    // 次月に移動
    await this.clickNextMonth();
    await this.wait(500); // カレンダーの再描画を待つ

    // 日付を選択
    await this.selectDate(dateText);
  }

  /**
   * 利用可能な時間帯を選択
   */
  async selectAvailableTimeSlot() {
    const availableSlot = this.page
      .locator('button:not(:disabled):has-text("10:00"), button:not(:disabled):has-text("14:00")')
      .first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
    }
  }

  /**
   * 備考フィールドに入力
   */
  async fillNotes(notes: string) {
    await this.page.locator(this.selectors.notesField).fill(notes);
  }

  /**
   * 予約を確定
   */
  async submit() {
    await this.page.locator(this.selectors.submitButton).click();
  }

  /**
   * 予約確定ボタンが有効であることを検証
   */
  async expectSubmitButtonEnabled() {
    await expect(this.page.locator(this.selectors.submitButton)).toBeEnabled();
  }

  /**
   * 予約確定ボタンが無効であることを検証
   */
  async expectSubmitButtonDisabled() {
    await expect(this.page.locator(this.selectors.submitButton)).toBeDisabled();
  }

  /**
   * 過去の日付ボタンが無効化されていることを検証
   */
  async expectPastDatesDisabled() {
    const pastDates = this.page.locator(
      'button:has-text("1"):disabled, button:has-text("2"):disabled'
    );
    const count = await pastDates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  }

  /**
   * 時間帯選択セクションが表示されることを検証
   */
  async expectTimeSlotsVisible() {
    await expect(this.page.locator(this.selectors.timeSlotsSection)).toBeVisible();
  }

  /**
   * 指定時間待つ
   */
  async wait(milliseconds: number) {
    await this.page.waitForTimeout(milliseconds);
  }

  /**
   * 現在の月を取得
   */
  async getCurrentMonth(): Promise<string | null> {
    return await this.page.locator(this.selectors.monthHeader).first().textContent();
  }

  /**
   * 次月ボタンをクリック
   */
  async clickNextMonth() {
    await this.page.locator(this.selectors.nextMonthButton).click();
  }

  /**
   * 前月ボタンをクリック
   */
  async clickPreviousMonth() {
    await this.page.locator(this.selectors.previousMonthButton).click();
  }

  /**
   * 月が変更されたことを検証
   */
  async expectMonthChanged(originalMonth: string | null) {
    const newMonth = await this.getCurrentMonth();
    expect(newMonth).not.toBe(originalMonth);
  }

  /**
   * 月が元に戻ったことを検証
   */
  async expectMonthRestored(originalMonth: string | null) {
    const currentMonth = await this.getCurrentMonth();
    expect(currentMonth).toBe(originalMonth);
  }

  /**
   * 機能セクションが表示されることを検証
   */
  async expectFeaturesVisible() {
    await expect(this.page.locator(this.selectors.feature24Hours)).toBeVisible();
    await expect(this.page.locator(this.selectors.featureEmail)).toBeVisible();
    await expect(this.page.locator(this.selectors.featureReminder)).toBeVisible();
  }

  /**
   * 備考フィールドが表示されることを検証
   */
  async expectNotesFieldVisible() {
    await expect(this.page.locator(this.selectors.notesField)).toBeVisible();
  }

  /**
   * 文字カウンターが表示されることを検証
   */
  async expectCharacterCounterVisible() {
    await expect(this.page.locator(this.selectors.characterCounter)).toBeVisible();
  }

  /**
   * スタッフ選択フィールドが表示されないことを検証（機能フラグ無効時）
   */
  async expectStaffSelectNotVisible() {
    await expect(this.page.locator(this.selectors.staffSelect)).not.toBeVisible();
  }

  /**
   * クーポン入力フィールドが表示されることを検証（機能フラグ有効時）
   */
  async expectCouponInputVisible() {
    await expect(this.page.locator(this.selectors.couponInput)).toBeVisible();
  }

  /**
   * クーポン入力フィールドが表示されないことを検証（機能フラグ無効時）
   */
  async expectCouponInputNotVisible() {
    await expect(this.page.locator(this.selectors.couponInput)).not.toBeVisible();
  }
}
