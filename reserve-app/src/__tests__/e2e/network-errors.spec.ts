import { test, expect, Page, Route } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { BookingPage } from './pages/BookingPage';
import { MyPage } from './pages/MyPage';

/**
 * E2Eテスト: ネットワークエラーハンドリング
 *
 * このテストは、ネットワークエラー、タイムアウト、サーバーエラーなど
 * さまざまなエラーが発生した場合の適切なハンドリングを検証します。
 * - APIタイムアウトエラー
 * - ネットワーク切断エラー
 * - 500/502/503/504サーバーエラー
 * - 400/401/403/404/409/429エラー
 * - データベース接続エラー
 *
 * 対応Gherkin: reserve-app/features/error-handling/network-errors.feature
 */

test.describe('ネットワークエラーハンドリング', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');
  });

  // ===== APIタイムアウトエラー =====

  test('APIリクエストがタイムアウトした場合のエラー表示', async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.goto();

    // APIリクエストをタイムアウトさせる（30秒以上遅延）
    await page.route('**/api/reservations', async (route: Route) => {
      await page.waitForTimeout(31000); // 30秒以上待つ
      await route.abort('timedout');
    });

    await myPage.goto(); // ページを再読み込みしてAPIリクエストを発生させる

    // タイムアウトエラーメッセージが表示される
    await expect(page.locator('text=リクエストがタイムアウトしました')).toBeVisible({ timeout: 35000 });
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('タイムアウト後の再試行', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/reservations', async (route: Route) => {
      requestCount++;
      if (requestCount === 1) {
        // 1回目はタイムアウト
        await route.abort('timedout');
      } else {
        // 2回目以降は正常なレスポンス
        await route.continue();
      }
    });

    const myPage = new MyPage(page);
    await myPage.goto();

    // タイムアウトエラーが表示される
    await expect(page.locator('text=リクエストがタイムアウトしました')).toBeVisible({ timeout: 35000 });

    // 再試行ボタンをクリック
    await page.locator('[data-testid="retry-button"]').click();

    // 正常にデータが表示される
    await expect(page.locator('[data-testid="reservations-list"]')).toBeVisible();
  });

  // ===== ネットワーク切断エラー =====

  test('ネットワーク切断時のオフライン表示', async ({ page, context }) => {
    const myPage = new MyPage(page);
    await myPage.goto();

    // ネットワーク切断をシミュレート
    await context.setOffline(true);

    // 予約一覧ページに移動しようとする
    await page.goto('/mypage');

    // オフラインエラーメッセージが表示される
    await expect(page.locator('text=インターネット接続が切断されています')).toBeVisible();
    await expect(page.locator('[data-testid="offline-icon"]')).toBeVisible();
  });

  test('オフラインからオンラインへの復帰', async ({ page, context }) => {
    // ネットワーク切断
    await context.setOffline(true);

    const myPage = new MyPage(page);
    await myPage.goto();

    // オフライン表示を確認
    await expect(page.locator('text=インターネット接続が切断されています')).toBeVisible();

    // ネットワーク接続を復帰
    await context.setOffline(false);

    // ページがリロードされ、成功メッセージが表示される
    await page.reload();
    await expect(page.locator('text=接続が復帰しました')).toBeVisible();
  });

  // ===== 500 Internal Server Error =====

  test('500エラー発生時の処理', async ({ page }) => {
    await page.route('**/api/reservations', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();
    await bookingPage.submit();

    // エラーメッセージが表示される
    await expect(page.locator('text=サーバーエラーが発生しました')).toBeVisible();
  });

  // ===== 503 Service Unavailable =====

  test('503エラー（メンテナンス中）の処理', async ({ page }) => {
    await page.route('**/api/**', async (route: Route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service Unavailable' }),
      });
    });

    await page.goto('/login');

    // メンテナンス画面が表示される
    await expect(page.locator('text=現在メンテナンス中です')).toBeVisible();
  });

  // ===== 502 Bad Gateway =====

  test('502エラー発生時の処理', async ({ page }) => {
    await page.route('**/api/reservations', async (route: Route) => {
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Bad Gateway' }),
      });
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();

    // エラーメッセージが表示される
    await expect(page.locator('text=サーバーとの通信に失敗しました')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  // ===== 504 Gateway Timeout =====

  test('504エラー発生時の処理', async ({ page }) => {
    await page.route('**/api/reservations', async (route: Route) => {
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Gateway Timeout' }),
      });
    });

    const myPage = new MyPage(page);
    await myPage.goto();

    // エラーメッセージが表示される
    await expect(page.locator('text=リクエストの処理に時間がかかっています')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  // ===== 400 Bad Request =====

  test('400エラー（不正なリクエスト）の処理', async ({ page }) => {
    await page.route('**/api/reservations', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'リクエストが不正です',
            details: {
              date: '日付は必須です',
              time: '時刻は必須です',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();
    await bookingPage.submit();

    // エラーメッセージが表示される
    await expect(page.locator('text=リクエストが不正です')).toBeVisible();
  });

  // ===== 401 Unauthorized =====

  test('401エラー（認証エラー）の処理', async ({ page, context }) => {
    const myPage = new MyPage(page);
    await myPage.goto();

    // セッションを無効化
    await context.clearCookies();

    await page.route('**/api/reservations', async (route: Route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/mypage');

    // ログインページにリダイレクトされる
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=セッションが期限切れです')).toBeVisible();
  });

  // ===== 403 Forbidden =====

  test('403エラー（権限エラー）の処理', async ({ page }) => {
    await page.route('**/api/admin/**', async (route: Route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    await page.goto('/admin/dashboard');

    // エラーメッセージが表示される
    await expect(page.locator('text=この操作を実行する権限がありません')).toBeVisible();
    await expect(page.locator('a:has-text("ホームページ")')).toBeVisible();
  });

  // ===== 404 Not Found =====

  test('404エラー（リソースが見つからない）の処理', async ({ page }) => {
    await page.route('**/api/reservations/invalid-id', async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not Found' }),
      });
    });

    await page.goto('/mypage/reservations/invalid-id');

    // エラーメッセージが表示される
    await expect(page.locator('text=指定された予約が見つかりませんでした')).toBeVisible();
    await expect(page.locator('a:has-text("予約一覧")')).toBeVisible();
  });

  // ===== 409 Conflict =====

  test('409エラー（競合エラー）の処理', async ({ page }) => {
    await page.route('**/api/reservations', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'この時間は既に予約済みです' }),
        });
      } else {
        await route.continue();
      }
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();
    await bookingPage.submit();

    // エラーメッセージが表示される
    await expect(page.locator('text=この時間は既に予約済みです')).toBeVisible();
  });

  // ===== 429 Too Many Requests =====

  test('429エラー（レート制限超過）の処理', async ({ page }) => {
    await page.route('**/api/auth/login', async (route: Route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'リクエストが多すぎます',
          retryAfter: 60,
        }),
      });
    });

    // ログアウト
    await page.locator('[data-testid="logout-button"]').click();

    // ログインページに移動
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // エラーメッセージが表示される
    await expect(page.locator('text=リクエストが多すぎます')).toBeVisible();
    await expect(page.locator('text=60秒後')).toBeVisible();
  });

  // ===== エラー後の状態復旧 =====

  test('エラー後にフォーム入力が保持される', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/reservations', async (route: Route) => {
      if (route.request().method() === 'POST') {
        requestCount++;
        if (requestCount === 1) {
          // 1回目はネットワークエラー
          await route.abort('failed');
        } else {
          // 2回目以降は正常
          await route.continue();
        }
      } else {
        await route.continue();
      }
    });

    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('15');
    await bookingPage.selectAvailableTimeSlot();
    await bookingPage.fillNotes('テスト備考');
    await bookingPage.submit();

    // エラーメッセージが表示される
    await expect(page.locator('text=予約の登録に失敗しました')).toBeVisible();

    // 入力内容が保持されているか確認
    const notesValue = await page.locator('textarea#notes').inputValue();
    expect(notesValue).toBe('テスト備考');

    // 再試行（フォームの内容はそのまま）
    await bookingPage.submit();

    // 成功する
    await expect(page).toHaveURL('/booking/complete');
  });

  // ===== 部分的なデータ取得エラー =====

  test('一部のAPIが失敗してもページは表示される', async ({ page }) => {
    // ログアウトして管理者でログイン
    await page.locator('[data-testid="logout-button"]').click();

    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login('admin@example.com', 'admin123');
    await expect(page).toHaveURL('/admin/dashboard');

    // 統計データAPIのみ失敗させる
    await page.route('**/api/admin/statistics', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/admin/dashboard');

    // ページは表示される
    await expect(page.locator('[data-testid="page-title"]')).toContainText('ダッシュボード');

    // 統計セクションにエラーメッセージが表示される
    await expect(page.locator('[data-testid="statistics-error"]')).toContainText('データの取得に失敗しました');

    // 予約一覧は正常に表示される
    await expect(page.locator('[data-testid="reservations-list"]')).toBeVisible();
  });
});
