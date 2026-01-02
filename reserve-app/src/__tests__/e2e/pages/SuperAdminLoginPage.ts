import { Page, expect } from '@playwright/test';

export interface SuperAdminLoginFormData {
  email: string;
  password: string;
}

/**
 * スーパー管理者ログインページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class SuperAdminLoginPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理（data-testid使用）
  private selectors = {
    heading: 'h1',
    emailInput: '[data-testid="super-admin-email"]',
    passwordInput: '[data-testid="super-admin-password"]',
    submitButton: '[data-testid="super-admin-login-button"]',
    errorMessage: '[data-testid="error-message"]',
    adminLoginLink: 'a[href="/admin/login"]',
    userLoginLink: 'a[href="/login"]',
    warningMessage: '[data-testid="warning-message"]',
  };

  /**
   * スーパー管理者ログインページに移動
   * @param path - ログインページのパス（デフォルト: '/super-admin/login'）
   */
  async goto(path = '/super-admin/login') {
    await this.page.goto(path);
  }

  /**
   * ログイン処理（ショートカットメソッド）
   * @param email - メールアドレス
   * @param password - パスワード
   */
  async login(email: string, password: string) {
    await this.fillForm({ email, password });
    await this.submit();
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
   * フォームデータを入力
   */
  async fillForm(data: SuperAdminLoginFormData) {
    await this.page.fill(this.selectors.emailInput, data.email);
    await this.page.fill(this.selectors.passwordInput, data.password);
  }

  /**
   * メールアドレスフィールドに入力
   */
  async fillEmail(email: string) {
    await this.page.fill(this.selectors.emailInput, email);
  }

  /**
   * パスワードフィールドに入力
   */
  async fillPassword(password: string) {
    await this.page.fill(this.selectors.passwordInput, password);
  }

  /**
   * フォームを送信
   */
  async submit() {
    await this.page.click(this.selectors.submitButton);
  }

  /**
   * エラーメッセージが表示されることを検証
   */
  async expectError(message: string) {
    const element = this.page.locator(`text=${message}`);
    await expect(element).toBeVisible({ timeout: 10000 });
  }

  /**
   * 指定したURLにリダイレクトされることを検証
   */
  async expectRedirectTo(url: string) {
    await expect(this.page).toHaveURL(url, { timeout: 5000 });
  }

  /**
   * リダイレクトされないことを検証
   */
  async expectNotRedirected(currentUrl: string) {
    await expect(this.page).toHaveURL(currentUrl);
  }

  /**
   * 店舗管理者ログインリンクが表示されることを検証
   */
  async expectAdminLoginLinkVisible() {
    const adminLink = this.page.locator('a:has-text("店舗管理者ログインはこちら")');
    await expect(adminLink).toBeVisible();
  }

  /**
   * 店舗管理者ログインリンクのhrefを検証
   */
  async expectAdminLoginLinkHref(href: string) {
    const adminLink = this.page.locator('a:has-text("店舗管理者ログインはこちら")');
    await expect(adminLink).toHaveAttribute('href', href);
  }

  /**
   * 一般ユーザーログインリンクが表示されることを検証
   */
  async expectUserLoginLinkVisible() {
    const userLink = this.page.locator('a:has-text("一般ユーザーログインはこちら")');
    await expect(userLink).toBeVisible();
  }

  /**
   * 一般ユーザーログインリンクのhrefを検証
   */
  async expectUserLoginLinkHref(href: string) {
    const userLink = this.page.locator('a:has-text("一般ユーザーログインはこちら")');
    await expect(userLink).toHaveAttribute('href', href);
  }

  /**
   * 注意書きメッセージが表示されることを検証
   */
  async expectWarningMessage(message: string) {
    const warning = this.page.locator(`text=${message}`);
    await expect(warning).toBeVisible();
  }

  /**
   * メールアドレス入力欄が表示されることを検証
   */
  async expectEmailInputVisible() {
    await expect(this.page.locator(this.selectors.emailInput)).toBeVisible();
  }

  /**
   * パスワード入力欄が表示されることを検証
   */
  async expectPasswordInputVisible() {
    await expect(this.page.locator(this.selectors.passwordInput)).toBeVisible();
  }

  /**
   * ログインボタンが表示されることを検証
   */
  async expectSubmitButtonVisible() {
    await expect(this.page.locator(this.selectors.submitButton)).toBeVisible();
  }

  /**
   * パスワードフィールドがpasswordタイプであることを検証
   */
  async expectPasswordInputTypeIsPassword() {
    await expect(this.page.locator(this.selectors.passwordInput)).toHaveAttribute(
      'type',
      'password'
    );
  }

  /**
   * メールアドレス入力欄にラベルが設定されていることを検証
   */
  async expectEmailInputHasLabel(labelText: string) {
    const label = this.page.locator(`label:has-text("${labelText}")`);
    await expect(label).toBeVisible();
  }

  /**
   * パスワード入力欄にラベルが設定されていることを検証
   */
  async expectPasswordInputHasLabel(labelText: string) {
    const label = this.page.locator(`label:has-text("${labelText}")`);
    await expect(label).toBeVisible();
  }

  /**
   * Enterキーでフォームを送信
   */
  async submitWithEnterKey() {
    await this.page.locator(this.selectors.passwordInput).press('Enter');
  }

  /**
   * ボタンがローディング状態であることを検証
   */
  async expectButtonLoading() {
    const button = this.page.locator(this.selectors.submitButton);
    await expect(button).toBeDisabled();
  }

  /**
   * ボタンが無効化されていることを検証
   */
  async expectButtonDisabled() {
    await expect(this.page.locator(this.selectors.submitButton)).toBeDisabled();
  }
}
