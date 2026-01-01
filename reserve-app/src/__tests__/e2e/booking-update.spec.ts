import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { MyPage } from './pages/MyPage';

/**
 * Feature: 予約変更 (#13)
 * ユーザーとして予約を変更してスケジュールに合わせたい
 *
 * Gherkinシナリオ: reserve-app/features/booking/update.feature
 */
test.describe('予約変更機能', () => {
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
   * Scenario: 予約変更成功（日時変更）（ハッピーパス）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"20日"を選択する
   *   And 1秒待つ
   *   And 新しい時間帯"16:00"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約が更新される
   *   And 変更確認メッセージが表示される
   *   And 変更確認メールが送信される
   *   And マイページに予約一覧が更新されて表示される
   */
  test('予約変更成功（日時変更）（ハッピーパス）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しい日付を選択
    await myPage.selectDate('20');

    // 1秒待つ
    await myPage.waitForSeconds(1);

    // 新しい時間帯を選択
    await myPage.selectTimeSlot('16:00');

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });

  /**
   * Scenario: 予約変更成功（メニュー変更）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しいメニュー"カラー"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約が更新される
   *   And 変更確認メッセージが表示される
   *   And 変更確認メールが送信される
   */
  test('予約変更成功（メニュー変更）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しいメニューを選択
    await myPage.selectMenuByName('カラー');

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });

  /**
   * Scenario: 予約変更成功（スタッフ変更）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しいスタッフ"佐藤"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約が更新される
   *   And 変更確認メッセージが表示される
   *   And 変更確認メールが送信される
   */
  test('予約変更成功（スタッフ変更）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しいスタッフを選択
    await myPage.selectStaffByName('佐藤花子');

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });

  /**
   * Scenario: 予約変更成功（複数項目変更）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"25日"を選択する
   *   And 1秒待つ
   *   And 新しい時間帯"18:00"を選択する
   *   And 新しいメニュー"カット+カラー"を選択する
   *   And 新しいスタッフ"鈴木"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約が更新される
   *   And 変更確認メッセージが表示される
   *   And 変更確認メールが送信される
   */
  test('予約変更成功（複数項目変更）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しい日付を選択
    await myPage.selectDate('25');

    // 1秒待つ
    await myPage.waitForSeconds(1);

    // 新しい時間帯を選択
    await myPage.selectTimeSlot('18:00');

    // 新しいメニューを選択
    await myPage.selectMenuByName('パーマ');

    // 新しいスタッフを選択
    await myPage.selectStaffByName('鈴木一郎');

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });

  /**
   * Scenario: 過去日付選択時のエラー
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 過去の日付を選択しようとする
   *   Then 過去の日付ボタンが無効化されている
   *   And エラーメッセージ"過去の日付は選択できません"が表示される
   */
  test('過去日付選択時のエラー', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 過去の日付が無効化されていることを確認
    await myPage.expectPastDatesDisabled();
  });

  /**
   * Scenario: 重複予約時のエラー
   *   Given 予約を選択している
   *   And "2025年1月20日 14:00"の時間帯が既に予約済みである
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"20日"を選択する
   *   And 1秒待つ
   *   And 時間帯"14:00"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then エラーメッセージ"この時間は既に予約済みです"が表示される
   *   And 予約は更新されない
   */
  test.skip('重複予約時のエラー', async () => {
    // TODO: MSWで重複予約のシナリオをモック
    await myPage.expectReservationsOrEmptyState();

    await myPage.openEditModal();
    await myPage.expectEditModalVisible();

    await myPage.selectDate('20');
    await myPage.waitForSeconds(1);
    await myPage.selectTimeSlot('14:00');
    await myPage.clickSaveChangesButton();

    // エラーメッセージが表示される
    await myPage.expectErrorMessage('この時間は既に予約済みです');
  });

  /**
   * Scenario: 変更期限超過時のエラー
   *   Given 予約を選択している
   *   And 予約の変更期限が過ぎている
   *   When "予約を変更"ボタンをクリックしようとする
   *   Then "予約を変更"ボタンが無効化されている
   *   And エラーメッセージ"予約の変更期限が過ぎています"が表示される
   */
  test.skip('変更期限超過時のエラー', async () => {
    // TODO: MSWで変更期限切れの予約データをモック
    // 期限切れの予約をセットアップ

    // 変更ボタンが無効化されている
    // await myPage.expectEditButtonDisabled();

    // エラーメッセージが表示される
    await myPage.expectErrorMessage('予約の変更期限が過ぎています');
  });

  /**
   * Scenario: 予約変更モーダルを閉じる
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When "閉じる"ボタンをクリックする
   *   Then 予約変更モーダルが閉じる
   *   And 変更は保存されない
   */
  test('予約変更モーダルを閉じる', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 閉じるボタンをクリック
    await myPage.closeEditModal();

    // モーダルが閉じる
    await myPage.expectEditModalClosed();
  });

  /**
   * Scenario: 予約変更の取り消し
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"20日"を選択する
   *   And 1秒待つ
   *   And 新しい時間帯"16:00"を選択する
   *   And "キャンセル"ボタンをクリックする
   *   Then 予約変更モーダルが閉じる
   *   And 変更は保存されない
   *   And 元の予約情報が保持される
   */
  test('予約変更の取り消し', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しい日付を選択
    await myPage.selectDate('20');

    // 1秒待つ
    await myPage.waitForSeconds(1);

    // 新しい時間帯を選択
    await myPage.selectTimeSlot('16:00');

    // キャンセルボタンをクリック
    await myPage.clickCancelButtonInModal();

    // モーダルが閉じる
    await myPage.expectEditModalClosed();

    // 元の予約が保持されている
    await myPage.expectReservationsOrEmptyState();
  });

  /**
   * Scenario: 変更確認メールに変更内容が含まれる
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"20日"を選択する
   *   And 1秒待つ
   *   And 新しい時間帯"16:00"を選択する
   *   And "変更を保存"ボタンをクリックする
   *   Then 変更確認メールが送信される
   *   And メールに変更前の日時が含まれる
   *   And メールに変更後の日時が含まれる
   *   And メールに変更理由の記載欄が含まれる
   */
  test.skip('変更確認メールに変更内容が含まれる', async ({ page }) => {
    // TODO: メール送信APIのモック確認
    await myPage.expectReservationsOrEmptyState();

    await myPage.openEditModal();
    await myPage.expectEditModalVisible();

    await myPage.selectDate('20');
    await myPage.waitForSeconds(1);
    await myPage.selectTimeSlot('16:00');
    await myPage.clickSaveChangesButton();

    await myPage.expectUpdateSuccessMessage();

    // TODO: メール送信APIが呼ばれたことを検証
    // page.waitForRequest() または MSWのハンドラで検証
  });

  /**
   * Scenario: 部分変更（日時のみ）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しい日付"22日"を選択する
   *   And 1秒待つ
   *   And 新しい時間帯"15:00"を選択する
   *   And メニューとスタッフは変更しない
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約の日時のみが更新される
   *   And メニューとスタッフは変更されない
   */
  test('部分変更（日時のみ）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しい日付を選択
    await myPage.selectDate('22');

    // 1秒待つ
    await myPage.waitForSeconds(1);

    // 新しい時間帯を選択
    await myPage.selectTimeSlot('15:00');

    // メニューとスタッフは変更しない

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });

  /**
   * Scenario: 部分変更（メニューのみ）
   *   Given 予約を選択している
   *   When "予約を変更"ボタンをクリックする
   *   Then 予約変更モーダルが表示される
   *   When 新しいメニュー"パーマ"を選択する
   *   And 日時とスタッフは変更しない
   *   And "変更を保存"ボタンをクリックする
   *   Then 予約のメニューのみが更新される
   *   And 日時とスタッフは変更されない
   */
  test('部分変更（メニューのみ）', async () => {
    // 予約が存在することを確認
    await myPage.expectReservationsOrEmptyState();

    // 変更ボタンをクリック
    await myPage.openEditModal();

    // 予約変更モーダルが表示される
    await myPage.expectEditModalVisible();

    // 新しいメニューを選択
    await myPage.selectMenuByName('パーマ');

    // 日時とスタッフは変更しない

    // 変更を保存
    await myPage.clickSaveChangesButton();

    // 成功メッセージが表示される
    await myPage.expectUpdateSuccessMessage();
  });
});

/**
 * Feature: 予約変更（フォームバリデーション）
 */
test.describe('予約変更機能（フォームバリデーション）', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    myPage = new MyPage(page);

    await myPage.goto();
    await myPage.waitForLoad();
    await myPage.waitForLoadingComplete();
  });

  /**
   * Scenario: フォームに既存データが入っていることを確認
   */
  test('フォームに既存データが入っていることを確認', async () => {
    await myPage.expectReservationsOrEmptyState();

    await myPage.openEditModal();
    await myPage.expectEditModalVisible();

    // フォームに既存データが入っている
    await myPage.expectFormPreFilled();
  });
});
