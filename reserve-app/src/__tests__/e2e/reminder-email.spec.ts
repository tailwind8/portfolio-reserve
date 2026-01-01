import { test } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { ReminderEmailApiHelper } from './pages/ReminderEmailApiHelper';

/**
 * Feature: リマインダーメール自動送信機能
 * 詳細なシナリオは reserve-app/src/__tests__/e2e/features/reminder-email.feature を参照
 */
test.describe('Reminder Email Cron Job', () => {
  let apiHelper: ReminderEmailApiHelper;

  test.beforeEach(async ({ page, request }) => {
    await setupMSW(page);
    apiHelper = new ReminderEmailApiHelper(page, request);

    // ページコンテキストにメール送信履歴を初期化
    await page.goto('/');
    await apiHelper.resetEmailHistory();
  });

  /**
   * Scenario: 翌日に予約がある顧客にリマインダーメールが送信される
   */
  test('should send reminder email to customer with tomorrow reservation', async () => {
    // Given: 翌日18:00に予約がある顧客「山田太郎」が存在する
    await apiHelper.createTomorrowReservation({
      name: '山田太郎',
      email: 'yamada@example.com',
      menuName: 'カット＋カラー',
      time: '18:00',
    });

    // When: リマインダーメール送信Cron Jobが実行される
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: 「yamada@example.com」宛にリマインダーメールが送信される
    await apiHelper.expectEmailSent('yamada@example.com');

    // And: メール件名は「【予約リマインダー】明日のご予約について」である
    await apiHelper.expectEmailSubject('【予約リマインダー】明日のご予約について');

    // And: メール本文に「山田太郎 様」が含まれる
    await apiHelper.expectEmailBodyContains('yamada@example.com', '山田太郎 様');

    // And: メール本文に予約メニュー「カット＋カラー」が含まれる
    await apiHelper.expectEmailBodyContains('yamada@example.com', 'カット＋カラー');
  });

  /**
   * Scenario: 複数の顧客に一括送信される
   */
  test('should send reminder emails to multiple customers', async () => {
    // Given: 翌日に予約がある顧客が3人存在する
    await apiHelper.createTomorrowReservation({
      name: '山田太郎',
      email: 'yamada@example.com',
      menuName: 'カット',
      time: '10:00',
    });

    await apiHelper.createTomorrowReservation({
      name: '佐藤花子',
      email: 'sato@example.com',
      menuName: 'カラー',
      time: '14:00',
    });

    await apiHelper.createTomorrowReservation({
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      menuName: 'パーマ',
      time: '16:00',
    });

    // When: リマインダーメール送信Cron Jobが実行される
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: 3通のリマインダーメールが送信される
    await apiHelper.expectTotalEmailsSent(3);
    await apiHelper.expectSentCount(response, 3);

    // And: すべての予約に「リマインダー送信済み」フラグが立つ
    await apiHelper.expectSuccessCount(response, 3);
    await apiHelper.expectFailureCount(response, 0);
  });

  /**
   * Scenario: すでにリマインダー送信済みの予約はスキップされる
   */
  test('should skip already-sent reminders', async () => {
    // Given: 翌日に予約がある顧客「佐藤花子」が存在する
    // And: その予約はすでに「リマインダー送信済み」である
    await apiHelper.createReminderSentReservation({
      name: '佐藤花子',
      email: 'sato@example.com',
    });

    // When: リマインダーメール送信Cron Jobが実行される
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: 送信されたメール数は0件である
    await apiHelper.expectTotalEmailsSent(0);
    await apiHelper.expectSentCount(response, 0);
  });

  /**
   * Scenario: キャンセル済みの予約にはリマインダーが送信されない
   */
  test('should not send reminder for cancelled reservations', async () => {
    // Given: 翌日に予約があったが「キャンセル済み」の予約が存在する
    await apiHelper.createCancelledReservation({
      name: '山田太郎',
      email: 'yamada@example.com',
    });

    // When: リマインダーメール送信Cron Jobが実行される
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: メールは送信されない
    await apiHelper.expectTotalEmailsSent(0);

    // And: 送信されたメール数は0件である
    await apiHelper.expectSentCount(response, 0);
  });

  /**
   * Scenario: リマインダーメールに必要な情報がすべて含まれる
   */
  test('should include all required information in reminder email', async () => {
    // Given: 翌日10:00に予約がある顧客「鈴木一郎」が存在する
    await apiHelper.createTomorrowReservation({
      name: '鈴木一郎',
      email: 'suzuki@example.com',
      menuName: 'シャンプー＋ブロー',
      time: '10:00',
      staffName: '田中美容師',
    });

    // When: リマインダーメール送信Cron Jobが実行される
    await apiHelper.sendReminders('test-cron-token');

    // Then: 送信されたメールに以下の情報が含まれる
    await apiHelper.expectEmailSent('suzuki@example.com');

    // 顧客名
    await apiHelper.expectEmailBodyContains('suzuki@example.com', '鈴木一郎 様');

    // メニュー
    await apiHelper.expectEmailBodyContains('suzuki@example.com', 'シャンプー＋ブロー');

    // 担当スタッフ
    await apiHelper.expectEmailBodyContains('suzuki@example.com', '田中美容師');

    // キャンセル方法
    await apiHelper.expectEmailBodyContains('suzuki@example.com', 'マイページからキャンセル可能');
  });

  /**
   * Scenario: リマインダーメール送信APIが正常に動作する
   */
  test('should return correct API response with statistics', async () => {
    // Given: 翌日に予約がある顧客が5人存在する
    for (let i = 1; i <= 5; i++) {
      await apiHelper.createTomorrowReservation({
        name: `顧客${i}`,
        email: `customer${i}@example.com`,
        menuName: 'カット',
        time: '10:00',
      });
    }

    // When: "/api/cron/send-reminders" APIにGETリクエストを送信する
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: レスポンスボディに「送信件数: 5」が含まれる
    await apiHelper.expectSentCount(response, 5);

    // And: レスポンスボディに「成功: 5」が含まれる
    await apiHelper.expectSuccessCount(response, 5);

    // And: レスポンスボディに「失敗: 0」が含まれる
    await apiHelper.expectFailureCount(response, 0);
  });

  /**
   * Scenario: メール送信エラー時も処理が継続される
   * 注: このテストはMSWでメール送信エラーをモックする必要があります
   */
  test.skip('should continue processing even if some emails fail', async () => {
    // Given: 翌日に予約がある顧客が3人存在する
    await apiHelper.createTomorrowReservation({
      name: '顧客1',
      email: 'customer1@example.com',
      menuName: 'カット',
      time: '10:00',
    });

    // And: 2人目の顧客のメールアドレスが無効である
    await apiHelper.createTomorrowReservation({
      name: '顧客2',
      email: 'invalid-email',
      menuName: 'カット',
      time: '11:00',
    });

    await apiHelper.createTomorrowReservation({
      name: '顧客3',
      email: 'customer3@example.com',
      menuName: 'カット',
      time: '12:00',
    });

    // When: "/api/cron/send-reminders" APIにGETリクエストを送信する
    const response = await apiHelper.sendReminders('test-cron-token');

    // Then: HTTPステータスコード200が返される
    await apiHelper.expectStatusCode(response, 200);

    // And: レスポンスボディに「送信件数: 3」が含まれる
    await apiHelper.expectSentCount(response, 3);

    // And: レスポンスボディに「成功: 2」が含まれる
    await apiHelper.expectSuccessCount(response, 2);

    // And: レスポンスボディに「失敗: 1」が含まれる
    await apiHelper.expectFailureCount(response, 1);

    // And: 有効なメールアドレスの顧客2人にはメールが送信される
    await apiHelper.expectEmailSent('customer1@example.com');
    await apiHelper.expectEmailSent('customer3@example.com');
  });

  /**
   * Scenario: 認証トークンなしではAPIにアクセスできない
   */
  test('should return 401 without authentication token', async () => {
    // When: "/api/cron/send-reminders" APIに認証トークンなしでGETリクエストを送信する
    const response = await apiHelper.sendReminders(); // トークンなし

    // Then: HTTPステータスコード401が返される
    await apiHelper.expectStatusCode(response, 401);

    // And: レスポンスボディに「Unauthorized」が含まれる
    await apiHelper.expectResponseContains(response, 'Unauthorized');

    // And: メールは送信されない
    await apiHelper.expectTotalEmailsSent(0);
  });
});
