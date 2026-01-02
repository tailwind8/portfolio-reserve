import { Page, expect, Locator } from '@playwright/test';

/**
 * 機能フラグ管理ページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class FeatureFlagsPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理（data-testid使用）
  private selectors = {
    heading: 'h1',
    tenantSelect: '[data-testid="tenant-select"]',
    saveButton: '[data-testid="save-feature-flags"]',
    enableAllButton: '[data-testid="enable-all"]',
    disableAllButton: '[data-testid="disable-all"]',
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
  };

  /**
   * 機能フラグ管理ページに移動
   * @param path - ページのパス（デフォルト: '/super-admin/feature-flags'）
   */
  async goto(path = '/super-admin/feature-flags') {
    await this.page.goto(path);
  }

  /**
   * ページが読み込まれるまで待つ
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 見出しを検証
   */
  async expectHeading(headingText: string) {
    await expect(this.page.locator(this.selectors.heading)).toContainText(
      headingText
    );
  }

  /**
   * テナント選択ドロップダウンが表示されることを検証
   */
  async expectTenantSelectVisible() {
    await expect(this.page.locator(this.selectors.tenantSelect)).toBeVisible();
  }

  /**
   * 保存ボタンが表示されることを検証
   */
  async expectSaveButtonVisible() {
    await expect(this.page.locator(this.selectors.saveButton)).toBeVisible();
  }

  /**
   * 特定の機能フラグのトグルスイッチを取得
   * @param featureName - 機能名（例: 'enableStaffSelection'）
   */
  private getToggle(featureName: string): Locator {
    return this.page.locator(`[data-testid="toggle-${featureName}"]`);
  }

  /**
   * 特定の機能フラグがONであることを検証
   * @param featureName - 機能名
   */
  async expectFeatureEnabled(featureName: string) {
    const toggle = this.getToggle(featureName);
    await expect(toggle).toBeChecked();
  }

  /**
   * 特定の機能フラグがOFFであることを検証
   * @param featureName - 機能名
   */
  async expectFeatureDisabled(featureName: string) {
    const toggle = this.getToggle(featureName);
    await expect(toggle).not.toBeChecked();
  }

  /**
   * 特定の機能フラグをONにする
   * @param featureName - 機能名
   */
  async enableFeature(featureName: string) {
    const toggle = this.getToggle(featureName);
    if (!(await toggle.isChecked())) {
      await toggle.click();
    }
  }

  /**
   * 特定の機能フラグをOFFにする
   * @param featureName - 機能名
   */
  async disableFeature(featureName: string) {
    const toggle = this.getToggle(featureName);
    if (await toggle.isChecked()) {
      await toggle.click();
    }
  }

  /**
   * 特定の機能フラグのトグルをクリック（状態反転）
   * @param featureName - 機能名
   */
  async toggleFeature(featureName: string) {
    const toggle = this.getToggle(featureName);
    // force: trueを使用してスタイル要素の干渉を回避
    await toggle.click({ force: true });
  }

  /**
   * 保存ボタンをクリック
   */
  async save() {
    await this.page.locator(this.selectors.saveButton).click();
  }

  /**
   * 保存ボタンが有効であることを検証
   */
  async expectSaveButtonEnabled() {
    await expect(this.page.locator(this.selectors.saveButton)).toBeEnabled();
  }

  /**
   * 保存ボタンが無効であることを検証
   */
  async expectSaveButtonDisabled() {
    await expect(this.page.locator(this.selectors.saveButton)).toBeDisabled();
  }

  /**
   * すべて有効化ボタンをクリック
   */
  async enableAll() {
    await this.page.locator(this.selectors.enableAllButton).click();
  }

  /**
   * すべて無効化ボタンをクリック
   */
  async disableAll() {
    await this.page.locator(this.selectors.disableAllButton).click();
  }

  /**
   * 成功メッセージが表示されることを検証
   * @param message - メッセージ内容（デフォルト: "保存しました"）
   */
  async expectSuccessMessage(message: string = '保存しました') {
    const element = this.page.locator(`text=${message}`);
    await expect(element).toBeVisible({ timeout: 10000 });
  }

  /**
   * エラーメッセージが表示されることを検証
   * @param message - メッセージ内容
   */
  async expectErrorMessage(message: string) {
    const element = this.page.locator(`text=${message}`);
    await expect(element).toBeVisible({ timeout: 10000 });
  }

  /**
   * ローディング表示が表示されることを検証
   */
  async expectLoadingVisible() {
    await expect(this.page.locator(this.selectors.loadingSpinner)).toBeVisible();
  }

  /**
   * テナントを選択
   * @param tenantId - テナントID
   */
  async selectTenant(tenantId: string) {
    await this.page.locator(this.selectors.tenantSelect).selectOption(tenantId);
  }

  /**
   * 10種類のオプション機能が表示されることを検証
   */
  async expectAllFeaturesVisible() {
    const features = [
      'enableStaffSelection',
      'enableStaffShiftManagement',
      'enableCustomerManagement',
      'enableReservationUpdate',
      'enableReminderEmail',
      'enableManualReservation',
      'enableAnalyticsReport',
      'enableRepeatRateAnalysis',
      'enableCouponFeature',
      'enableLineNotification',
    ];

    for (const feature of features) {
      await expect(this.getToggle(feature)).toBeVisible();
    }
  }

  /**
   * 特定の機能に「実装済み」バッジが表示されることを検証
   * @param featureName - 機能の表示名（日本語）
   */
  async expectImplementedBadge(featureName: string) {
    const badge = this.page.locator(
      `text=${featureName} >> .. >> text=実装済み`
    );
    await expect(badge).toBeVisible();
  }

  /**
   * 特定の機能に「未実装」バッジが表示されることを検証
   * @param featureName - 機能の表示名（日本語）
   */
  async expectNotImplementedBadge(featureName: string) {
    const badge = this.page.locator(
      `text=${featureName} >> .. >> text=未実装`
    );
    await expect(badge).toBeVisible();
  }

  /**
   * ページをリロード
   */
  async reload() {
    await this.page.reload();
  }
}
