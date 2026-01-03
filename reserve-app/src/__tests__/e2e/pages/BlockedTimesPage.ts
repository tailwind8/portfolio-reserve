import { Page, expect } from '@playwright/test';

/**
 * 予約ブロック管理ページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class BlockedTimesPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理
  private selectors = {
    // ページ要素
    pageHeading: '[data-testid="blocked-times-heading"]',
    addButton: '[data-testid="add-blocked-time-button"]',
    blockedTimesList: '[data-testid="blocked-times-list"]',
    emptyState: '[data-testid="empty-state"]',

    // ブロックカード
    blockedTimeCard: '[data-testid="blocked-time-card"]',
    startDateTime: '[data-testid="start-date-time"]',
    endDateTime: '[data-testid="end-date-time"]',
    reason: '[data-testid="reason"]',
    description: '[data-testid="description"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',

    // フォームモーダル
    formModal: '[data-testid="blocked-time-form-modal"]',
    formHeading: '[data-testid="form-heading"]',
    startDateTimeInput: '[data-testid="start-date-time-input"]',
    endDateTimeInput: '[data-testid="end-date-time-input"]',
    reasonSelect: '[data-testid="reason-select"]',
    descriptionTextarea: '[data-testid="description-textarea"]',
    submitButton: '[data-testid="submit-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    closeButton: '[data-testid="close-button"]',

    // 削除確認ダイアログ
    deleteDialog: '[data-testid="delete-dialog"]',
    deleteDialogHeading: '[data-testid="delete-dialog-heading"]',
    deleteDialogMessage: '[data-testid="delete-dialog-message"]',
    confirmDeleteButton: '[data-testid="confirm-delete-button"]',
    cancelDeleteButton: '[data-testid="cancel-delete-button"]',

    // フィルター
    dateRangeFilter: '[data-testid="date-range-filter"]',
    fromDateInput: '[data-testid="from-date-input"]',
    toDateInput: '[data-testid="to-date-input"]',
    applyFilterButton: '[data-testid="apply-filter-button"]',

    // メッセージ
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
  };

  // ===========================================
  // ナビゲーション
  // ===========================================

  /**
   * 予約ブロック管理ページに移動
   */
  async goto() {
    await this.page.goto('/admin/blocked-times');
  }

  /**
   * ページが読み込まれるまで待つ
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  // ===========================================
  // 基本表示の検証
  // ===========================================

  /**
   * ページ見出しを検証
   */
  async expectPageHeading(headingText: string) {
    await expect(this.page.locator(this.selectors.pageHeading))
      .toContainText(headingText);
  }

  /**
   * 新規追加ボタンが表示されることを検証
   */
  async expectAddButtonVisible() {
    await expect(this.page.locator(this.selectors.addButton)).toBeVisible();
  }

  /**
   * ブロック一覧が表示されることを検証
   */
  async expectBlockedTimesListVisible() {
    await expect(this.page.locator(this.selectors.blockedTimesList)).toBeVisible();
  }

  /**
   * 空状態が表示されることを検証
   */
  async expectEmptyStateVisible() {
    await expect(this.page.locator(this.selectors.emptyState)).toBeVisible();
  }

  // ===========================================
  // ブロック一覧の検証
  // ===========================================

  /**
   * ブロックカードの件数を取得
   */
  async getBlockedTimeCount(): Promise<number> {
    return await this.page.locator(this.selectors.blockedTimeCard).count();
  }

  /**
   * 特定のブロックが表示されることを検証
   */
  async expectBlockedTimeVisible(startDateTime: string, endDateTime: string) {
    const card = this.page.locator(this.selectors.blockedTimeCard).filter({
      has: this.page.locator(this.selectors.startDateTime, { hasText: startDateTime }),
    });
    await expect(card).toBeVisible();
  }

  /**
   * ブロックの詳細情報を検証
   */
  async expectBlockedTimeDetails(
    startDateTime: string,
    endDateTime: string,
    reason: string,
    description?: string
  ) {
    const card = this.page.locator(this.selectors.blockedTimeCard).filter({
      has: this.page.locator(this.selectors.startDateTime, { hasText: startDateTime }),
    });

    await expect(card.locator(this.selectors.startDateTime)).toContainText(startDateTime);
    await expect(card.locator(this.selectors.endDateTime)).toContainText(endDateTime);
    await expect(card.locator(this.selectors.reason)).toContainText(reason);

    if (description) {
      await expect(card.locator(this.selectors.description)).toContainText(description);
    }
  }

  // ===========================================
  // フォーム操作
  // ===========================================

  /**
   * 新規追加ボタンをクリック
   */
  async clickAddButton() {
    await this.page.locator(this.selectors.addButton).click();
  }

  /**
   * フォームモーダルが表示されることを検証
   */
  async expectFormModalVisible(expectedHeading: string) {
    await expect(this.page.locator(this.selectors.formModal)).toBeVisible();
    await expect(this.page.locator(this.selectors.formHeading))
      .toContainText(expectedHeading);
  }

  /**
   * 開始日時を入力
   */
  async fillStartDateTime(dateTime: string) {
    await this.page.locator(this.selectors.startDateTimeInput).fill(dateTime);
  }

  /**
   * 終了日時を入力
   */
  async fillEndDateTime(dateTime: string) {
    await this.page.locator(this.selectors.endDateTimeInput).fill(dateTime);
  }

  /**
   * 理由を選択
   */
  async selectReason(reason: string) {
    await this.page.locator(this.selectors.reasonSelect).selectOption(reason);
  }

  /**
   * 詳細説明を入力
   */
  async fillDescription(description: string) {
    await this.page.locator(this.selectors.descriptionTextarea).fill(description);
  }

  /**
   * 送信ボタンをクリック
   */
  async clickSubmitButton() {
    await this.page.locator(this.selectors.submitButton).click();
  }

  /**
   * キャンセルボタンをクリック
   */
  async clickCancelButton() {
    await this.page.locator(this.selectors.cancelButton).click();
  }

  /**
   * 閉じるボタンをクリック
   */
  async clickCloseButton() {
    await this.page.locator(this.selectors.closeButton).click();
  }

  /**
   * フォームモーダルが閉じていることを検証
   */
  async expectFormModalClosed() {
    await expect(this.page.locator(this.selectors.formModal)).not.toBeVisible();
  }

  // ===========================================
  // 編集・削除操作
  // ===========================================

  /**
   * 特定のブロックの編集ボタンをクリック
   */
  async clickEditButton(startDateTime: string) {
    const card = this.page.locator(this.selectors.blockedTimeCard).filter({
      has: this.page.locator(this.selectors.startDateTime, { hasText: startDateTime }),
    });
    await card.locator(this.selectors.editButton).click();
  }

  /**
   * 特定のブロックの削除ボタンをクリック
   */
  async clickDeleteButton(startDateTime: string) {
    const card = this.page.locator(this.selectors.blockedTimeCard).filter({
      has: this.page.locator(this.selectors.startDateTime, { hasText: startDateTime }),
    });
    await card.locator(this.selectors.deleteButton).click();
  }

  /**
   * 最初のブロックの編集ボタンをクリック
   */
  async clickFirstEditButton() {
    await this.page.locator(this.selectors.editButton).first().click();
  }

  /**
   * 最初のブロックの削除ボタンをクリック
   */
  async clickFirstDeleteButton() {
    await this.page.locator(this.selectors.deleteButton).first().click();
  }

  // ===========================================
  // 削除確認ダイアログ
  // ===========================================

  /**
   * 削除確認ダイアログが表示されることを検証
   */
  async expectDeleteDialogVisible() {
    await expect(this.page.locator(this.selectors.deleteDialog)).toBeVisible();
    await expect(this.page.locator(this.selectors.deleteDialogHeading))
      .toContainText('削除');
  }

  /**
   * 削除確認ボタンをクリック
   */
  async confirmDelete() {
    await this.page.locator(this.selectors.confirmDeleteButton).click();
  }

  /**
   * 削除キャンセルボタンをクリック
   */
  async cancelDelete() {
    await this.page.locator(this.selectors.cancelDeleteButton).click();
  }

  /**
   * 削除確認ダイアログが閉じていることを検証
   */
  async expectDeleteDialogClosed() {
    await expect(this.page.locator(this.selectors.deleteDialog)).not.toBeVisible();
  }

  // ===========================================
  // フィルター操作
  // ===========================================

  /**
   * 開始日付を入力
   */
  async fillFromDate(date: string) {
    await this.page.locator(this.selectors.fromDateInput).fill(date);
  }

  /**
   * 終了日付を入力
   */
  async fillToDate(date: string) {
    await this.page.locator(this.selectors.toDateInput).fill(date);
  }

  /**
   * フィルター適用ボタンをクリック
   */
  async applyFilter() {
    await this.page.locator(this.selectors.applyFilterButton).click();
  }

  /**
   * 日付範囲でフィルタリング
   */
  async filterByDateRange(fromDate: string, toDate: string) {
    await this.fillFromDate(fromDate);
    await this.fillToDate(toDate);
    await this.applyFilter();
    await this.waitForLoad();
  }

  // ===========================================
  // メッセージ検証
  // ===========================================

  /**
   * 成功メッセージが表示されることを検証
   */
  async expectSuccessMessage(message: string) {
    await expect(this.page.locator(this.selectors.successMessage))
      .toContainText(message, { timeout: 10000 });
  }

  /**
   * エラーメッセージが表示されることを検証
   */
  async expectErrorMessage(message: string) {
    await expect(this.page.locator(this.selectors.errorMessage))
      .toContainText(message, { timeout: 10000 });
  }

  /**
   * ブロックが一覧に追加されたことを検証
   */
  async expectBlockAdded(startDateTime: string, endDateTime: string) {
    await this.expectBlockedTimeVisible(startDateTime, endDateTime);
  }

  /**
   * ブロックが一覧から削除されたことを検証
   */
  async expectBlockDeleted(startDateTime: string) {
    const card = this.page.locator(this.selectors.blockedTimeCard).filter({
      has: this.page.locator(this.selectors.startDateTime, { hasText: startDateTime }),
    });
    await expect(card).not.toBeVisible();
  }

  /**
   * ブロックが更新されたことを検証
   */
  async expectBlockUpdated(
    startDateTime: string,
    endDateTime: string,
    reason?: string,
    description?: string
  ) {
    await this.expectBlockedTimeVisible(startDateTime, endDateTime);
    if (reason || description) {
      await this.expectBlockedTimeDetails(startDateTime, endDateTime, reason || '', description);
    }
  }

  // ===========================================
  // ユーティリティメソッド
  // ===========================================

  /**
   * 指定秒数待つ
   */
  async waitForSeconds(seconds: number) {
    await this.page.waitForTimeout(seconds * 1000);
  }

  /**
   * ブロック一覧をリロード
   */
  async reloadList() {
    await this.page.reload();
    await this.waitForLoad();
  }
}
