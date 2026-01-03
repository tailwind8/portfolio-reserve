import { test, expect } from '@playwright/test';
import { AdminReservationsPage } from './pages/AdminReservationsPage';
import { LoginPage } from './pages/LoginPage';

/**
 * E2Eテスト: 管理者向け週間カレンダーでの予約管理
 *
 * Gherkin: reserve-app/features/admin/weekly-calendar.feature
 */

// E2E用の管理者認証情報を環境変数から取得
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';

test.describe('管理者向け週間カレンダーでの予約管理', () => {
  let adminReservationsPage: AdminReservationsPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    adminReservationsPage = new AdminReservationsPage(page);
    loginPage = new LoginPage(page);

    // 管理者でログイン（環境変数から認証情報を取得）
    await loginPage.goto('/admin/login');
    await loginPage.login(E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
    await page.waitForURL('/admin/dashboard');
  });

  test.describe('表示切り替え', () => {
    test('管理者が予約管理ページにアクセスするとデフォルトで一覧表示になる', async () => {
      // Given: 予約管理ページにアクセスする
      await adminReservationsPage.goto();

      // When: ページが読み込まれる
      await adminReservationsPage.page.waitForLoadState('networkidle');

      // Then: 予約一覧が表示される
      await adminReservationsPage.expectTableVisible();

      // And: 表示モード「一覧表示」がアクティブである
      await adminReservationsPage.expectViewModeActive('list');

      // And: 「カレンダー表示」タブが表示される
      await expect(adminReservationsPage.page.locator('[data-testid="calendar-view-tab"]')).toBeVisible();
    });

    test('カレンダー表示タブをクリックして週間カレンダーを表示する', async () => {
      // Given: 予約管理ページにアクセスする
      await adminReservationsPage.goto();

      // When: 「カレンダー表示」タブをクリックする
      await adminReservationsPage.clickCalendarViewTab();

      // Then: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // And: 表示モード「カレンダー表示」がアクティブである
      await adminReservationsPage.expectViewModeActive('calendar');

      // And: 週のタイトルが表示される（2026年1月6日から1月12日）
      await adminReservationsPage.expectWeekTitle('2026年1月6日 〜 1月12日');

      // And: 予約一覧が非表示になる
      await adminReservationsPage.expectTableHidden();
    });

    test('一覧表示に戻る', async () => {
      // Given: 予約管理ページにアクセスする
      await adminReservationsPage.goto();

      // And: 「カレンダー表示」タブをクリックする
      await adminReservationsPage.clickCalendarViewTab();
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: 「一覧表示」タブをクリックする
      await adminReservationsPage.clickListViewTab();

      // Then: 予約一覧が表示される
      await adminReservationsPage.expectTableVisible();

      // And: 表示モード「一覧表示」がアクティブである
      await adminReservationsPage.expectViewModeActive('list');

      // And: 週間カレンダーが非表示になる
      await adminReservationsPage.expectWeeklyCalendarHidden();
    });

    test('表示モードがLocalStorageに保存される', async () => {
      // Given: 予約管理ページにアクセスする
      await adminReservationsPage.goto();

      // And: 「カレンダー表示」タブをクリックする
      await adminReservationsPage.clickCalendarViewTab();
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: ページをリロードする
      await adminReservationsPage.reload();

      // Then: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // And: 表示モード「カレンダー表示」がアクティブである
      await adminReservationsPage.expectViewModeActive('calendar');
    });
  });

  test.describe('週間カレンダー表示', () => {
    test.beforeEach(async () => {
      await adminReservationsPage.goto();
      await adminReservationsPage.clickCalendarViewTab();
    });

    test('週間カレンダーで予約状況を確認する', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // Then: 月曜日09:00のブロックに「山田」と表示される
      await adminReservationsPage.expectTimeBlockReservation(0, '09:00', '山田', 'カット');

      // And: 月曜日09:00のブロックが青色で表示される（確定済み）
      await adminReservationsPage.expectTimeBlockColor(0, '09:00', 'blue');

      // And: 火曜日10:00のブロックに「鈴木」と表示される
      await adminReservationsPage.expectTimeBlockReservation(1, '10:00', '鈴木', 'カラー');

      // And: 火曜日10:00のブロックが黄色で表示される（保留中）
      await adminReservationsPage.expectTimeBlockColor(1, '10:00', 'yellow');

      // And: 水曜日14:00のブロックに「伊藤」と表示される
      await adminReservationsPage.expectTimeBlockReservation(2, '14:00', '伊藤', 'パーマ');
    });

    test('週間カレンダーで空き時間が緑色で表示される', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // Then: 月曜日10:00のブロックが緑色で表示される
      await adminReservationsPage.expectTimeBlockAvailable(0, '10:00');

      // And: 火曜日09:00のブロックが緑色で表示される
      await adminReservationsPage.expectTimeBlockAvailable(1, '09:00');

      // And: 水曜日09:00のブロックが緑色で表示される
      await adminReservationsPage.expectTimeBlockAvailable(2, '09:00');
    });

    test('休憩時間がグレーで表示される', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // Then: 月曜日12:00のブロックに「休憩時間」と表示される
      await adminReservationsPage.expectTimeBlockBreak(0, '12:00');

      // And: 休憩時間のブロックはクリックできない
      await adminReservationsPage.expectTimeBlockDisabled(0, '12:00');
    });

    test('定休日がグレーで表示される', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // Then: 日曜日の全ブロックに「[休]」と表示される
      await adminReservationsPage.expectTimeBlockClosed(6, '09:00');
      await adminReservationsPage.expectTimeBlockClosed(6, '10:00');
      await adminReservationsPage.expectTimeBlockClosed(6, '11:00');

      // And: 定休日のブロックはクリックできない
      await adminReservationsPage.expectTimeBlockDisabled(6, '09:00');
    });
  });

  test.describe('週のナビゲーション', () => {
    test.beforeEach(async () => {
      await adminReservationsPage.goto();
      await adminReservationsPage.clickCalendarViewTab();
    });

    test('次週に移動する', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: 「次週」ボタンをクリックする
      await adminReservationsPage.clickNextWeek();

      // Then: 2026年1月13日から1月19日の週が表示される
      await adminReservationsPage.expectWeekTitle('2026年1月13日 〜 1月19日');
    });

    test('前週に移動する', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: 「前週」ボタンをクリックする
      await adminReservationsPage.clickPrevWeek();

      // Then: 2025年12月30日から2026年1月5日の週が表示される
      await adminReservationsPage.expectWeekTitle('2025年12月30日 〜 1月5日');
    });
  });

  test.describe('予約詳細モーダル', () => {
    test.beforeEach(async () => {
      await adminReservationsPage.goto();
      await adminReservationsPage.clickCalendarViewTab();
    });

    test('予約ブロックをクリックして詳細を確認する', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: 月曜日09:00の予約ブロック「山田」をクリックする
      await adminReservationsPage.clickTimeBlock(0, '09:00');

      // Then: 予約詳細モーダルが表示される
      await adminReservationsPage.expectReservationDetailModalVisible();

      // And: モーダルに顧客名「山田」が表示される
      // And: モーダルにメニュー「カット」が表示される
      // And: モーダルにスタッフ「田中」が表示される
      // And: モーダルにステータス「確定済み」が表示される
      await adminReservationsPage.expectReservationDetailModalContent({
        customer: '山田',
        menu: 'カット',
        staff: '田中',
        status: '確定済み',
      });

      // And: モーダルに「編集」ボタンが表示される
      // And: モーダルに「キャンセル」ボタンが表示される
      await adminReservationsPage.expectDetailModalButtonsVisible();
    });
  });

  test.describe('新規予約モーダル', () => {
    test.beforeEach(async () => {
      await adminReservationsPage.goto();
      await adminReservationsPage.clickCalendarViewTab();
    });

    test('空き時間ブロックをクリックして新規予約を追加する', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: 月曜日10:00の空きブロックをクリックする
      await adminReservationsPage.clickTimeBlock(0, '10:00');

      // Then: 新規予約追加モーダルが表示される
      await adminReservationsPage.expectAddModalVisible();

      // And: モーダルの日付フィールドに「2026-01-06」が自動入力される
      await adminReservationsPage.expectAddModalDatePreFilled('2026-01-06');

      // And: モーダルの時間フィールドに「10:00」が自動入力される
      await adminReservationsPage.expectAddModalTimePreFilled('10:00');

      // And: モーダルにフォーム要素が表示される
      await adminReservationsPage.expectAddModalFormVisible();
    });
  });

  test.describe('フィルター機能', () => {
    test.beforeEach(async () => {
      await adminReservationsPage.goto();
      await adminReservationsPage.clickCalendarViewTab();
    });

    test('スタッフ別フィルターで予約を絞り込む', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: スタッフフィルターで「田中」を選択する
      await adminReservationsPage.filterByStaff('田中');

      // Then: 月曜日09:00のブロックに「山田」と表示される
      await adminReservationsPage.expectTimeBlockReservation(0, '09:00', '山田', 'カット');

      // And: 水曜日14:00のブロックに「伊藤」と表示される
      await adminReservationsPage.expectTimeBlockReservation(2, '14:00', '伊藤', 'パーマ');

      // And: 火曜日10:00のブロック「鈴木」が表示されない
      await adminReservationsPage.expectTimeBlockNotVisible(1, '10:00', '鈴木');
    });

    test('メニュー別フィルターで予約を絞り込む', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: メニューフィルターで「カット」を選択する
      await adminReservationsPage.filterByMenu('カット');

      // Then: 月曜日09:00のブロックに「山田」と表示される
      await adminReservationsPage.expectTimeBlockReservation(0, '09:00', '山田', 'カット');

      // And: 火曜日10:00のブロック「鈴木」が表示されない
      await adminReservationsPage.expectTimeBlockNotVisible(1, '10:00', '鈴木');

      // And: 水曜日14:00のブロック「伊藤」が表示されない
      await adminReservationsPage.expectTimeBlockNotVisible(2, '14:00', '伊藤');
    });

    test('ステータス別フィルターで予約を絞り込む', async () => {
      // Given: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // When: ステータスフィルターで「確定済み」を選択する
      await adminReservationsPage.filterByStatusCalendar('confirmed');

      // Then: 月曜日09:00のブロックに「山田」と表示される
      await adminReservationsPage.expectTimeBlockReservation(0, '09:00', '山田', 'カット');

      // And: 水曜日14:00のブロックに「伊藤」と表示される
      await adminReservationsPage.expectTimeBlockReservation(2, '14:00', '伊藤', 'パーマ');

      // And: 火曜日10:00のブロック「鈴木」が表示されない
      await adminReservationsPage.expectTimeBlockNotVisible(1, '10:00', '鈴木');
    });
  });

  test.describe('キャンセル済み予約', () => {
    test('キャンセル済み予約が薄い赤色で表示される', async () => {
      // Given: 予約管理ページにアクセスする
      await adminReservationsPage.goto();

      // And: 以下のキャンセル済み予約が登録されている
      // (テストデータをセットアップ)

      // And: 「カレンダー表示」タブをクリックする
      await adminReservationsPage.clickCalendarViewTab();

      // When: 週間カレンダーが表示される
      await adminReservationsPage.expectWeeklyCalendarVisible();

      // Then: 木曜日11:00のブロックに「高橋」と表示される
      await adminReservationsPage.expectTimeBlockReservation(3, '11:00', '高橋', 'カット');

      // And: 木曜日11:00のブロックが薄い赤色で表示される
      await adminReservationsPage.expectTimeBlockColor(3, '11:00', 'red');
    });
  });
});
