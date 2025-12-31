import { Page, expect } from '@playwright/test';

export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * ログインページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class LoginPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理（data-testid使用）
  private selectors = {
    heading: 'h1',
    emailInput: '[data-testid="login-email"]',
    passwordInput: '[data-testid="login-password"]',
    rememberCheckbox: '[data-testid="login-remember"]',
    submitButton: '[data-testid="login-submit"]',
    errorMessage: '[data-testid="error-message"]',
    registerLink: 'a[href="/register"]',
    adminLoginLink: 'a[href="/admin/login"]',
    resetPasswordLink: 'a[href="/reset-password"]',
  };

  /**
   * ログインページに移動
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * 見出しを検証
   */
  async expectHeading(headingText: string) {
    await expect(this.page.locator(this.selectors.heading)).toContainText(headingText);
  }

  /**
   * フォームデータを入力
   */
  async fillForm(data: LoginFormData) {
    await this.page.fill(this.selectors.emailInput, data.email);
    await this.page.fill(this.selectors.passwordInput, data.password);
    if (data.remember) {
      await this.page.check(this.selectors.rememberCheckbox);
    }
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
   * ログイン状態保持チェックボックスをチェック
   */
  async checkRemember() {
    await this.page.check(this.selectors.rememberCheckbox);
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
   * 新規登録リンクが表示されることを検証
   */
  async expectRegisterLinkVisible() {
    await expect(this.page.locator(this.selectors.registerLink)).toBeVisible();
  }

  /**
   * 新規登録リンクのhrefを検証
   */
  async expectRegisterLinkHref(href: string) {
    await expect(this.page.locator(this.selectors.registerLink)).toHaveAttribute('href', href);
  }

  /**
   * 管理者ログインリンクが表示されることを検証
   */
  async expectAdminLoginLinkVisible() {
    const adminLink = this.page.locator('a:has-text("管理者ログインはこちら")');
    await expect(adminLink).toBeVisible();
  }

  /**
   * 管理者ログインリンクのhrefを検証
   */
  async expectAdminLoginLinkHref(href: string) {
    const adminLink = this.page.locator('a:has-text("管理者ログインはこちら")');
    await expect(adminLink).toHaveAttribute('href', href);
  }

  /**
   * パスワードリセットリンクが表示されることを検証
   */
  async expectResetPasswordLinkVisible() {
    const resetLink = this.page.locator('a:has-text("お忘れですか？")');
    await expect(resetLink).toBeVisible();
  }

  /**
   * パスワードリセットリンクのhrefを検証
   */
  async expectResetPasswordLinkHref(href: string) {
    const resetLink = this.page.locator('a:has-text("お忘れですか？")');
    await expect(resetLink).toHaveAttribute('href', href);
  }

  /**
   * ログイン状態保持チェックボックスが表示されることを検証
   */
  async expectRememberCheckboxVisible() {
    await expect(this.page.locator(this.selectors.rememberCheckbox)).toBeVisible();
  }

  /**
   * ログイン状態保持チェックボックスがチェックされていないことを検証
   */
  async expectRememberCheckboxNotChecked() {
    await expect(this.page.locator(this.selectors.rememberCheckbox)).not.toBeChecked();
  }

  /**
   * ログイン状態保持チェックボックスがチェックされていることを検証
   */
  async expectRememberCheckboxChecked() {
    await expect(this.page.locator(this.selectors.rememberCheckbox)).toBeChecked();
  }
}
