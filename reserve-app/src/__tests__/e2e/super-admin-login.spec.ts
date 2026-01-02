import { test, expect } from '@playwright/test';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';

/**
 * Feature: スーパー管理者ログイン
 * Issue: Phase 2
 *
 * ユーザーストーリー:
 * As a super administrator
 * I want to log in to the super admin panel
 * So that I can manage feature flags and tenant settings
 *
 * Gherkinシナリオ: features/super-admin/login.feature
 */

test.describe('スーパー管理者ログイン (Phase 2)', () => {
  let loginPage: SuperAdminLoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new SuperAdminLoginPage(page);
    await loginPage.goto();
  });

  /**
   * Scenario: スーパー管理者ログインページが正しく表示される
   *   Given スーパー管理者ログインページ"/super-admin/login"にアクセスしている
   *   Then ページタイトルに「スーパー管理者ログイン」が表示される
   *   And ページ見出しに「スーパー管理者ログイン」が表示される
   *   And メールアドレス入力欄が表示される
   *   And パスワード入力欄が表示される
   *   And 「ログイン」ボタンが表示される
   *   And 注意書き「このページは開発者専用です」が表示される
   */
  test('スーパー管理者ログインページが正しく表示される', async ({ page }) => {
    // Then: ページタイトルを確認
    await expect(page).toHaveTitle(/スーパー管理者ログイン/);

    // And: ページ見出しを確認
    await loginPage.expectHeading('スーパー管理者ログイン');

    // And: メールアドレス入力欄が表示される
    await loginPage.expectEmailInputVisible();

    // And: パスワード入力欄が表示される
    await loginPage.expectPasswordInputVisible();

    // And: ログインボタンが表示される
    await loginPage.expectSubmitButtonVisible();

    // And: 注意書きが表示される
    await loginPage.expectWarningMessage('このページは開発者専用です');
  });

  /**
   * Scenario: スーパー管理者が正しい認証情報でログインできる（ハッピーパス）
   *   Given スーパー管理者「contact@tailwind8.com」がパスワード「SuperAdmin2026!」で登録されている
   *   When メールアドレスに「contact@tailwind8.com」と入力する
   *   And パスワードに「SuperAdmin2026!」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then ログインが成功する
   *   And スーパー管理者ダッシュボード「/super-admin/dashboard」にリダイレクトされる
   */
  test('スーパー管理者が正しい認証情報でログインできる', async () => {
    // Given: スーパー管理者が登録されている（Seedデータで作成済み）

    // When: メールアドレスとパスワードを入力
    await loginPage.fillEmail('contact@tailwind8.com');
    await loginPage.fillPassword('SuperAdmin2026!');

    // And: ログインボタンをクリック
    await loginPage.submit();

    // Then & And: ダッシュボードにリダイレクト
    await loginPage.expectRedirectTo('/super-admin/dashboard');
  });

  /**
   * Scenario: 店舗管理者（ADMIN）がスーパー管理者ログインを試みると拒否される
   *   Given 店舗管理者「admin@store.com」がロール「ADMIN」で登録されている
   *   When メールアドレスに「admin@store.com」と入力する
   *   And パスワードに「adminpass」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「スーパー管理者権限が必要です」が表示される
   */
  test.skip('店舗管理者がスーパー管理者ログインを試みると拒否される', async () => {
    // TODO: 店舗管理者アカウントの作成後に有効化
    // Given: 店舗管理者が登録されている

    // When: 店舗管理者の認証情報でログイン試行
    await loginPage.fillEmail('admin@store.com');
    await loginPage.fillPassword('adminpass');
    await loginPage.submit();

    // Then: エラーメッセージが表示される
    await loginPage.expectError('スーパー管理者権限が必要です');
  });

  /**
   * Scenario: 一般ユーザー（CUSTOMER）がスーパー管理者ログインを試みると拒否される
   *   Given 一般ユーザー「customer@example.com」がロール「CUSTOMER」で登録されている
   *   When メールアドレスに「customer@example.com」と入力する
   *   And パスワードに「password123」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「スーパー管理者権限が必要です」が表示される
   */
  test.skip('一般ユーザーがスーパー管理者ログインを試みると拒否される', async () => {
    // TODO: 一般ユーザーアカウントの作成後に有効化
    // Given: 一般ユーザーが登録されている（Seedデータで作成済み）

    // When: 一般ユーザーの認証情報でログイン試行
    await loginPage.fillEmail('customer@example.com');
    await loginPage.fillPassword('password123');
    await loginPage.submit();

    // Then: エラーメッセージが表示される
    await loginPage.expectError('スーパー管理者権限が必要です');
  });

  /**
   * Scenario: 存在しないメールアドレスでログインを試みるとエラーが表示される
   *   When メールアドレスに「nonexistent@example.com」と入力する
   *   And パスワードに「password123」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される
   */
  test('存在しないメールアドレスでログインを試みるとエラーが表示される', async () => {
    // When: 存在しないメールアドレスでログイン試行
    await loginPage.fillEmail('nonexistent@example.com');
    await loginPage.fillPassword('password123');
    await loginPage.submit();

    // Then: エラーメッセージが表示される
    await loginPage.expectError('メールアドレスまたはパスワードが正しくありません');
  });

  /**
   * Scenario: 間違ったパスワードでログインを試みるとエラーが表示される
   *   Given スーパー管理者「contact@tailwind8.com」がパスワード「SuperAdmin2026!」で登録されている
   *   When メールアドレスに「contact@tailwind8.com」と入力する
   *   And パスワードに「wrongpassword」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「メールアドレスまたはパスワードが正しくありません」が表示される
   */
  test('間違ったパスワードでログインを試みるとエラーが表示される', async () => {
    // Given: スーパー管理者が登録されている（Seedデータで作成済み）

    // When: 間違ったパスワードでログイン試行
    await loginPage.fillEmail('contact@tailwind8.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.submit();

    // Then: エラーメッセージが表示される
    await loginPage.expectError('メールアドレスまたはパスワードが正しくありません');
  });

  /**
   * Scenario: 必須項目が空欄の場合エラーが表示される
   *   When 何も入力せずに「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「有効なメールアドレスを入力してください」が表示される
   *   And エラーメッセージ「パスワードを入力してください」が表示される
   */
  test('必須項目が空欄の場合エラーが表示される', async () => {
    // When: 何も入力せずにログインボタンをクリック
    await loginPage.submit();

    // Then: バリデーションエラーが表示される
    await loginPage.expectError('有効なメールアドレスを入力してください');
    await loginPage.expectError('パスワードを入力してください');
  });

  /**
   * Scenario: 無効なメールアドレス形式の場合エラーが表示される
   *   When メールアドレスに「invalid-email」と入力する
   *   And パスワードに「password」と入力する
   *   And 「ログイン」ボタンをクリックする
   *   Then エラーメッセージ「有効なメールアドレスを入力してください」が表示される
   */
  test('無効なメールアドレス形式の場合エラーが表示される', async () => {
    // When: 無効なメールアドレス形式で入力
    await loginPage.fillEmail('invalid-email');
    await loginPage.fillPassword('password');
    await loginPage.submit();

    // Then: バリデーションエラーが表示される
    await loginPage.expectError('有効なメールアドレスを入力してください');
  });

  /**
   * Scenario: 未認証でスーパー管理者ダッシュボードにアクセスするとログイン画面にリダイレクトされる
   *   When ブラウザで直接「/super-admin/dashboard」にアクセスする
   *   Then スーパー管理者ログインページ「/super-admin/login」にリダイレクトされる
   */
  test.skip('未認証でスーパー管理者ダッシュボードにアクセスするとログイン画面にリダイレクトされる', async ({
    page,
  }) => {
    // TODO: middleware実装後に有効化
    // When: 未認証で直接ダッシュボードにアクセス
    await page.goto('/super-admin/dashboard');

    // Then: ログイン画面にリダイレクト
    await expect(page).toHaveURL('/super-admin/login');
  });

  /**
   * Scenario: パスワードフィールドがマスクされている
   *   Then パスワード入力欄が「password」タイプである
   */
  test('パスワードフィールドがマスクされている', async () => {
    // Then: パスワードフィールドがpasswordタイプ
    await loginPage.expectPasswordInputTypeIsPassword();
  });

  /**
   * Scenario: すべての入力欄にラベルが設定されている
   *   Then メールアドレス入力欄にラベル「メールアドレス」が設定されている
   *   And パスワード入力欄にラベル「パスワード」が設定されている
   */
  test('すべての入力欄にラベルが設定されている', async () => {
    // Then: メールアドレス入力欄にラベルがある
    await loginPage.expectEmailInputHasLabel('メールアドレス');

    // And: パスワード入力欄にラベルがある
    await loginPage.expectPasswordInputHasLabel('パスワード');
  });

  /**
   * Scenario: キーボード操作でフォームを送信できる
   *   Given メールアドレスとパスワードを入力している
   *   When パスワード入力欄でEnterキーを押す
   *   Then フォームが送信される
   */
  test.skip('キーボード操作でフォームを送信できる', async () => {
    // TODO: フォーム送信実装後に有効化
    // Given: メールアドレスとパスワードを入力
    await loginPage.fillEmail('contact@tailwind8.com');
    await loginPage.fillPassword('SuperAdmin2026!');

    // When: Enterキーでフォーム送信
    await loginPage.submitWithEnterKey();

    // Then: ダッシュボードにリダイレクト
    await loginPage.expectRedirectTo('/super-admin/dashboard');
  });

  /**
   * Scenario: 店舗管理者ログインページへのリンクが表示される
   *   Then 「店舗管理者ログインはこちら」リンクが表示される
   *   And 「店舗管理者ログインはこちら」リンクのhrefが「/admin/login」である
   */
  test('店舗管理者ログインページへのリンクが表示される', async () => {
    // Then: リンクが表示される
    await loginPage.expectAdminLoginLinkVisible();

    // And: リンクのhrefが正しい
    await loginPage.expectAdminLoginLinkHref('/admin/login');
  });

  /**
   * Scenario: 一般ユーザーログインページへのリンクが表示される
   *   Then 「一般ユーザーログインはこちら」リンクが表示される
   *   And 「一般ユーザーログインはこちら」リンクのhrefが「/login」である
   */
  test('一般ユーザーログインページへのリンクが表示される', async () => {
    // Then: リンクが表示される
    await loginPage.expectUserLoginLinkVisible();

    // And: リンクのhrefが正しい
    await loginPage.expectUserLoginLinkHref('/login');
  });

  /**
   * Scenario: モバイルで正しく表示される
   *   Given モバイル画面サイズ（375x667）に設定している
   *   When スーパー管理者ログインページにアクセスする
   *   Then フォームが縦1列で表示される
   */
  test('モバイルで正しく表示される', async ({ page }) => {
    // Given: モバイル画面サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // When: ページにアクセス
    await loginPage.goto();

    // Then: すべての要素が表示される（レイアウト崩れがない）
    await loginPage.expectEmailInputVisible();
    await loginPage.expectPasswordInputVisible();
    await loginPage.expectSubmitButtonVisible();
  });
});
