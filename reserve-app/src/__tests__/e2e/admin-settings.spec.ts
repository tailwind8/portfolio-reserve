import { test, expect } from '@playwright/test';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: 店舗設定管理
 * Issue: #24
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to manage store settings
 * So that I can control business hours, holidays, and reservation slots
 *
 * Gherkinシナリオ: features/admin-settings.feature
 */

test.describe('店舗設定管理 (#24)', () => {
  let settingsPage: AdminSettingsPage;

  test.beforeEach(async ({ page }) => {
    // MSW API モックをセットアップ
    await setupMSW(page);

    settingsPage = new AdminSettingsPage(page);
    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要で店舗設定ページに直接アクセス
    await settingsPage.goto();
  });

  /**
   * Scenario: 店舗設定ページにアクセスする
   *   Given 管理者として認証済みである
   *   When 店舗設定ページ「/admin/settings」にアクセスする
   *   Then ページタイトルに「店舗設定」が表示される
   *   And 店舗基本情報セクションが表示される
   *   And 営業時間設定セクションが表示される
   *   And 定休日設定セクションが表示される
   *   And 予約枠設定セクションが表示される
   */
  test('店舗設定ページにアクセスする', async () => {
    // Then: ページタイトルが表示される
    await settingsPage.expectPageTitle('店舗設定');

    // And: 各セクションが表示される
    await settingsPage.expectStoreInfoSectionVisible();
    await settingsPage.expectBusinessHoursSectionVisible();
    await settingsPage.expectClosedDaysSectionVisible();
    await settingsPage.expectSystemPublicSectionVisible();
    await settingsPage.expectSlotDurationSectionVisible();
  });

  /**
   * Scenario: 現在の店舗基本情報が表示される
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 店舗名入力フィールドに現在の店舗名が表示される
   *   And メールアドレス入力フィールドに現在のメールアドレスが表示される
   *   And 電話番号入力フィールドに現在の電話番号が表示される
   */
  test('現在の店舗基本情報が表示される', async () => {
    // Then: 店舗名が表示される
    const storeName = await settingsPage.getStoreName();
    expect(storeName).toBeTruthy();

    // And: メールアドレスが表示される
    const storeEmail = await settingsPage.getStoreEmail();
    expect(storeEmail).toBeTruthy();

    // And: 電話番号が表示される
    const storePhone = await settingsPage.getStorePhone();
    expect(storePhone).toBeTruthy();
  });

  /**
   * Scenario: 店舗基本情報を更新できる
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 店舗名を「テストサロン」に変更する
   *   And メールアドレスを「test@example.com」に変更する
   *   And 電話番号を「03-1234-5678」に変更する
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And 店舗名が「テストサロン」に更新される
   */
  test('店舗基本情報を更新できる', async () => {
    // When: 店舗基本情報を変更
    await settingsPage.fillStoreName('テストサロン');
    await settingsPage.fillStoreEmail('test@example.com');
    await settingsPage.fillStorePhone('03-1234-5678');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectStoreName('テストサロン');
    await settingsPage.expectStoreEmail('test@example.com');
    await settingsPage.expectStorePhone('03-1234-5678');
  });

  /**
   * Scenario: 現在の営業時間が表示される
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 開店時刻に現在の値が表示される
   *   And 閉店時刻に現在の値が表示される
   */
  test('現在の営業時間が表示される', async () => {
    // Then: 開店時刻が表示される
    const openTime = await settingsPage.getOpenTime();
    expect(openTime).toBeTruthy();

    // And: 閉店時刻が表示される
    const closeTime = await settingsPage.getCloseTime();
    expect(closeTime).toBeTruthy();
  });

  /**
   * Scenario: 営業時間を更新できる
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 開店時刻を「10:00」に変更する
   *   And 閉店時刻を「22:00」に変更する
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And 開店時刻が「10:00」に更新される
   *   And 閉店時刻が「22:00」に更新される
   */
  test('営業時間を更新できる', async () => {
    // When: 営業時間を変更
    await settingsPage.fillOpenTime('10:00');
    await settingsPage.fillCloseTime('22:00');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectOpenTime('10:00');
    await settingsPage.expectCloseTime('22:00');
  });

  /**
   * Scenario: 定休日を追加できる
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 「月曜日」のチェックボックスをチェックする
   *   And 「火曜日」のチェックボックスをチェックする
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And 定休日が更新される
   */
  test('定休日を追加できる', async () => {
    // When: 定休日をチェック
    await settingsPage.checkClosedDay('MONDAY');
    await settingsPage.checkClosedDay('TUESDAY');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: チェックボックスがチェックされたまま
    await settingsPage.expectClosedDayChecked('MONDAY');
    await settingsPage.expectClosedDayChecked('TUESDAY');
  });

  /**
   * Scenario: 定休日を解除できる
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   And 定休日が「月曜日」に設定されている
   *   When 「月曜日」のチェックボックスのチェックを外す
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And 定休日が解除される
   */
  test('定休日を解除できる', async () => {
    // Given: 月曜日をチェック
    await settingsPage.checkClosedDay('MONDAY');
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: チェックを外す
    await settingsPage.uncheckClosedDay('MONDAY');
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: チェックボックスがチェックされていない
    await settingsPage.expectClosedDayUnchecked('MONDAY');
  });

  /**
   * Scenario: 予約枠間隔を変更できる
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 予約枠間隔を「60分」に変更する
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And 予約枠間隔が「60分」に更新される
   */
  test('予約枠間隔を変更できる', async () => {
    // When: 予約枠間隔を変更
    await settingsPage.selectSlotDuration('60');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectSlotDuration('60');
  });

  /**
   * Scenario: 店舗名が必須である
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 店舗名を空にする
   *   And 保存ボタンをクリックする
   *   Then 「店舗名は必須です」というバリデーションエラーが表示される
   */
  test('店舗名が必須である', async () => {
    // When: 店舗名を空にする
    await settingsPage.fillStoreName('');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: バリデーションエラーが表示される
    await settingsPage.expectValidationError('店舗名は必須です');
  });

  /**
   * Scenario: メールアドレスのフォーマットが検証される
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When メールアドレスを「invalid-email」に変更する
   *   And 保存ボタンをクリックする
   *   Then 「有効なメールアドレスを入力してください」というバリデーションエラーが表示される
   */
  test('メールアドレスのフォーマットが検証される', async () => {
    // When: 無効なメールアドレスを入力
    await settingsPage.fillStoreEmail('invalid-email');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: バリデーションエラーが表示される
    await settingsPage.expectValidationError('有効なメールアドレスを入力してください');
  });

  /**
   * Scenario: 開店時刻が閉店時刻より前である必要がある
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   When 開店時刻を「20:00」に変更する
   *   And 閉店時刻を「10:00」に変更する
   *   And 保存ボタンをクリックする
   *   Then 「開店時刻は閉店時刻より前である必要があります」というバリデーションエラーが表示される
   */
  test('開店時刻が閉店時刻より前である必要がある', async () => {
    // When: 開店時刻を閉店時刻より後に設定
    await settingsPage.fillOpenTime('20:00');
    await settingsPage.fillCloseTime('10:00');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: バリデーションエラーが表示される
    await settingsPage.expectValidationError('開店時刻は閉店時刻より前である必要があります');
  });

  /**
   * Scenario: ページをリロードしても設定が保持される
   *   Given 管理者として認証済みである
   *   And 店舗設定ページにアクセスしている
   *   And 店舗名を「永続化テスト」に変更して保存した
   *   When ページをリロードする
   *   Then 店舗名が「永続化テスト」のまま表示される
   */
  test('ページをリロードしても設定が保持される', async () => {
    // Given: 店舗名を変更して保存
    await settingsPage.fillStoreName('永続化テスト');
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: ページをリロード
    await settingsPage.reload();

    // Then: 店舗名が保持されている
    await settingsPage.expectStoreName('永続化テスト');
  });
});
