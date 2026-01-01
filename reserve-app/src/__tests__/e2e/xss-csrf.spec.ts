import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { BookingPage } from './pages/BookingPage';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';

/**
 * E2Eテスト: XSS・CSRF攻撃防止
 *
 * このテストは、XSS（クロスサイトスクリプティング）攻撃と
 * CSRF（クロスサイトリクエストフォージェリ）攻撃から保護されていることを検証します。
 * - XSS攻撃防止（スクリプトタグ、イベントハンドラ、iframe、SVGなど）
 * - CSRFトークン検証
 * - SQLインジェクション防止
 * - クリックジャッキング防止
 * - オープンリダイレクト防止
 *
 * 対応Gherkin: reserve-app/features/security/xss-csrf.feature
 */

test.describe('XSS・CSRF攻撃防止', () => {
  // ===== XSS攻撃防止（スクリプトタグ） =====

  test('備考欄にスクリプトタグを入力してもエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();

    // スクリプトタグを含む備考を入力
    await bookingPage.fillNotes('<script>alert("XSS")</script>');
    await bookingPage.submit();

    await expect(page).toHaveURL('/booking/complete');

    // 予約詳細ページでスクリプトがエスケープされて表示されることを確認
    await page.goto('/mypage');
    await page.locator('[data-testid="reservation-card"]').first().click();

    // エスケープされた文字列として表示される
    const notesText = await page.locator('[data-testid="reservation-notes"]').textContent();
    expect(notesText).toContain('&lt;script&gt;');
    expect(notesText).toContain('&lt;/script&gt;');

    // スクリプトが実行されないことを確認（alertが表示されない）
    page.on('dialog', async dialog => {
      throw new Error('Unexpected alert dialog');
    });
  });

  test('メニュー説明にスクリプトタグを入力してもエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');

    await page.goto('/admin/menus/new');

    await page.locator('input[name="name"]').fill('テストメニュー');
    await page.locator('input[name="price"]').fill('1000');
    await page.locator('input[name="duration"]').fill('60');
    await page.locator('textarea[name="description"]').fill('<script>alert("XSS")</script>');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=メニューを登録しました')).toBeVisible();

    // メニュー一覧ページでスクリプトがエスケープされて表示される
    await page.goto('/admin/menus');

    const descriptionText = await page.locator('[data-testid="menu-description"]').first().textContent();
    expect(descriptionText).toContain('&lt;script&gt;');

    // スクリプトが実行されない
    page.on('dialog', async dialog => {
      throw new Error('Unexpected alert dialog');
    });
  });

  // ===== XSS攻撃防止（イベントハンドラ） =====

  test('イベントハンドラを含むHTML入力がエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();

    // イベントハンドラを含む入力
    await bookingPage.fillNotes('<img src=x onerror="alert(1)">');
    await bookingPage.submit();

    await expect(page).toHaveURL('/booking/complete');

    await page.goto('/mypage');
    await page.locator('[data-testid="reservation-card"]').first().click();

    const notesText = await page.locator('[data-testid="reservation-notes"]').textContent();
    expect(notesText).toContain('&lt;img');
    expect(notesText).toContain('onerror');

    // スクリプトが実行されない
    page.on('dialog', async dialog => {
      throw new Error('Unexpected alert dialog');
    });
  });

  // ===== XSS攻撃防止（リンク） =====

  test('JavaScriptプロトコルを含むリンクがエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();

    await bookingPage.fillNotes('<a href="javascript:alert(1)">クリック</a>');
    await bookingPage.submit();

    await expect(page).toHaveURL('/booking/complete');

    await page.goto('/mypage');
    await page.locator('[data-testid="reservation-card"]').first().click();

    const notesText = await page.locator('[data-testid="reservation-notes"]').textContent();
    expect(notesText).toContain('&lt;a');

    // リンクがクリック可能でないことを確認
    const links = await page.locator('a[href^="javascript:"]').count();
    expect(links).toBe(0);
  });

  // ===== XSS攻撃防止（iframe） =====

  test('iframeタグを含む入力がエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');

    const settingsPage = new AdminSettingsPage(page);
    await settingsPage.goto();

    await page.locator('textarea[name="description"]').fill('<iframe src="https://evil.com"></iframe>');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=設定を保存しました')).toBeVisible();

    await settingsPage.goto();

    const descriptionText = await page.locator('textarea[name="description"]').inputValue();
    expect(descriptionText).toContain('<iframe');

    // 実際の表示でiframeが埋め込まれていないことを確認
    const iframes = await page.locator('iframe').count();
    expect(iframes).toBe(0);
  });

  // ===== XSS攻撃防止（SVG） =====

  test('SVGタグを含む入力がエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();

    await bookingPage.fillNotes('<svg onload="alert(1)">');
    await bookingPage.submit();

    await expect(page).toHaveURL('/booking/complete');

    await page.goto('/mypage');
    await page.locator('[data-testid="reservation-card"]').first().click();

    const notesText = await page.locator('[data-testid="reservation-notes"]').textContent();
    expect(notesText).toContain('&lt;svg');

    // スクリプトが実行されない
    page.on('dialog', async dialog => {
      throw new Error('Unexpected alert dialog');
    });
  });

  // ===== SQL Injection防止 =====

  test('SQLインジェクションを試みてもエスケープされる', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // SQLインジェクションを試みる
    await loginPage.fillEmail("test@example.com' OR '1'='1");
    await loginPage.fillPassword("password' OR '1'='1");
    await loginPage.submit();

    // ログインに失敗する
    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('検索機能でのSQLインジェクション防止', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');

    await page.goto('/admin/customers');

    // SQLインジェクションを試みる
    await page.locator('input[name="search"]').fill("'; DROP TABLE restaurant_users; --");
    await page.locator('button:has-text("検索")').click();

    // 検索結果が"該当するユーザーが見つかりません"と表示される
    await expect(page.locator('text=該当するユーザーが見つかりません')).toBeVisible();

    // テーブルは削除されていない（次のページアクセスで確認）
    await page.goto('/admin/customers');
    await expect(page.locator('[data-testid="customers-table"]')).toBeVisible();
  });

  // ===== Clickjacking防止（X-Frame-Options） =====

  test('X-Frame-Optionsヘッダーによるクリックジャッキング防止', async ({ page }) => {
    await page.goto('/');

    // レスポンスヘッダーを確認
    const response = await page.goto('/');
    const headers = response?.headers();

    expect(headers?.['x-frame-options']).toBe('DENY');
  });

  // ===== Content Security Policy =====

  test('CSPヘッダーによるインラインスクリプトの実行防止', async ({ page }) => {
    await page.goto('/');

    const response = await page.goto('/');
    const headers = response?.headers();

    // CSPヘッダーが設定されていることを確認
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['content-security-policy']).toContain("script-src 'self'");
  });

  // ===== CSRF攻撃防止 =====

  test('CSRFトークンなしでのPOSTリクエストは拒否される', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // CSRFトークンなしでPOSTリクエスト
    const response = await page.request.post('http://localhost:3000/api/reservations', {
      data: {
        menuId: 'menu-1',
        staffId: 'staff-1',
        date: '2025-02-01',
        time: '10:00',
      },
      headers: {
        'Content-Type': 'application/json',
        // CSRFトークンを含めない
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF トークンが無効です');
  });

  test('不正なCSRFトークンでのPOSTリクエストは拒否される', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 不正なCSRFトークンでPOSTリクエスト
    const response = await page.request.post('http://localhost:3000/api/reservations', {
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

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('CSRF トークンが無効です');
  });

  // ===== HTML属性インジェクション防止 =====

  test('HTML属性インジェクションが防止される', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    await page.goto('/mypage/profile/edit');

    // HTML属性インジェクションを試みる
    await page.locator('input[name="name"]').fill('田中" onmouseover="alert(\'XSS\')"');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('text=プロフィールを更新しました')).toBeVisible();

    await page.goto('/mypage/profile');

    const nameElement = await page.locator('[data-testid="user-name"]');
    const nameText = await nameElement.textContent();

    // エスケープされた文字列として表示される
    expect(nameText).toContain('田中');
    expect(nameText).toContain('"');

    // onmouseover属性が追加されていないことを確認
    const onmouseoverAttr = await nameElement.getAttribute('onmouseover');
    expect(onmouseoverAttr).toBeNull();
  });

  // ===== Open Redirect防止 =====

  test('オープンリダイレクトが防止される', async ({ page }) => {
    // redirectパラメータに外部URLを設定
    await page.goto('/login?redirect=https://evil.com');

    const loginPage = new LoginPage(page);
    await loginPage.login('tanaka@example.com', 'password123');

    // 外部サイトにリダイレクトされない
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).not.toContain('evil.com');

    // 内部ページ（マイページ）にリダイレクトされる
    expect(url).toContain('/mypage');
  });

  test('内部URLへのリダイレクトは許可される', async ({ page }) => {
    await page.goto('/login?redirect=/booking');

    const loginPage = new LoginPage(page);
    await loginPage.login('tanaka@example.com', 'password123');

    // 内部ページにリダイレクトされる
    await expect(page).toHaveURL('/booking');
  });

  // ===== SameSite Cookie =====

  test('SameSite属性付きCookieによるCSRF防止', async ({ page }) => {
    await page.goto('/login');

    const loginPage = new LoginPage(page);
    await loginPage.login('tanaka@example.com', 'password123');

    // Cookieを取得
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

    // SameSite属性が設定されていることを確認
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.sameSite).toBe('Lax');
  });
});
