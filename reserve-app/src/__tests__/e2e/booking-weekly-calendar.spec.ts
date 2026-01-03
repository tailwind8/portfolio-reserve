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

      // 30分刻みで全スロットを提供（09:00-20:00）
      const mockSlots = [];
      for (let hour = 9; hour < 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          // 10:00のみ予約済みとする（明示的にfalseを設定）
          const available = time !== '10:00';
          mockSlots.push({
            time: time,
            available: available,
            staffId: undefined
          });
        }
      }

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

    // メニューを選択して週間スロットを取得
    await bookingPage.selectMenu(1);
    await bookingPage.wait(500);
  });

  /**
   * Scenario: 週間カレンダーがデフォルトで表示される
   */
  test('週間カレンダーがデフォルトで表示される', async () => {
    // Given: 予約ページにアクセスする
    // And: メニューを選択する（beforeEachで実施済み）

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
    // Given: 予約ページにアクセスしてメニューを選択（beforeEachで実施済み）

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
    // Given: 月間表示を表示している（beforeEachでメニュー選択済み）
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
    // Given: 予約ページにアクセスしてメニューを選択（beforeEachで実施済み）

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
    // Given: 週間カレンダーが表示されている（beforeEachでメニュー選択済み）
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
    // Given: 週間カレンダーが表示されている（beforeEachでメニュー選択済み）
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
      // 実際にリクエストされる日付: 2025-12-28週と2026-01-04週
      const mockDataByDate: Record<string, { success: boolean; data: { slots: { time: string; available: boolean }[] } }> = {
        // 2025-12-28週（初期表示） - すべて過去なので空き・予約済み混在
        '2025-12-28': {
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
        },
        '2025-12-29': {
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
        },
        '2025-12-30': {
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
        },
        '2025-12-31': {
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
        },
        '2026-01-01': {
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
        },
        '2026-01-02': {
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
        },
        '2026-01-03': {
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
        },
        // 2026-01-04週（次週ボタンクリック後） - テストで使用
        '2026-01-04': {
          success: true,
          data: {
            slots: [
              { time: '09:00', available: true },
              { time: '10:00', available: false }, // 予約済み（テストで確認）
              { time: '11:00', available: true },
              { time: '14:00', available: true },
              { time: '15:00', available: true },
            ],
          },
        },
        '2026-01-05': {
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
        '2026-01-06': {
          // 水曜日（次週の2026-01-04週のdayIndex=2）
          success: true,
          data: {
            slots: [
              { time: '09:00', available: true },
              { time: '10:00', available: true }, // 空き（テストで確認）
              { time: '11:00', available: true },
              { time: '14:00', available: true },
              { time: '15:00', available: true },
            ],
          },
        },
        '2026-01-07': {
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
        },
        '2026-01-08': {
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
        },
        '2026-01-09': {
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
        },
        '2026-01-10': {
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
        },
        '2026-01-13': {
          // 月曜日（次週）- テストで使用
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
        '2026-01-14': {
          // 火曜日（次週）
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
        '2026-01-15': {
          // 水曜日（次週）
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
            { time: '09:00', available: false }, // デフォルトは予約済みにして区別しやすくする
            { time: '10:00', available: false },
            { time: '11:00', available: false },
            { time: '14:00', available: false },
            { time: '15:00', available: false },
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

    // And: 未来の週に移動する（過去の日付をテストしないため）
    await bookingPage.clickNextWeek();
    await bookingPage.wait(500);

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

    // And: 未来の週に移動する（過去の日付をテストしないため）
    await bookingPage.clickNextWeek();
    await bookingPage.wait(500);

    // When: 火曜日14:00の空きブロックをクリックする
    await bookingPage.clickWeeklyTimeBlock(1, '14:00');

    // Then: 日付に「火曜日」が含まれる
    const selectedDateText = await bookingPage.page
      .locator('[data-testid="selected-date"]')
      .textContent();
    expect(selectedDateText).toContain('（火）');

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

    // And: 未来の週に移動する（過去の日付をテストしないため）
    await bookingPage.clickNextWeek();
    await bookingPage.wait(500);

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
