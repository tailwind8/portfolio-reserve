import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { setupMSW } from './msw-setup';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });
  const testUser = {
    name: '山田太郎',
    email: `test-${Date.now()}@example.com`, // Unique email for each test run
    phone: '090-1234-5678',
    password: 'password123',
  };

  test.describe('User Registration (#5)', () => {
    test('should successfully register a new user', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();
      await registerPage.expectTitle('予約システム');
      await registerPage.expectHeading('新規登録');

      // When: 必要な情報を入力する
      await registerPage.fillForm({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        password: testUser.password,
        passwordConfirm: testUser.password,
      });
      await registerPage.acceptTerms();

      // And: "アカウントを作成"ボタンをクリックする
      await registerPage.submit();

      // Then: 成功メッセージが表示される
      await registerPage.expectSuccess('Registration successful');

      // And: ログインページにリダイレクトされる
      await registerPage.expectRedirectTo('/login');
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 何も入力せずにフォームを送信する
      await registerPage.submit();

      // Then: バリデーションエラーが表示される
      await registerPage.expectError('名前を入力してください');
      await registerPage.expectError('有効なメールアドレスを入力してください');
    });

    test('should show error for password mismatch', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: パスワードとパスワード確認が一致しない状態でフォームを送信する
      await registerPage.fillName('Test User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('password123');
      await registerPage.fillPasswordConfirm('different password');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: エラーメッセージが表示される
      await registerPage.expectError('パスワードが一致しません');
    });

    test('should show error for weak password', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 弱いパスワードでフォームを送信する（8文字未満）
      await registerPage.fillName('Test User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('weak12'); // 6文字（8文字未満）
      await registerPage.fillPasswordConfirm('weak12');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: エラーメッセージが表示される
      await registerPage.expectError('パスワードは8文字以上で入力してください');
    });

    test('should require terms acceptance', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 利用規約に同意せずにフォームを送信する
      await registerPage.fillName('Test User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('password123');
      await registerPage.fillPasswordConfirm('password123');
      // Do not check termsAccepted
      await registerPage.submit();

      // Then: エラーメッセージが表示される
      await registerPage.expectError('利用規約に同意してください');
    });
  });

  test.describe('User Login (#6)', () => {
    test('should show validation errors for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();
      await loginPage.expectHeading('ログイン');

      // When: 空のままログインボタンをクリックする
      await loginPage.submit();

      // Then: バリデーションエラーが表示される
      await loginPage.expectError('有効なメールアドレスを入力してください');
      await loginPage.expectError('パスワードを入力してください');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // When: 無効な認証情報でログインを試みる
      await loginPage.fillEmail('nonexistent@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.submit();

      // Then: エラーメッセージが表示される
      await loginPage.expectError('メールアドレスまたはパスワードが正しくありません');
    });

    test('should have link to registration page', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // Then: 新規登録リンクが表示される
      await loginPage.expectRegisterLinkVisible();

      // And: 新規登録リンクのhrefが正しい
      await loginPage.expectRegisterLinkHref('/register');
    });

    test('should have link to admin login', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // Then: 管理者ログインリンクが表示される
      await loginPage.expectAdminLoginLinkVisible();

      // And: 管理者ログインリンクのhrefが正しい
      await loginPage.expectAdminLoginLinkHref('/admin/login');
    });

    test('should have password reset link', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // Then: パスワードリセットリンクが表示される
      await loginPage.expectResetPasswordLinkVisible();

      // And: パスワードリセットリンクのhrefが正しい
      await loginPage.expectResetPasswordLinkHref('/reset-password');
    });

    test('should have remember me checkbox', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // Then: ログイン状態保持チェックボックスが表示される
      await loginPage.expectRememberCheckboxVisible();

      // And: デフォルトで未チェックである
      await loginPage.expectRememberCheckboxNotChecked();

      // When: チェックボックスをチェックする
      await loginPage.checkRemember();

      // Then: チェック済みになる
      await loginPage.expectRememberCheckboxChecked();
    });
  });

  test.describe('Full Registration and Login Flow', () => {
    test('should register and then login successfully', async ({ page }) => {
      const uniqueUser = {
        name: '田中花子',
        email: `tanaka-${Date.now()}@example.com`,
        password: 'securePassword123',
      };

      const registerPage = new RegisterPage(page);
      const loginPage = new LoginPage(page);

      // ステップ1: 新規登録
      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 必要な情報を入力してフォームを送信する
      await registerPage.fillForm({
        name: uniqueUser.name,
        email: uniqueUser.email,
        password: uniqueUser.password,
        passwordConfirm: uniqueUser.password,
      });
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: ログインページにリダイレクトされる
      await registerPage.expectRedirectTo('/login');

      // ステップ2: ログイン
      // Given: ログインページにアクセスしている（既にリダイレクト済み）
      // When: 新規作成したアカウント情報でログインする
      await loginPage.fillEmail(uniqueUser.email);
      await loginPage.fillPassword(uniqueUser.password);
      await loginPage.submit();

      // Then: ホームページにリダイレクトされる
      await expect(page).toHaveURL('/', { timeout: 5000 });
    });
  });

  test.describe('Additional Registration Scenarios', () => {
    /**
     * Scenario: メールアドレス形式バリデーション
     */
    test('should show error for invalid email format', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 無効なメールアドレス形式で送信する
      await registerPage.fillName('Test User');
      await registerPage.fillEmail('invalid-email');
      await registerPage.fillPassword('password123');
      await registerPage.fillPasswordConfirm('password123');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: エラーメッセージが表示される
      await registerPage.expectError('有効なメールアドレスを入力してください');
    });

    /**
     * Scenario: 電話番号なしでも登録できる（オプション項目）
     */
    test('should register successfully without phone number', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const uniqueEmail = `test-no-phone-${Date.now()}@example.com`;

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 電話番号なしでフォームを送信する
      await registerPage.fillForm({
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123',
        passwordConfirm: 'password123',
      });
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: 成功メッセージが表示される
      await registerPage.expectSuccess('Registration successful');
      await registerPage.expectRedirectTo('/login');
    });

    /**
     * Scenario: リアルタイムバリデーション - 入力開始時のエラー消去
     */
    test('should clear field error when user starts typing', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 何も入力せずに送信してエラーが表示されている
      await registerPage.goto();
      await registerPage.submit();
      await registerPage.expectError('名前を入力してください');

      // When: 名前に入力を始める
      await registerPage.fillName('Test');

      // Then: 名前のエラーメッセージが消える
      await page.waitForTimeout(500); // リアルタイムバリデーションの待機
      const nameError = page.locator('text=名前を入力してください');
      await expect(nameError).not.toBeVisible({ timeout: 1000 });
    });

    /**
     * Scenario: ローディング状態の確認
     */
    test('should show loading state when submitting registration', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 全ての必須項目を入力している
      await registerPage.goto();
      await registerPage.fillForm({
        name: 'Test User',
        email: `loading-test-${Date.now()}@example.com`,
        password: 'password123',
        passwordConfirm: 'password123',
      });
      await registerPage.acceptTerms();

      // When: フォームを送信する
      const submitButton = page.getByRole('button', { name: 'アカウントを作成' });
      await submitButton.click();

      // Then: ボタンがローディング状態になる（一時的に無効化される）
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Additional Login Scenarios', () => {
    /**
     * Scenario: メールアドレス形式バリデーション
     */
    test('should show error for invalid email format in login', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // When: 無効なメールアドレス形式で送信する
      await loginPage.fillEmail('invalid-email');
      await loginPage.fillPassword('password123');
      await loginPage.submit();

      // Then: エラーメッセージが表示される
      await loginPage.expectError('有効なメールアドレスを入力してください');
    });

    /**
     * Scenario: リアルタイムバリデーション
     */
    test('should clear field error when user starts typing in login', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: 何も入力せずに送信してエラーが表示されている
      await loginPage.goto();
      await loginPage.submit();
      await loginPage.expectError('有効なメールアドレスを入力してください');

      // When: メールアドレスに入力を始める
      await loginPage.fillEmail('test@example.com');

      // Then: メールアドレスのエラーメッセージが消える
      await page.waitForTimeout(500);
      const emailError = page.locator('text=有効なメールアドレスを入力してください');
      await expect(emailError).not.toBeVisible({ timeout: 1000 });
    });

    /**
     * Scenario: ローディング状態の確認
     */
    test('should show loading state when submitting login', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: メールアドレスとパスワードを入力している
      await loginPage.goto();
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');

      // When: フォームを送信する
      const submitButton = page.getByRole('button', { name: 'ログイン' });
      await submitButton.click();

      // Then: ボタンがローディング状態になる
      await expect(submitButton).toBeDisabled();
    });

    /**
     * Scenario: キーボード操作 - Enterキーで送信
     */
    test('should submit form when pressing Enter in password field', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // When: メールアドレスとパスワードを入力し、パスワードフィールドでEnterキーを押す
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      await page.locator('input[name="password"]').press('Enter');

      // Then: フォームが送信される（エラーメッセージが表示される = 送信された証拠）
      await loginPage.expectError('メールアドレスまたはパスワードが正しくありません');
    });

    /**
     * Scenario: パスワードフィールドがマスクされている
     */
    test('should mask password field', async ({ page }) => {
      const loginPage = new LoginPage(page);

      // Given: ログインページにアクセスしている
      await loginPage.goto();

      // Then: パスワード入力欄がpasswordタイプである
      const passwordField = page.locator('input[name="password"]');
      await expect(passwordField).toHaveAttribute('type', 'password');
    });
  });
});
