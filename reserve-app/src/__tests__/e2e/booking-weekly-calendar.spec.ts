import { test, expect } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';

/**
 * Feature: 週間カレンダー表示での予約
 * Issue: #107
 *
 * ユーザーストーリー:
 * As a ユーザー
 * I want to 週間カレンダーで空き時間を一目で確認したい
 * So that 最短ステップで予約を完了できる
 *
 * Gherkinシナリオ: features/booking/weekly-calendar.feature
 */

test.describe('週間カレンダー表示での予約 (#107)', () => {
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);

    // 空き時間APIのモック
    await page.route('**/api/available-slots*', async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get('date');

      // 簡易的なモックデータ（後で拡張）
      const mockSlots = [
        { time: '09:00', available: true },
        { time: '10:00', available: false },
        { time: '11:00', available: true },
        { time: '14:00', available: true },
        { time: '15:00', available: true },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { slots: mockSlots },
        }),
      });
    });

    await bookingPage.goto();
    await bookingPage.waitForLoad();
  });

  /**
   * Scenario: 週間カレンダーがデフォルトで表示される
   */
  test('週間カレンダーがデフォルトで表示される', async () => {
    // Given: 予約ページにアクセスする
    // And: メニューを選択する
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);

    // When: ページが読み込まれる
    // Then: 週間カレンダーが表示される
    await bookingPage.expectWeeklyCalendarVisible();

    // And: 表示モード「週間」がアクティブである
    await bookingPage.expectViewModeActive('weekly');

    // And: 月間カレンダーは非表示
    await bookingPage.expectMonthlyCalendarNotVisible();
  });

  /**
   * Scenario: 月間表示に切り替えられる
   */
  test('月間表示に切り替えられる', async () => {
    // Given: 予約ページにアクセスしてメニューを選択
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);

    // And: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 「月間」タブをクリックする
    await bookingPage.clickViewModeTab('monthly');

    // Then: 月間カレンダーが表示される
    await bookingPage.expectMonthlyCalendarVisible();

    // And: 表示モード「月間」がアクティブである
    await bookingPage.expectViewModeActive('monthly');

    // And: 週間カレンダーが非表示になる
    await bookingPage.expectWeeklyCalendarNotVisible();
  });

  /**
   * Scenario: 月間表示から週間表示に戻れる
   */
  test('月間表示から週間表示に戻れる', async () => {
    // Given: 月間表示を表示している
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);
    await bookingPage.clickViewModeTab('monthly');
    await bookingPage.expectMonthlyCalendarVisible();

    // When: 「週間」タブをクリックする
    await bookingPage.clickViewModeTab('weekly');

    // Then: 週間カレンダーが表示される
    await bookingPage.expectWeeklyCalendarVisible();

    // And: 表示モード「週間」がアクティブである
    await bookingPage.expectViewModeActive('weekly');

    // And: 月間カレンダーが非表示になる
    await bookingPage.expectMonthlyCalendarNotVisible();
  });

  /**
   * Scenario: 表示モードがLocalStorageに保存される
   */
  test('表示モードがLocalStorageに保存される', async () => {
    // Given: 予約ページにアクセスしてメニューを選択
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);

    // And: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 「月間」タブをクリックする
    await bookingPage.clickViewModeTab('monthly');
    await bookingPage.wait(500);

    // And: ページをリロードする
    await bookingPage.reload();
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);

    // Then: 月間カレンダーが表示される
    await bookingPage.expectMonthlyCalendarVisible();

    // And: 表示モード「月間」がアクティブである
    await bookingPage.expectViewModeActive('monthly');

    // 後片付け: LocalStorageをクリア
    await bookingPage.setLocalStorage('booking-calendar-view-mode', 'weekly');
  });

  /**
   * Scenario: 次週に移動できる
   */
  test('次週に移動できる', async () => {
    // Given: 週間カレンダーが表示されている
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 「次週」ボタンをクリックする
    const originalWeekRange = await bookingPage.getWeekRangeTitle();
    await bookingPage.clickNextWeek();
    await bookingPage.wait(500);

    // Then: 週の範囲が変更される
    const newWeekRange = await bookingPage.getWeekRangeTitle();
    expect(newWeekRange).not.toBe(originalWeekRange);
  });

  /**
   * Scenario: 前週に移動できる
   */
  test('前週に移動できる', async () => {
    // Given: 週間カレンダーが表示されている
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 「前週」ボタンをクリックする
    const originalWeekRange = await bookingPage.getWeekRangeTitle();
    await bookingPage.clickPreviousWeek();
    await bookingPage.wait(500);

    // Then: 週の範囲が変更される
    const newWeekRange = await bookingPage.getWeekRangeTitle();
    expect(newWeekRange).not.toBe(originalWeekRange);
  });
});

/**
 * テストグループ: 週間カレンダーの空き時間表示
 */
test.describe('週間カレンダーの空き時間表示 (#107)', () => {
  test.skip('週間カレンダーで空き時間が一目でわかる', async ({ page }) => {
    // TODO: 週間カレンダーコンポーネント実装後に実装
    // 空き時間ブロックが緑色で表示される
    // 予約済みブロックがグレーアウト表示される
  });

  test.skip('空き時間を1クリックで選択できる', async ({ page }) => {
    // TODO: 週間カレンダーコンポーネント実装後に実装
    // 空きブロックをクリックして日時選択
    // 予約確定ボタンが有効になる
  });

  test.skip('予約済みの時間はクリックできない', async ({ page }) => {
    // TODO: 週間カレンダーコンポーネント実装後に実装
    // 予約済みブロックがクリックできない
  });

  test.skip('休憩時間がグレー表示される', async ({ page }) => {
    // TODO: 週間カレンダーコンポーネント実装後に実装
    // 休憩時間ブロックが表示される
  });
});
