import { test, expect, Page } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';
import { LoginPage } from './pages/LoginPage';

/**
 * E2Eテスト: 予約の並行処理と重複防止
 *
 * このテストは、予約システムにおける並行処理と重複防止の機能を検証します。
 * - Race Condition対策
 * - 所要時間の重複チェック
 * - スタッフのダブルブッキング防止
 * - 同一ユーザーの重複予約防止
 *
 * 対応Gherkin: reserve-app/features/booking/booking-concurrency.feature
 */

test.describe('予約の並行処理と重複防止', () => {
  let page1: Page;
  let page2: Page;

  test.beforeEach(async ({ browser }) => {
    // 2つのブラウザコンテキストを作成（異なるユーザーをシミュレート）
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test('同時リクエストによる重複予約防止（Race Condition）', async () => {
    // ユーザー1がログイン
    const loginPage1 = new LoginPage(page1);
    await loginPage1.goto();
    await loginPage1.login('tanaka@example.com', 'password123');
    await expect(page1).toHaveURL('/mypage');

    // ユーザー2がログイン
    const loginPage2 = new LoginPage(page2);
    await loginPage2.goto();
    await loginPage2.login('suzuki@example.com', 'password123');
    await expect(page2).toHaveURL('/mypage');

    // 両方のユーザーが予約ページにアクセス
    const bookingPage1 = new BookingPage(page1);
    const bookingPage2 = new BookingPage(page2);
    await bookingPage1.goto();
    await bookingPage2.goto();

    // 両方のユーザーが同じ条件を選択
    await bookingPage1.selectMenu(1); // カット（60分）
    await bookingPage1.selectFutureDate('20');
    await bookingPage1.selectAvailableTimeSlot(); // 14:00を選択

    await bookingPage2.selectMenu(1); // カット（60分）
    await bookingPage2.selectFutureDate('20');
    await bookingPage2.selectAvailableTimeSlot(); // 14:00を選択

    // 同時に予約を送信（Promise.allで並行実行）
    const [result1, result2] = await Promise.allSettled([
      bookingPage1.submit(),
      bookingPage2.submit(),
    ]);

    // どちらか一方のみ成功し、もう一方はエラーになることを確認
    // ページ遷移を待機（成功または失敗画面へ）
    await Promise.all([
      page1.waitForURL(/\/(booking|mypage)/, { timeout: 10000 }),
      page2.waitForURL(/\/(booking|mypage)/, { timeout: 10000 }),
    ]);

    const url1 = page1.url();
    const url2 = page2.url();

    // 片方は成功ページ、片方はエラー表示
    const successCount = [url1, url2].filter(url => url.includes('/booking/complete')).length;
    const errorCount = [url1, url2].filter(url => url.includes('/booking')).length;

    expect(successCount).toBe(1);
    expect(errorCount).toBe(1);

    // エラーが表示されたページでメッセージを確認
    if (!url1.includes('/booking/complete')) {
      await expect(page1.locator('text=この時間は既に予約済みです')).toBeVisible();
    } else {
      await expect(page2.locator('text=この時間は既に予約済みです')).toBeVisible();
    }
  });

  test('所要時間が重複する予約の防止', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // 14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:00")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 14:30-15:30の予約を試みる（重複）
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');

    // 14:30が選択不可能になっているか、またはエラーが表示される
    const slot1430 = page.locator('button:has-text("14:30")');
    const isDisabled = await slot1430.isDisabled();

    if (!isDisabled) {
      // クリック可能な場合は、送信時にエラーが表示されるはず
      await slot1430.click();
      await bookingPage.submit();
      await expect(page.locator('text=予約時間が重複しています')).toBeVisible();
    } else {
      // ボタンが無効化されていることを確認
      expect(isDisabled).toBe(true);
    }
  });

  test('所要時間が重複する予約の防止（後ろの予約が先行予約に重複）', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // 14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:00")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 13:30-14:30の予約を試みる（重複）
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');

    const slot1330 = page.locator('button:has-text("13:30")');
    const isDisabled = await slot1330.isDisabled();

    if (!isDisabled) {
      await slot1330.click();
      await bookingPage.submit();
      await expect(page.locator('text=予約時間が重複しています')).toBeVisible();
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('所要時間が重複しない予約は成功する', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // 14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:00")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 15:00-16:00の予約を試みる（重複なし）
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("15:00")').click();
    await bookingPage.submit();

    // 成功することを確認
    await expect(page).toHaveURL('/booking/complete');
    await expect(page.locator('[data-testid="confirmation-time"]')).toContainText('15:00');
  });

  test('スタッフのダブルブッキング防止', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // スタッフ「佐藤花子」で14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1); // カット（60分）
    await bookingPage.selectStaff(1); // 佐藤花子
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:00")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 同じスタッフで14:30-15:30の予約を試みる
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectStaff(1); // 同じスタッフ
    await bookingPage.selectFutureDate('20');

    const slot1430 = page.locator('button:has-text("14:30")');
    const isDisabled = await slot1430.isDisabled();

    if (!isDisabled) {
      await slot1430.click();
      await bookingPage.submit();
      await expect(page.locator('text=選択されたスタッフは指定時間帯に対応できません')).toBeVisible();
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('スタッフのダブルブッキング防止（複数スタッフが存在する場合）', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // スタッフ「佐藤花子」で14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectStaff(1); // 佐藤花子
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:30")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 別のスタッフ「山田太郎」で14:30-15:30の予約を試みる（成功するはず）
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectStaff(2); // 山田太郎（別のスタッフ）
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:30")').click();
    await bookingPage.submit();

    // 成功することを確認
    await expect(page).toHaveURL('/booking/complete');
  });

  test('同一ユーザーによる重複時間帯予約の防止', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');

    // 14:00-15:00の予約を作成
    const bookingPage = new BookingPage(page);
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('20');
    await page.locator('button:has-text("14:00")').click();
    await bookingPage.submit();
    await expect(page).toHaveURL('/booking/complete');

    // 同じ時間帯で別の予約を試みる
    await bookingPage.goto();
    await bookingPage.selectMenu(1);
    await bookingPage.selectFutureDate('20');

    const slot1430 = page.locator('button:has-text("14:30")');
    const isDisabled = await slot1430.isDisabled();

    if (!isDisabled) {
      await slot1430.click();
      await bookingPage.submit();
      await expect(page.locator('text=既にこの時間帯に予約があります')).toBeVisible();
    } else {
      expect(isDisabled).toBe(true);
    }
  });

  test('複数スタッフがいる場合の並行予約（成功ケース）', async () => {
    // ユーザー1がログイン
    const loginPage1 = new LoginPage(page1);
    await loginPage1.goto();
    await loginPage1.login('tanaka@example.com', 'password123');

    // ユーザー2がログイン
    const loginPage2 = new LoginPage(page2);
    await loginPage2.goto();
    await loginPage2.login('suzuki@example.com', 'password123');

    // ユーザー1が佐藤花子で予約
    const bookingPage1 = new BookingPage(page1);
    await bookingPage1.goto();
    await bookingPage1.selectMenu(1);
    await bookingPage1.selectStaff(1); // 佐藤花子
    await bookingPage1.selectFutureDate('20');
    await page1.locator('button:has-text("14:00")').click();

    // ユーザー2が山田太郎で予約
    const bookingPage2 = new BookingPage(page2);
    await bookingPage2.goto();
    await bookingPage2.selectMenu(1);
    await bookingPage2.selectStaff(2); // 山田太郎
    await bookingPage2.selectFutureDate('20');
    await page2.locator('button:has-text("14:00")').click();

    // 同時に予約を送信
    await Promise.all([
      bookingPage1.submit(),
      bookingPage2.submit(),
    ]);

    // 両方とも成功することを確認（遷移を待機）
    await expect(page1).toHaveURL('/booking/complete', { timeout: 10000 });
    await expect(page2).toHaveURL('/booking/complete');
  });
});
