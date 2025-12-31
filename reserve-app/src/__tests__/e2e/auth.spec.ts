import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  const testUser = {
    name: '山田太郎',
    email: `test-${Date.now()}@example.com`, // Unique email for each test run
    phone: '090-1234-5678',
    password: 'password123',
  };

  test.describe('User Registration (#5)', () => {
    test('should successfully register a new user', async ({ page }) => {
      // Given: 新規登録ページにアクセスしている
      await page.goto('/register');
      await expect(page).toHaveTitle(/予約システム/);
      await expect(page.locator('h1')).toContainText('新規登録');

      // When: 必要な情報を入力する
      await page.fill('input[name="name"]', testUser.name);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="phone"]', testUser.phone);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="passwordConfirm"]', testUser.password);
      await page.check('input[name="termsAccepted"]');

      // And: "アカウントを作成"ボタンをクリックする
      await page.click('button:has-text("アカウントを作成")');

      // Then: 成功メッセージが表示される
      await expect(page.locator('text=Registration successful')).toBeVisible({
        timeout: 10000,
      });

      // And: ログインページにリダイレクトされる
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/register');

      // Try to submit with empty fields
      await page.click('button:has-text("アカウントを作成")');

      // Should show validation errors
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Invalid email address')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="passwordConfirm"]', 'different password');
      await page.check('input[name="termsAccepted"]');

      await page.click('button:has-text("アカウントを作成")');

      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'weak');
      await page.fill('input[name="passwordConfirm"]', 'weak');
      await page.check('input[name="termsAccepted"]');

      await page.click('button:has-text("アカウントを作成")');

      await expect(
        page.locator('text=Password must be at least 8 characters')
      ).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.fill('input[name="passwordConfirm"]', 'password123');
      // Do not check termsAccepted

      await page.click('button:has-text("アカウントを作成")');

      await expect(
        page.locator('text=You must accept the terms and conditions')
      ).toBeVisible();
    });
  });

  test.describe('User Login (#6)', () => {
    // This test assumes a user already exists
    // In a real scenario, you'd want to create a test user in a setup step

    test('should show validation errors for empty fields', async ({ page }) => {
      // Given: ログインページにアクセスしている
      await page.goto('/login');
      await expect(page.locator('h1')).toContainText('ログイン');

      // When: 空のままログインボタンをクリックする
      await page.click('button:has-text("ログイン")');

      // Then: バリデーションエラーが表示される
      await expect(page.locator('text=Invalid email address')).toBeVisible();
      await expect(page.locator('text=Password is required')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      await page.click('button:has-text("ログイン")');

      // Should show error message
      await expect(page.locator('text=Invalid email or password')).toBeVisible({
        timeout: 10000,
      });
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.locator('a:has-text("新規登録")');
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute('href', '/register');
    });

    test('should have link to admin login', async ({ page }) => {
      await page.goto('/login');

      const adminLink = page.locator('a:has-text("管理者ログインはこちら")');
      await expect(adminLink).toBeVisible();
      await expect(adminLink).toHaveAttribute('href', '/admin/login');
    });

    test('should have password reset link', async ({ page }) => {
      await page.goto('/login');

      const resetLink = page.locator('a:has-text("お忘れですか？")');
      await expect(resetLink).toBeVisible();
      await expect(resetLink).toHaveAttribute('href', '/reset-password');
    });

    test('should have remember me checkbox', async ({ page }) => {
      await page.goto('/login');

      const rememberCheckbox = page.locator('input[name="remember"]');
      await expect(rememberCheckbox).toBeVisible();

      // Should be unchecked by default
      await expect(rememberCheckbox).not.toBeChecked();

      // Should be able to check it
      await rememberCheckbox.check();
      await expect(rememberCheckbox).toBeChecked();
    });
  });

  test.describe('Full Registration and Login Flow', () => {
    test('should register and then login successfully', async ({ page }) => {
      const uniqueUser = {
        name: '田中花子',
        email: `tanaka-${Date.now()}@example.com`,
        password: 'securePassword123',
      };

      // Step 1: Register
      await page.goto('/register');
      await page.fill('input[name="name"]', uniqueUser.name);
      await page.fill('input[name="email"]', uniqueUser.email);
      await page.fill('input[name="password"]', uniqueUser.password);
      await page.fill('input[name="passwordConfirm"]', uniqueUser.password);
      await page.check('input[name="termsAccepted"]');
      await page.click('button:has-text("アカウントを作成")');

      // Wait for redirect to login page
      await expect(page).toHaveURL('/login', { timeout: 5000 });

      // Step 2: Login with the newly created account
      await page.fill('input[name="email"]', uniqueUser.email);
      await page.fill('input[name="password"]', uniqueUser.password);
      await page.click('button:has-text("ログイン")');

      // Should redirect to home page after successful login
      await expect(page).toHaveURL('/', { timeout: 5000 });
    });
  });
});
