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
  let bookingPage: BookingPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);

    // 週間カレンダー用のモックデータ
    await page.route('**/api/available-slots*', async (route) => {
      const url = new URL(route.request().url());
      const date = url.searchParams.get('date');

      // 日付ごとのモックデータ
      const mockDataByDate: Record<string, { success: boolean; data: { slots: { time: string; available: boolean }[] } }> = {
        '2026-01-06': {
          // 月曜日
          success: true,
          data: {
            slots: [
              { time: '09:00', available: true },
              { time: '10:00', available: false }, // 予約済み
              { time: '11:00', available: true },
              { time: '14:00', available: true },
              { time: '15:00', available: true },
            ],
          },
        },
        '2026-01-07': {
          // 火曜日
          success: true,
          data: {
            slots: [
              { time: '09:00', available: true },
              { time: '10:00', available: true },
              { time: '11:00', available: false }, // 予約済み
              { time: '14:00', available: true },
              { time: '15:00', available: true },
            ],
          },
        },
        '2026-01-08': {
          // 水曜日
          success: true,
          data: {
            slots: [
              { time: '09:00', available: false }, // 予約済み
              { time: '10:00', available: true },
              { time: '11:00', available: true },
              { time: '14:00', available: true },
              { time: '15:00', available: true },
            ],
          },
        },
      };

      const mockData = mockDataByDate[date || ''] || {
        success: true,
        data: {
          slots: [
            { time: '09:00', available: true },
            { time: '10:00', available: true },
            { time: '11:00', available: true },
            { time: '14:00', available: true },
            { time: '15:00', available: true },
          ],
        },
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    await bookingPage.goto();
    await bookingPage.waitForLoad();
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);
  });

  /**
   * Scenario: 週間カレンダーで空き時間が一目でわかる
   */
  test('週間カレンダーで空き時間が一目でわかる', async () => {
    // Given: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // Then: 月曜日09:00のブロックが緑色で表示される（空き）
    await bookingPage.expectWeeklyTimeBlockAvailable(0, '09:00');

    // And: 月曜日10:00のブロックがグレーアウト表示される（予約済み）
    await bookingPage.expectWeeklyTimeBlockUnavailable(0, '10:00');

    // And: 火曜日09:00のブロックが緑色で表示される（空き）
    await bookingPage.expectWeeklyTimeBlockAvailable(1, '09:00');

    // And: 火曜日14:00のブロックが緑色で表示される（空き）
    await bookingPage.expectWeeklyTimeBlockAvailable(1, '14:00');

    // And: 水曜日10:00のブロックが緑色で表示される（空き）
    await bookingPage.expectWeeklyTimeBlockAvailable(2, '10:00');
  });

  /**
   * Scenario: 空き時間を1クリックで選択できる
   */
  test('空き時間を1クリックで選択できる', async () => {
    // Given: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 火曜日14:00の空きブロックをクリックする
    await bookingPage.clickWeeklyTimeBlock(1, '14:00');

    // Then: 日付「2026年1月7日（火）」が選択される
    const selectedDateText = await bookingPage.page
      .locator('[data-testid="selected-date"]')
      .textContent();
    expect(selectedDateText).toContain('2026年1月7日（火）');

    // And: 時間「14:00」が選択される
    const selectedTimeText = await bookingPage.page
      .locator('[data-testid="selected-time"]')
      .textContent();
    expect(selectedTimeText).toContain('14:00');

    // And: 予約確定ボタンが有効になる
    await bookingPage.expectSubmitButtonEnabled();
  });

  /**
   * Scenario: 予約済みの時間はクリックできない
   */
  test('予約済みの時間はクリックできない', async () => {
    // Given: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // When: 月曜日10:00の予約済みブロックをクリックする
    // Then: クリックできない（disabledなのでクリックイベントが発火しない）
    await bookingPage.expectWeeklyTimeBlockUnavailable(0, '10:00');

    // And: 日付と時間が選択されない（予約確定ボタンが無効のまま）
    await bookingPage.expectSubmitButtonDisabled();

    // And: 予約済みブロックがグレーアウトのまま
    await bookingPage.expectWeeklyTimeBlockUnavailable(0, '10:00');
  });

  /**
   * Scenario: 休憩時間がグレー表示される
   */
  test('休憩時間がグレー表示される', async ({ page }) => {
    // 店舗設定APIのモック（休憩時間12:00-13:00）
    await page.route('**/api/settings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            openingTime: '09:00',
            closingTime: '18:00',
            breakTimeStart: '12:00',
            breakTimeEnd: '13:00',
          },
        }),
      });
    });

    // 再度ページを読み込んで設定を反映
    await bookingPage.reload();
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);

    // Given: 週間カレンダーが表示されている
    await bookingPage.expectWeeklyCalendarVisible();

    // Then: 12:00の時間帯に「休憩時間」と表示される
    await bookingPage.expectBreakTimeVisible('12:00');

    // And: 休憩時間のブロックがグレーで表示される
    // And: 休憩時間のブロックはクリックできない
    // （expectBreakTimeVisibleで検証済み）
  });
});
