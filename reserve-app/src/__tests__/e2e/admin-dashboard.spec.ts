import { test, expect } from '@playwright/test';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: 管理者ダッシュボード（統計表示）
 * Issue: #15
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to view key metrics on a dashboard
 * So that I can understand business performance
 *
 * Gherkinシナリオ: features/admin/dashboard.feature
 */

test.describe('管理者ダッシュボード (#15)', () => {
  let dashboardPage: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    // MSW API モックをセットアップ
    await setupMSW(page);

    dashboardPage = new AdminDashboardPage(page);
    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要でダッシュボードに直接アクセス
    await dashboardPage.goto();
  });

  /**
   * Scenario: 統計データを表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then 本日の予約件数が表示される
   *   And 今月の予約件数が表示される
   *   And 今月の売上が表示される
   *   And リピート率が表示される
   *   And 各統計に前週比の変化率が表示される
   */
  test('統計データを表示する @smoke', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）

    // When: ページが読み込まれる（自動的に読み込まれる）

    // Then: すべての統計カードが表示される
    await dashboardPage.expectStatsCardsVisible();

    // And: 本日の予約件数が表示される
    const todayCount = await dashboardPage.getTodayReservationsCount();
    expect(todayCount).toMatch(/\d+件/);

    // And: 今月の予約件数が表示される
    const monthlyCount = await dashboardPage.getMonthlyReservationsCount();
    expect(monthlyCount).toMatch(/\d+件/);

    // And: 今月の売上が表示される
    const revenue = await dashboardPage.getMonthlyRevenue();
    expect(revenue).toMatch(/¥[\d,]+/);

    // And: リピート率が表示される
    const repeatRate = await dashboardPage.getRepeatRate();
    expect(repeatRate).toMatch(/\d+%/);

    // And: 各統計に前週比の変化率が表示される
    await dashboardPage.expectStatsWithChanges();
  });

  /**
   * Scenario: 本日の予約一覧を表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   And 本日の予約が3件存在する
   *   When ページが読み込まれる
   *   Then 本日の予約一覧が表示される
   *   And 各予約に時間が表示される
   *   And 各予約に顧客名が表示される
   *   And 各予約にメニューが表示される
   *   And 各予約にスタッフ名が表示される
   *   And 各予約にステータスバッジが表示される
   */
  test('本日の予約一覧を表示する @smoke', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）
    // And: 本日の予約が存在する（APIモックデータで提供）

    // When: ページが読み込まれる

    // Then: 本日の予約一覧が表示される
    await dashboardPage.expectTodayReservationsListVisible();

    // And: 予約の件数が最低1件ある
    const count = await dashboardPage.getTodayReservationsListCount();
    expect(count).toBeGreaterThan(0);

    // And: 最初の予約に必要な情報がすべて表示される
    await dashboardPage.expectReservationItem(0, {
      time: '10:00', // APIモックから返される時間
      customer: '山田太郎',
      menu: 'カット',
      staff: '田中',
      status: 'confirmed',
    });
  });

  /**
   * Scenario: 本日の予約がない場合
   *   Given 管理者がダッシュボードにアクセスしている
   *   And 本日の予約が0件である
   *   When ページが読み込まれる
   *   Then "本日の予約はありません"というメッセージが表示される
   */
  test('本日の予約がない場合のメッセージを表示する', async ({ page }) => {
    // Given: 本日の予約が0件のモックデータ
    await setupMSW(page, { adminStatsEmpty: true });
    await dashboardPage.goto();

    // Then: 予約がないメッセージが表示される
    await dashboardPage.expectNoReservationsMessage();
  });

  /**
   * Scenario: 週間予約状況グラフを表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then 週間予約状況のグラフが表示される
   *   And 月曜から日曜までの7日分のラベルが表示される
   *   And 各曜日の予約件数に応じたバーが表示される
   */
  test('週間予約状況グラフを表示する', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）

    // When: ページが読み込まれる

    // Then: 週間予約状況のグラフが表示される
    await dashboardPage.expectWeeklyStatsVisible();

    // And: 月曜から日曜までの7日分のラベルが表示される
    await dashboardPage.expectWeeklyDayLabels();

    // And: 各曜日の予約件数に応じたバーが表示される（7本）
    await dashboardPage.expectWeeklyBarsVisible();
  });

  /**
   * Scenario: リアルタイム更新
   *   Given 管理者がダッシュボードにアクセスしている
   *   When 新しい予約が追加される
   *   Then ダッシュボードの統計が自動的に更新される
   */
  test.skip('リアルタイム更新（将来実装）', async () => {
    // このテストは将来のリアルタイム機能実装時に有効化
  });

  /**
   * Scenario: スタッフ出勤状況を表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then スタッフ出勤状況セクションが表示される
   *   And 各スタッフの名前が表示される
   *   And 各スタッフの状態（勤務中/休憩中）が表示される
   *   And 各スタッフの対応可否を示すインジケータが表示される
   */
  test('スタッフ出勤状況を表示する', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）

    // When: ページが読み込まれる

    // Then: スタッフ出勤状況セクションが表示される
    await dashboardPage.expectStaffStatusVisible();

    // And: 最初のスタッフ情報が正しく表示される
    await dashboardPage.expectStaffItem(0, {
      name: '田中 太郎',
      status: '勤務中',
      available: true,
    });

    // And: 2番目のスタッフ情報が正しく表示される
    await dashboardPage.expectStaffItem(1, {
      name: '佐藤 花子',
      status: '勤務中',
      available: true,
    });

    // And: 3番目のスタッフ情報が正しく表示される
    await dashboardPage.expectStaffItem(2, {
      name: '鈴木 一郎',
      status: '休憩中',
      available: false,
    });
  });

  /**
   * Scenario: クイックアクションボタンを表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then "新規予約を追加"ボタンが表示される
   *   And "顧客を追加"ボタンが表示される
   */
  test('クイックアクションボタンを表示する', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）

    // When: ページが読み込まれる

    // Then: クイックアクションボタンが表示される
    await dashboardPage.expectQuickActionsVisible();
  });

  /**
   * Scenario: 最近の活動を表示する
   *   Given 管理者がダッシュボードにアクセスしている
   *   When ページが読み込まれる
   *   Then 最近の活動セクションが表示される
   *   And 各活動にアイコンが表示される
   *   And 各活動に操作内容が表示される
   *   And 各活動に経過時間が表示される
   */
  test('最近の活動を表示する', async () => {
    // Given: 管理者がダッシュボードにアクセスしている（beforeEachで実行済み）

    // When: ページが読み込まれる

    // Then: 最近の活動セクションが表示される
    await dashboardPage.expectRecentActivityVisible();

    // And: 最初の活動情報が正しく表示される
    await dashboardPage.expectActivityItem(0, {
      action: '新規予約',
      time: '5分前',
    });

    // And: 2番目の活動情報が正しく表示される
    await dashboardPage.expectActivityItem(1, {
      action: '予約変更',
      time: '15分前',
    });

    // And: 3番目の活動情報が正しく表示される
    await dashboardPage.expectActivityItem(2, {
      action: '新規顧客登録',
      time: '1時間前',
    });
  });

  /**
   * Scenario: ローディング状態を表示する
   *   Given 管理者がダッシュボードにアクセスする
   *   When APIからデータを取得中である
   *   Then "読み込み中..."というメッセージが表示される
   *   And 統計データは表示されない
   */
  test('ローディング状態を表示する', async ({ page }) => {
    // Given: APIレスポンスが遅延している状態
    await setupMSW(page, { adminStatsDelay: 3000 }); // 3秒遅延
    const dashboardPageLocal = new AdminDashboardPage(page);

    // When: ダッシュボードにアクセスする
    await dashboardPageLocal.goto();

    // Then: ローディングメッセージが表示される
    await dashboardPageLocal.expectLoading();
  });

  /**
   * Scenario: エラー状態を表示する
   *   Given 管理者がダッシュボードにアクセスする
   *   When APIからデータ取得に失敗する
   *   Then エラーメッセージが赤色の背景で表示される
   *   And 統計データは表示されない
   */
  test('エラー状態を表示する', async ({ page }) => {
    // Given: APIがエラーを返す状態
    await setupMSW(page, { adminStatsError: true });
    const dashboardPageLocal = new AdminDashboardPage(page);

    // When: ダッシュボードにアクセスする
    await dashboardPageLocal.goto();

    // Then: エラーメッセージが表示される
    await dashboardPageLocal.expectError();
  });

  /**
   * Scenario: モバイル表示に対応する
   *   Given 管理者がスマートフォンでアクセスしている
   *   When ダッシュボードを表示する
   *   Then モバイル用のレイアウトが適用される
   *   And 統計カードが縦に並んで表示される
   *   And すべての主要情報が表示される
   */
  test('モバイル表示に対応する', async ({ page }) => {
    // Given: 管理者がスマートフォンでアクセスしている
    await page.setViewportSize({ width: 375, height: 667 });

    // When: ダッシュボードを表示する
    await page.reload();

    // Then: 統計カードが表示される
    await dashboardPage.expectStatsCardsVisible();

    // And: 本日の予約セクションが表示される
    await dashboardPage.expectTodayReservationsListVisible();
  });

  /**
   * 追加テスト: すべて表示ボタンの存在確認
   */
  test('すべて表示ボタンが表示される', async ({ page }) => {
    // Then: すべて表示ボタンが表示される
    const viewAllButton = page.locator('[data-testid="view-all-reservations"]');
    await expect(viewAllButton).toBeVisible();
  });
});
