import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';

test.describe('User Authentication', () => {
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
      await registerPage.expectError('Name is required');
      await registerPage.expectError('Invalid email address');
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
      await registerPage.expectError('Passwords do not match');
    });

    test('should show error for weak password', async ({ page }) => {
      const registerPage = new RegisterPage(page);

      // Given: 新規登録ページにアクセスしている
      await registerPage.goto();

      // When: 弱いパスワードでフォームを送信する
      await registerPage.fillName('Test User');
      await registerPage.fillEmail('test@example.com');
      await registerPage.fillPassword('weak');
      await registerPage.fillPasswordConfirm('weak');
      await registerPage.acceptTerms();
      await registerPage.submit();

      // Then: エラーメッセージが表示される
      await registerPage.expectError('Password must be at least 8 characters');
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
      await registerPage.expectError('You must accept the terms and conditions');
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
      await loginPage.expectError('Invalid email address');
      await loginPage.expectError('Password is required');
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
      await loginPage.expectError('Invalid email or password');
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
});
