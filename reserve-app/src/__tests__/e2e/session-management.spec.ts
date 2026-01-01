import { test, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { MyPage } from './pages/MyPage';

/**
 * E2Eテスト: セッション管理
 *
 * このテストは、セッション管理とアクセス制御の機能を検証します。
 * - ログアウト後の不正アクセス防止
 * - セッションタイムアウト
 * - 他ユーザーのデータへの横断アクセス防止
 * - CSRFトークン検証
 * - セッション固定攻撃の防止
 *
 * 対応Gherkin: reserve-app/features/security/session-management.feature
 */

test.describe('セッション管理', () => {
  test('ログアウト後の管理画面アクセス防止', async ({ page }) => {
    // 管理者でログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');
    await expect(page).toHaveURL('/admin/dashboard');

    // ダッシュボードが表示される
    const dashboardPage = new AdminDashboardPage(page);
    await dashboardPage.expectPageTitle('ダッシュボード');

    // ログアウト
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL('/admin/login');

    // 直接URLで管理画面にアクセスを試みる
    await page.goto('/admin/dashboard');

    // ログインページにリダイレクトされる
    await expect(page).toHaveURL('/admin/login');
    await expect(page.locator('text=ログインが必要です')).toBeVisible();
  });

  test('ログアウト後のAPIアクセス防止', async ({ page, request }) => {
    // ユーザーでログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 認証トークンを取得（Cookieから）
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

    // ログアウト
    await page.locator('[data-testid="logout-button"]').click();
    await expect(page).toHaveURL('/login');

    // 保持していたトークンでAPIにリクエスト
    const response = await request.get('http://localhost:3000/api/reservations', {
      headers: {
        Cookie: sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '',
      },
    });

    // 401エラーが返される
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('認証が必要です');
  });

  test('セッションタイムアウト後の自動ログアウト', async ({ page }) => {
    // ユーザーでログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // マイページにアクセス
    const myPage = new MyPage(page);
    await expect(page.locator('[data-testid="page-title"]')).toContainText('マイページ');

    // セッションの有効期限を操作（実際には30分待つ代わりにCookieを操作）
    // 注: 実際のアプリケーションではセッションタイムアウトのロジックが必要
    // ここではCookieの有効期限を過去に設定してタイムアウトをシミュレート
    await page.context().clearCookies();

    // 予約ページに移動しようとする
    await page.goto('/booking');

    // ログインページにリダイレクトされる
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=セッションがタイムアウトしました')).toBeVisible();
  });

  test('他のユーザーの予約への横断アクセス防止（表示）', async ({ page, request }) => {
    // ユーザー「田中太郎」でログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 他のユーザー「鈴木次郎」の予約IDを使ってAPIにアクセス
    const response = await page.request.get('/api/reservations/reservation-suzuki-123');

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('この予約にアクセスする権限がありません');
  });

  test('他のユーザーの予約への横断アクセス防止（更新）', async ({ page }) => {
    // ユーザー「田中太郎」でログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 他のユーザーの予約を更新しようとする
    const response = await page.request.patch('/api/reservations/reservation-suzuki-123', {
      data: {
        date: '2025-02-01',
        time: '10:00',
      },
    });

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('この予約を編集する権限がありません');
  });

  test('他のユーザーの予約への横断アクセス防止（削除）', async ({ page }) => {
    // ユーザー「田中太郎」でログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 他のユーザーの予約を削除しようとする
    const response = await page.request.delete('/api/reservations/reservation-suzuki-123');

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('この予約を削除する権限がありません');
  });

  test('管理者は全ての予約にアクセスできる', async ({ page }) => {
    // 管理者でログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');
    await expect(page).toHaveURL('/admin/dashboard');

    // 任意のユーザーの予約にアクセス
    const response = await page.request.get('/api/reservations/reservation-tanaka-123');

    // 200 OKが返される
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.reservation).toBeDefined();
  });

  test('一般ユーザーでの管理者APIアクセス防止', async ({ page }) => {
    // 一般ユーザーでログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 管理者APIにアクセス
    const response = await page.request.get('/api/admin/dashboard');

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('管理者権限が必要です');
  });

  test('未ログイン状態での保護されたページアクセス防止', async ({ page }) => {
    // ログインせずにマイページにアクセス
    await page.goto('/mypage');

    // ログインページにリダイレクトされる
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=ログインが必要です')).toBeVisible();
  });

  test('セッション固定攻撃の防止', async ({ page }) => {
    // ログイン前のセッションIDを取得
    await page.goto('/login');
    const cookiesBefore = await page.context().cookies();
    const sessionBefore = cookiesBefore.find(c => c.name.includes('session'));
    const oldSessionId = sessionBefore?.value;

    // ログイン
    const loginPage = new LoginPage(page);
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // ログイン後のセッションIDを取得
    const cookiesAfter = await page.context().cookies();
    const sessionAfter = cookiesAfter.find(c => c.name.includes('session'));
    const newSessionId = sessionAfter?.value;

    // セッションIDが変更されていることを確認
    expect(newSessionId).toBeDefined();
    expect(newSessionId).not.toBe(oldSessionId);

    // 古いセッションIDでアクセスを試みる（無効になっているはず）
    if (oldSessionId && sessionBefore) {
      await page.context().clearCookies();
      await page.context().addCookies([{
        name: sessionBefore.name,
        value: oldSessionId,
        domain: sessionBefore.domain,
        path: sessionBefore.path,
      }]);

      await page.goto('/mypage');

      // ログインページにリダイレクトされる
      await expect(page).toHaveURL('/login');
    }
  });

  test('同時ログイン時のセッション管理', async ({ browser }) => {
    // ブラウザAでログイン
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const loginPageA = new LoginPage(pageA);
    await loginPageA.goto();
    await loginPageA.login('tanaka@example.com', 'password123');
    await expect(pageA).toHaveURL('/mypage');

    // ブラウザBで同じユーザーがログイン
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const loginPageB = new LoginPage(pageB);
    await loginPageB.goto();
    await loginPageB.login('tanaka@example.com', 'password123');
    await expect(pageB).toHaveURL('/mypage');

    // ブラウザBのセッションは有効
    await expect(pageB.locator('[data-testid="page-title"]')).toContainText('マイページ');

    // ブラウザAのセッションは無効になる
    await pageA.goto('/mypage');
    await pageA.waitForTimeout(1000);

    // ブラウザAは再ログインが要求される
    const urlA = pageA.url();
    expect(urlA).toContain('/login');

    await pageA.close();
    await pageB.close();
  });

  test('CSRFトークン検証', async ({ page }) => {
    // ユーザーでログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // CSRFトークンなしでPOSTリクエスト
    const response = await page.request.post('/api/reservations', {
      data: {
        menuId: 'menu-1',
        staffId: 'staff-1',
        date: '2025-02-01',
        time: '10:00',
      },
      // CSRFトークンを含めない
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF トークンが無効です');
  });

  test('不正なCSRFトークンでのリクエスト拒否', async ({ page }) => {
    // ユーザーでログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 不正なCSRFトークンでPOSTリクエスト
    const response = await page.request.post('/api/reservations', {
      data: {
        menuId: 'menu-1',
        staffId: 'staff-1',
        date: '2025-02-01',
        time: '10:00',
      },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid-token-12345',
      },
    });

    // 403エラーが返される
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF トークンが無効です');
  });
});
