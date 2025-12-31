import { Page, expect } from '@playwright/test';

export interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirm: string;
}

/**
 * ユーザー登録ページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class RegisterPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理（data-testid使用）
  private selectors = {
    heading: 'h1',
    title: 'title',
    nameInput: '[data-testid="register-name"]',
    emailInput: '[data-testid="register-email"]',
    phoneInput: '[data-testid="register-phone"]',
    passwordInput: '[data-testid="register-password"]',
    passwordConfirmInput: '[data-testid="register-password-confirm"]',
    termsCheckbox: '[data-testid="register-terms"]',
    submitButton: '[data-testid="register-submit"]',
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]',
    loginLink: 'a[href="/login"]',
  };

  /**
   * 新規登録ページに移動
   */
  async goto() {
    await this.page.goto('/register');
  }

  /**
   * ページタイトルを検証
   */
  async expectTitle(titleText: string) {
    await expect(this.page).toHaveTitle(new RegExp(titleText));
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
  async fillForm(data: RegisterFormData) {
    await this.page.fill(this.selectors.nameInput, data.name);
    await this.page.fill(this.selectors.emailInput, data.email);
    if (data.phone) {
      await this.page.fill(this.selectors.phoneInput, data.phone);
    }
    await this.page.fill(this.selectors.passwordInput, data.password);
    await this.page.fill(this.selectors.passwordConfirmInput, data.passwordConfirm);
  }

  /**
   * 名前フィールドに入力
   */
  async fillName(name: string) {
    await this.page.fill(this.selectors.nameInput, name);
  }

  /**
   * メールアドレスフィールドに入力
   */
  async fillEmail(email: string) {
    await this.page.fill(this.selectors.emailInput, email);
  }

  /**
   * 電話番号フィールドに入力
   */
  async fillPhone(phone: string) {
    await this.page.fill(this.selectors.phoneInput, phone);
  }

  /**
   * パスワードフィールドに入力
   */
  async fillPassword(password: string) {
    await this.page.fill(this.selectors.passwordInput, password);
  }

  /**
   * パスワード確認フィールドに入力
   */
  async fillPasswordConfirm(passwordConfirm: string) {
    await this.page.fill(this.selectors.passwordConfirmInput, passwordConfirm);
  }

  /**
   * 利用規約に同意
   */
  async acceptTerms() {
    await this.page.check(this.selectors.termsCheckbox);
  }

  /**
   * フォームを送信
   */
  async submit() {
    await this.page.click(this.selectors.submitButton);
  }

  /**
   * 成功メッセージが表示されることを検証
   */
  async expectSuccess(message: string) {
    const element = this.page.locator(this.selectors.successMessage);
    await expect(element).toContainText(message, { timeout: 10000 });
  }

  /**
   * エラーメッセージが表示されることを検証
   */
  async expectError(message: string) {
    const element = this.page.locator(this.selectors.errorMessage);
    await expect(element).toContainText(message);
  }

  /**
   * 指定したURLにリダイレクトされることを検証
   */
  async expectRedirectTo(url: string) {
    await expect(this.page).toHaveURL(url, { timeout: 5000 });
  }

  /**
   * ログインリンクが表示されることを検証
   */
  async expectLoginLinkVisible() {
    await expect(this.page.locator(this.selectors.loginLink)).toBeVisible();
  }
}
