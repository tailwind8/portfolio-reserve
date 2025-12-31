import { test, expect } from '@playwright/test';

/**
 * Feature: 管理者ダッシュボード（統計表示）
 * Issue: #15
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to view key metrics on a dashboard
 * So that I can understand business performance
 */

test.describe('管理者ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 管理者ログイン処理を実装後に追加
    // 現在はログイン不要でダッシュボードに直接アクセス
    await page.goto('/admin/dashboard');
  });

  /**
   * Scenario: 統計データを表示
   *   Given 管理者がログインしている
   *   When ダッシュボードにアクセスする
   *   Then 本日の予約件数が表示される
   *   And 今月の予約件数が表示される
   *   And 売上統計が表示される
   */
  test('統計データを表示する', async ({ page }) => {
    // Then: 本日の予約件数が表示される
    await expect(page.getByText('本日の予約')).toBeVisible();
    const todayReservationsCard = page.locator('div', { has: page.getByText('本日の予約') }).first();
    await expect(todayReservationsCard).toContainText(/\d+件/);

    // And: 今月の予約件数が表示される
    await expect(page.getByText('今月の予約')).toBeVisible();
    const monthlyReservationsCard = page.locator('div', { has: page.getByText('今月の予約') }).first();
    await expect(monthlyReservationsCard).toContainText(/\d+件/);

    // And: 売上統計が表示される
    await expect(page.getByText('今月の売上')).toBeVisible();
    const revenueCard = page.locator('div', { has: page.getByText('今月の売上') }).first();
    await expect(revenueCard).toContainText(/¥[\d,]+/);
  });

  /**
   * Scenario: 本日の予約一覧を表示
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then 本日の予約一覧が表示される
   *   And 各予約に時間、顧客名、メニュー、スタッフ、ステータスが表示される
   */
  test('本日の予約一覧を表示する', async ({ page }) => {
    // Then: 本日の予約一覧が表示される
    const reservationsSection = page.locator('h2', { hasText: '本日の予約' }).locator('..');
    await expect(reservationsSection).toBeVisible();

    // And: 予約の件数が表示される（最低1件）
    const reservationItems = page.locator('[data-testid="reservation-item"]');
    const count = await reservationItems.count();
    expect(count).toBeGreaterThan(0);

    // And: 各予約に必要な情報が表示される
    if (count > 0) {
      const firstReservation = reservationItems.first();
      // 時間が表示される（HH:MM形式）
      await expect(firstReservation).toContainText(/\d{1,2}:\d{2}/);
      // ステータスバッジが表示される
      await expect(firstReservation.locator('span[class*="rounded-full"]')).toBeVisible();
    }
  });

  /**
   * Scenario: 週間予約状況グラフを表示
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then 週間予約状況のグラフが表示される
   *   And 月曜から日曜までの7日分が表示される
   */
  test('週間予約状況グラフを表示する', async ({ page }) => {
    // Then: 週間予約状況のグラフが表示される
    await expect(page.getByText('週間予約状況')).toBeVisible();

    // And: 月曜から日曜までの7日分が表示される
    const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
    for (const day of weekDays) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  /**
   * Scenario: リアルタイム更新
   *   Given 管理者がダッシュボードにアクセスしている
   *   When 新しい予約が追加される
   *   Then ダッシュボードの統計が自動的に更新される
   */
  test.skip('リアルタイム更新（将来実装）', async ({ page }) => {
    // このテストは将来のリアルタイム機能実装時に有効化
  });

  /**
   * Scenario: スタッフ出勤状況を表示
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then スタッフ出勤状況が表示される
   */
  test('スタッフ出勤状況を表示する', async ({ page }) => {
    // Then: スタッフ出勤状況が表示される
    await expect(page.getByText('スタッフ出勤状況')).toBeVisible();

    // And: スタッフ情報が表示される
    const staffSection = page.locator('h3', { hasText: 'スタッフ出勤状況' }).locator('..');
    await expect(staffSection).toBeVisible();
  });

  /**
   * Scenario: クイックアクションボタン
   *   Given 管理者がダッシュボードにアクセスしている
   *   When クイックアクションを確認する
   *   Then 新規予約追加ボタンが表示される
   *   And 顧客追加ボタンが表示される
   */
  test('クイックアクションボタンを表示する', async ({ page }) => {
    // Then: 新規予約追加ボタンが表示される
    await expect(page.getByRole('button', { name: /新規予約を追加/ })).toBeVisible();

    // And: 顧客追加ボタンが表示される
    await expect(page.getByRole('button', { name: /顧客を追加/ })).toBeVisible();
  });

  /**
   * Scenario: レスポンシブデザイン
   *   Given 管理者がスマートフォンでアクセスしている
   *   When ダッシュボードを表示する
   *   Then モバイル用のレイアウトが適用される
   */
  test('モバイル表示に対応する', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // ページを再読み込み
    await page.reload();

    // 統計カードが表示される
    await expect(page.getByText('本日の予約')).toBeVisible();
    await expect(page.getByText('今月の予約')).toBeVisible();
  });
});
