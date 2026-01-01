import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者店舗設定ページ
 * Path: /admin/settings
 * Issue: #24
 */
export class AdminSettingsPage {
  constructor(public readonly page: Page) {}

  /**
   * 店舗設定ページに遷移
   */
  async goto() {
    await this.page.goto('/admin/settings');
    await this.page.waitForLoadState('networkidle');
  }

  // ========================================
  // 基本要素の確認
  // ========================================

  /**
   * ページタイトルが表示されることを確認
   */
  async expectPageTitle(title: string) {
    await expect(this.page.locator('[data-testid="page-title"]')).toHaveText(title);
  }

  /**
   * 店舗基本情報セクションが表示されることを確認
   */
  async expectStoreInfoSectionVisible() {
    await expect(this.page.locator('[data-testid="store-info-section"]')).toBeVisible();
  }

  /**
   * 営業時間設定セクションが表示されることを確認
   */
  async expectBusinessHoursSectionVisible() {
    await expect(this.page.locator('[data-testid="business-hours-section"]')).toBeVisible();
  }

  /**
   * 定休日設定セクションが表示されることを確認
   */
  async expectClosedDaysSectionVisible() {
    await expect(this.page.locator('[data-testid="closed-days-section"]')).toBeVisible();
  }

  /**
   * 予約枠設定セクションが表示されることを確認
   */
  async expectSlotDurationSectionVisible() {
    await expect(this.page.locator('[data-testid="slot-duration-section"]')).toBeVisible();
  }

  // ========================================
  // 店舗基本情報の操作
  // ========================================

  /**
   * 現在の店舗名を取得
   */
  async getStoreName(): Promise<string> {
    return await this.page.locator('[data-testid="store-name-input"]').inputValue();
  }

  /**
   * 店舗名を変更
   */
  async fillStoreName(name: string) {
    await this.page.locator('[data-testid="store-name-input"]').fill(name);
  }

  /**
   * 店舗名が表示されることを確認
   */
  async expectStoreName(name: string) {
    await expect(this.page.locator('[data-testid="store-name-input"]')).toHaveValue(name);
  }

  /**
   * 現在のメールアドレスを取得
   */
  async getStoreEmail(): Promise<string> {
    return await this.page.locator('[data-testid="store-email-input"]').inputValue();
  }

  /**
   * メールアドレスを変更
   */
  async fillStoreEmail(email: string) {
    await this.page.locator('[data-testid="store-email-input"]').fill(email);
  }

  /**
   * メールアドレスが表示されることを確認
   */
  async expectStoreEmail(email: string) {
    await expect(this.page.locator('[data-testid="store-email-input"]')).toHaveValue(email);
  }

  /**
   * 現在の電話番号を取得
   */
  async getStorePhone(): Promise<string> {
    return await this.page.locator('[data-testid="store-phone-input"]').inputValue();
  }

  /**
   * 電話番号を変更
   */
  async fillStorePhone(phone: string) {
    await this.page.locator('[data-testid="store-phone-input"]').fill(phone);
  }

  /**
   * 電話番号が表示されることを確認
   */
  async expectStorePhone(phone: string) {
    await expect(this.page.locator('[data-testid="store-phone-input"]')).toHaveValue(phone);
  }

  // ========================================
  // 営業時間の操作
  // ========================================

  /**
   * 現在の開店時刻を取得
   */
  async getOpenTime(): Promise<string> {
    return await this.page.locator('[data-testid="open-time-input"]').inputValue();
  }

  /**
   * 開店時刻を変更
   */
  async fillOpenTime(time: string) {
    await this.page.locator('[data-testid="open-time-input"]').fill(time);
  }

  /**
   * 開店時刻が表示されることを確認
   */
  async expectOpenTime(time: string) {
    await expect(this.page.locator('[data-testid="open-time-input"]')).toHaveValue(time);
  }

  /**
   * 現在の閉店時刻を取得
   */
  async getCloseTime(): Promise<string> {
    return await this.page.locator('[data-testid="close-time-input"]').inputValue();
  }

  /**
   * 閉店時刻を変更
   */
  async fillCloseTime(time: string) {
    await this.page.locator('[data-testid="close-time-input"]').fill(time);
  }

  /**
   * 閉店時刻が表示されることを確認
   */
  async expectCloseTime(time: string) {
    await expect(this.page.locator('[data-testid="close-time-input"]')).toHaveValue(time);
  }

  // ========================================
  // 定休日の操作
  // ========================================

  /**
   * 定休日チェックボックスをチェック
   * @param day 曜日（例: "MONDAY", "TUESDAY"）
   */
  async checkClosedDay(day: string) {
    const checkbox = this.page.locator(`[data-testid="closed-day-${day}"]`);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }

