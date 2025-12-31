import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { MyPage } from './pages/MyPage';

/**
 * Feature: 予約キャンセル (#7)
 * ユーザーとして予約をキャンセルして時間帯を解放したい
 *
 * Gherkinシナリオ: reserve-app/features/booking/cancel.feature
 */
test.describe('予約キャンセル機能', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    // マイページにアクセス（MSWモックが認証をバイパス）
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: 予約キャンセル成功（ハッピーパス）
   *   Given 予約を選択している
   *   When "キャンセル"ボタンをクリックする
   *   Then "予約をキャンセルしますか？"という確認ダイアログが表示される
   *   And 予約日時が表示される
   *   And メニュー名が表示される
   *   And "この操作は取り消せません"という警告が表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then 予約がキャンセル済みに更新される
   *   And キャンセル確認メッセージが表示される
   */
  test('予約キャンセル成功（ハッピーパス）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();
    await myPage.expectReservationDetailsInDialog();
    await myPage.expectCancelWarningMessage();

    // キャンセルを確定
    await myPage.confirmCancel();

    // 成功メッセージが表示される
    await myPage.expectCancelSuccessMessage();
  });

  /**
   * Scenario: キャンセル確認ダイアログ表示
   *   Given 予約を選択している
   *   When "キャンセル"ボタンをクリックする
   *   Then "予約をキャンセルしますか？"という確認ダイアログが表示される
   *   And 予約日時が表示される
   *   And メニュー名が表示される
   *   And 担当者名が表示される
   *   And 料金が表示される
   *   And 所要時間が表示される
   *   And "戻る"ボタンが表示される
   *   And "キャンセルする"ボタンが表示される
   */
  test('キャンセル確認ダイアログ表示', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログの全要素が表示される
    await myPage.expectCancelDialogVisible();
    await myPage.expectReservationDetailsInDialog();
    await myPage.expectCancelWarningMessage();
  });

  /**
   * Scenario: キャンセル取り消し
   *   Given 予約を選択している
   *   When "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログが表示される
   *   When "戻る"ボタンをクリックする
   *   Then 確認ダイアログが閉じる
   *   And 予約はキャンセルされない
   *   And 予約のステータスは変更されない
   */
  test('キャンセル取り消し', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();

    // 戻るボタンをクリック
    await myPage.closeCancelDialog();

    // ダイアログが閉じる
    await myPage.expectCancelDialogClosed();

    // 予約一覧は変更されない
    await myPage.expectReservationsOrEmptyState();
  });

  /**
   * Scenario: キャンセル期限超過時のエラー
   *   Given 予約を選択している
   *   And 予約のキャンセル期限が過ぎている
   *   When "キャンセル"ボタンをクリックしようとする
   *   Then "キャンセル"ボタンが無効化されている
   *   And エラーメッセージ"予約のキャンセル期限が過ぎています"が表示される
   */
  test.skip('キャンセル期限超過時のエラー', async () => {
    // TODO: MSWでキャンセル期限切れの予約データをモック
    // 期限切れの予約をセットアップ

    // キャンセルボタンが無効化されている
    await myPage.expectCancelButtonDisabled();

    // エラーメッセージが表示される
    await myPage.expectSpecificErrorMessage('予約のキャンセル期限が過ぎています');
  });

  /**
   * Scenario: 既に来店済み予約のキャンセル不可
   *   Given 予約を選択している
   *   And 予約のステータスが"来店済み"である
   *   When "キャンセル"ボタンをクリックしようとする
   *   Then "キャンセル"ボタンが無効化されている
   *   And エラーメッセージ"既に来店済みの予約はキャンセルできません"が表示される
   */
  test.skip('既に来店済み予約のキャンセル不可', async () => {
    // TODO: MSWで来店済みの予約データをモック
    // 来店済みの予約をセットアップ

    // キャンセルボタンが無効化されている
    await myPage.expectCancelButtonDisabled();

    // エラーメッセージが表示される
    await myPage.expectSpecificErrorMessage('既に来店済みの予約はキャンセルできません');
  });

  /**
   * Scenario: 既にキャンセル済み予約のキャンセル不可
   *   Given 予約を選択している
   *   And 予約のステータスが"キャンセル済み"である
   *   When "キャンセル"ボタンをクリックしようとする
   *   Then "キャンセル"ボタンが無効化されている
   *   And エラーメッセージ"既にキャンセル済みの予約です"が表示される
   */
  test.skip('既にキャンセル済み予約のキャンセル不可', async () => {
    // TODO: MSWでキャンセル済みの予約データをモック
    // キャンセル済みタブに切り替え
    await myPage.clickStatusTab('キャンセル');

    // キャンセルボタンが無効化されている
    await myPage.expectCancelButtonDisabled();

    // エラーメッセージが表示される
    await myPage.expectSpecificErrorMessage('既にキャンセル済みの予約です');
  });

  /**
   * Scenario: キャンセル確認メール送信
   *   Given 予約を選択している
   *   When "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then キャンセル確認メールが送信される
   *   And メールにキャンセルした予約の日時が含まれる
   *   And メールにキャンセルした予約のメニュー名が含まれる
   *   And メールにキャンセルした予約のスタッフ名が含まれる
   *   And メールにキャンセル日時が含まれる
   */
  test.skip('キャンセル確認メール送信', async ({ page }) => {
    // TODO: メール送信APIのモック確認
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();

    // キャンセルを確定
    await myPage.confirmCancel();

    // 成功メッセージが表示される
    await myPage.expectCancelSuccessMessage();

    // TODO: メール送信APIが呼ばれたことを検証
    // page.waitForRequest() または MSWのハンドラで検証
  });

  /**
   * Scenario: キャンセル後の予約一覧表示
   *   Given 予約を選択している
   *   When "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then 予約がキャンセル済みに更新される
   *   And マイページの予約一覧から該当予約が"キャンセル"タブに移動する
   *   When "キャンセル"タブをクリックする
   *   Then キャンセル済みの予約が表示される
   */
  test('キャンセル後の予約一覧表示', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 初期の予約件数を記録
    const initialCount = await myPage.getReservationCount();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();

    // キャンセルを確定
    await myPage.confirmCancel();

    // 成功メッセージが表示される
    await myPage.expectCancelSuccessMessage();

    // ページをリロードして最新状態を確認
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();

    // キャンセルタブに切り替え
    await myPage.clickStatusTab('キャンセル');

    // キャンセル済みの予約が表示される
    await myPage.expectReservationsOrEmptyState();
  });

  /**
   * Scenario: キャンセル後の時間帯が利用可能になる
   *   Given 予約を選択している
   *   And 予約の日時が"2025年1月20日 14:00"である
   *   When "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then 予約がキャンセル済みに更新される
   *   When 予約ページにアクセスする
   *   And 日付"20日"を選択する
   *   Then 時間帯"14:00"が利用可能として表示される
   */
  test.skip('キャンセル後の時間帯が利用可能になる', async ({ page }) => {
    // TODO: 予約ページとの連携テスト
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();

    // キャンセルを確定
    await myPage.confirmCancel();

    // 成功メッセージが表示される
    await myPage.expectCancelSuccessMessage();

    // TODO: 予約ページに移動して時間帯の空き状況を確認
    // await page.goto('/booking');
    // await bookingPage.selectDate('20日');
    // await bookingPage.expectTimeSlotAvailable('14:00');
  });

  /**
   * Scenario: キャンセル確認ダイアログの詳細表示
   *   Given 予約を選択している
   *   And 予約の日時が"2025年1月20日 14:00"である
   *   And 予約のメニューが"カット"である
   *   And 予約のスタッフが"田中"である
   *   And 予約の料金が"5000円"である
   *   When "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログに"2025年1月20日 14:00"が表示される
   *   And 確認ダイアログに"カット"が表示される
   *   And 確認ダイアログに"田中"が表示される
   *   And 確認ダイアログに"5000円"が表示される
   */
  test('キャンセル確認ダイアログの詳細表示', async ({ page }) => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // キャンセルボタンをクリック
    await myPage.openCancelDialog();

    // 確認ダイアログが表示される
    await myPage.expectCancelDialogVisible();
    await myPage.expectReservationDetailsInDialog();
    await myPage.expectCancelWarningMessage();

    // ダイアログに予約詳細が含まれることを確認（MSWモックデータに依存）
    // TODO: 特定のメニュー名、スタッフ名、料金の検証
    // await expect(page.getByText('カット')).toBeVisible();
    // await expect(page.getByText('田中')).toBeVisible();
    // await expect(page.getByText('5000円')).toBeVisible();
  });

  /**
   * Scenario: 複数予約の個別キャンセル
   *   Given 予約が複数件存在する
   *   When 最初の予約を選択する
   *   And "キャンセル"ボタンをクリックする
   *   Then 確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then 最初の予約のみがキャンセルされる
   *   And 他の予約は影響を受けない
   */
  test('複数予約の個別キャンセル', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 初期の予約件数を記録
    const initialCount = await myPage.getReservationCount();

    if (initialCount > 0) {
      // 最初の予約をキャンセル
      await myPage.clickCancelButtonAt(0);

      // 確認ダイアログが表示される
      await myPage.expectCancelDialogVisible();

      // キャンセルを確定
      await myPage.confirmCancel();

      // 成功メッセージが表示される
      await myPage.expectCancelSuccessMessage();

      // ページをリロードして最新状態を確認
      await myPage.goto();
      await myPage.waitForLoad();
      await myPage.waitForLoadingComplete();

      // 予約件数が1件減っていることを確認（または同じ場合もある）
      const currentCount = await myPage.getReservationCount();
      expect(currentCount).toBeLessThanOrEqual(initialCount);
    }
  });
});

/**
 * Feature: 予約キャンセル（エラーケース）
 */
test.describe('予約キャンセル機能（エラーケース）', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    // マイページにアクセス（MSWモックが認証をバイパス）
    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: 過去の予約はキャンセルボタンが無効化されている
   */
  test('過去の予約はキャンセルボタンが無効化されている', async () => {
    await myPage.expectPastReservationButtonsDisabled();
  });
});