  /**
   * 定休日チェックボックスのチェックを外す
   * @param day 曜日（例: "MONDAY", "TUESDAY"）
   */
  async uncheckClosedDay(day: string) {
    const checkbox = this.page.locator(`[data-testid="closed-day-${day}"]`);
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }

  /**
   * 定休日がチェック済みであることを確認
   */
  async expectClosedDayChecked(day: string) {
    await expect(this.page.locator(`[data-testid="closed-day-${day}"]`)).toBeChecked();
  }

  /**
   * 定休日がチェックされていないことを確認
   */
  async expectClosedDayUnchecked(day: string) {
    await expect(this.page.locator(`[data-testid="closed-day-${day}"]`)).not.toBeChecked();
  }

  // ========================================
  // 予約枠設定の操作
  // ========================================

  /**
   * 現在の予約枠間隔を取得
   */
  async getSlotDuration(): Promise<string> {
    return await this.page.locator('[data-testid="slot-duration-select"]').inputValue();
  }

  /**
   * 予約枠間隔を変更
   * @param duration 分数（例: "30", "60"）
   */
  async selectSlotDuration(duration: string) {
    await this.page.locator('[data-testid="slot-duration-select"]').selectOption(duration);
  }

  /**
   * 予約枠間隔が選択されていることを確認
   */
  async expectSlotDuration(duration: string) {
    await expect(this.page.locator('[data-testid="slot-duration-select"]')).toHaveValue(
      duration
    );
  }

  // ========================================
  // 保存操作
  // ========================================

  /**
   * 保存ボタンをクリック
   */
  async clickSave() {
    await this.page.locator('[data-testid="save-settings-button"]').click();
  }

  /**
   * 保存ボタンが無効化されていることを確認
   */
  async expectSaveButtonDisabled() {
    await expect(this.page.locator('[data-testid="save-settings-button"]')).toBeDisabled();
  }

  /**
   * 保存ボタンが有効化されていることを確認
   */
  async expectSaveButtonEnabled() {
    await expect(this.page.locator('[data-testid="save-settings-button"]')).toBeEnabled();
  }

  // ========================================
  // メッセージ
  // ========================================

  /**
   * 成功メッセージが表示されることを確認
   */
  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message);
  }

  /**
   * エラーメッセージが表示されることを確認
   */
  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message);
  }

  /**
   * バリデーションエラーが表示されることを確認
   */
  async expectValidationError(message: string) {
    await expect(this.page.locator('[data-testid="validation-error"]')).toContainText(message);
  }

  // ========================================
  // ローディング状態
  // ========================================

  /**
   * ローディングインジケーターが表示されることを確認
   */
  async expectLoadingIndicator() {
    await expect(this.page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  }

  /**
   * ローディングインジケーターが非表示になることを確認
   */
  async expectLoadingIndicatorHidden() {
    await expect(this.page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  }

  // ========================================
  // ページリロード
  // ========================================

  /**
   * ページをリロード
   */
  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  // ========================================
  // レスポンシブ
  // ========================================

  /**
   * 画面サイズを設定
   */
  async setViewportSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }

  // ========================================
  // 認証
  // ========================================

  /**
   * ログインページにリダイレクトされることを確認
   */
  async expectRedirectToLogin() {
    await expect(this.page).toHaveURL(/\/login/);
  }

  /**
   * アクセス拒否メッセージが表示されることを確認
   */
  async expectAccessDeniedMessage() {
    await expect(this.page.locator('[data-testid="access-denied-message"]')).toBeVisible();
  }

  // ========================================
  // システム公開設定
  // ========================================

  /**
   * システム公開設定セクションが表示されることを確認
   */
  async expectSystemPublicSectionVisible() {
    await expect(this.page.locator('[data-testid="system-public-section"]')).toBeVisible();
  }

  /**
   * isPublicトグルをONにする（公開中）
   */
  async enableIsPublic() {
    const toggle = this.page.locator('[data-testid="is-public-toggle"]');
    if (!(await toggle.isChecked())) {
      await toggle.check();
    }
  }

  /**
   * isPublicトグルをOFFにする（非公開）
   */
  async disableIsPublic() {
    const toggle = this.page.locator('[data-testid="is-public-toggle"]');
    if (await toggle.isChecked()) {
      await toggle.uncheck();
    }
  }

  /**
   * isPublicトグルがONであることを確認
   */
  async expectIsPublicEnabled() {
    await expect(this.page.locator('[data-testid="is-public-toggle"]')).toBeChecked();
  }

  /**
   * isPublicトグルがOFFであることを確認
   */
  async expectIsPublicDisabled() {
    await expect(this.page.locator('[data-testid="is-public-toggle"]')).not.toBeChecked();
  }

  /**
   * isPublicラベルテキストを確認
   */
  async expectIsPublicLabel(label: 'システム公開中' | 'メンテナンス中（非公開）') {
    await expect(this.page.locator('[data-testid="is-public-label"]')).toHaveText(label);
  }
}
