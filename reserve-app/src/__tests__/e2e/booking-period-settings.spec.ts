import { test, expect } from '@playwright/test';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: 予約受付期間の設定
 * Issue: #79
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to configure booking period settings
 * So that I can control when customers can make reservations
 *
 * Gherkinシナリオ: features/booking-period-settings.feature
 */

test.describe('予約受付期間の設定 (#79)', () => {
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
   * Scenario: 予約受付期間を設定できる
   *   Given 管理者としてログインしている
   *   And 店舗設定が存在する
   *   And 店舗設定ページにアクセスしている
   *   When 「最短予約日数」に"1"を入力する
   *   And 「最長予約日数」に"30"を入力する
   *   And "保存"ボタンをクリックする
   *   Then 「設定を保存しました」というメッセージが表示される
   *   And データベースの設定が更新されている
   */
  test('予約受付期間を設定できる', async () => {
    // Given: 予約受付期間セクションが表示される
    await settingsPage.expectBookingPeriodSectionVisible();

    // When: 最短予約日数を入力
    await settingsPage.fillMinAdvanceBookingDays('1');

    // And: 最長予約日数を入力
    await settingsPage.fillMaxAdvanceBookingDays('30');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectMinAdvanceBookingDays('1');
    await settingsPage.expectMaxAdvanceBookingDays('30');
  });

  /**
   * Scenario: 無効な設定値（min > max）を拒否する
   *   Given 店舗設定ページにアクセスしている
   *   When 「最短予約日数」に"30"を入力する
   *   And 「最長予約日数」に"10"を入力する
   *   And "保存"ボタンをクリックする
   *   Then バリデーションエラーが表示される
   *   And エラーメッセージに「最短予約日数は最長予約日数より小さい値を設定してください」と表示される
   */
  test('無効な設定値（min > max）を拒否する', async () => {
    // When: 最短予約日数 > 最長予約日数 を入力
    await settingsPage.fillMinAdvanceBookingDays('30');
    await settingsPage.fillMaxAdvanceBookingDays('10');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: バリデーションエラーが表示される
    await settingsPage.expectValidationError(
      '最短予約日数は最長予約日数より小さい値を設定してください'
    );
  });

  /**
   * Scenario: デフォルト値が正しく設定されている
   *   Given 新規に店舗設定を作成する
   *   Then 最短予約日数のデフォルト値が"0"である
   *   And 最長予約日数のデフォルト値が"90"である
   */
  test('デフォルト値が正しく設定されている', async () => {
    // Then: デフォルト値が表示される
    await settingsPage.expectMinAdvanceBookingDays('0');
    await settingsPage.expectMaxAdvanceBookingDays('90');
  });

  /**
   * Scenario: 負の値を拒否する
   *   Given 店舗設定ページにアクセスしている
   *   When 「最短予約日数」に"-1"を入力する
   *   And "保存"ボタンをクリックする
   *   Then バリデーションエラーが表示される
   */
  test('負の値を拒否する', async () => {
    // When: 負の値を入力
    await settingsPage.fillMinAdvanceBookingDays('-1');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: バリデーションエラーが表示される
    await settingsPage.expectValidationError('0以上の値を入力してください');
  });

  /**
   * Scenario: 予約受付期間設定のフィールドが表示される
   *   Given 管理者として認証済みである
   *   When 店舗設定ページ「/admin/settings」にアクセスする
   *   Then 予約受付期間設定セクションが表示される
   *   And 「最短予約日数」入力フィールドが表示される
   *   And 「最長予約日数」入力フィールドが表示される
   */
  test('予約受付期間設定のフィールドが表示される', async () => {
    // Then: 予約受付期間セクションが表示される
    await settingsPage.expectBookingPeriodSectionVisible();

    // And: 最短予約日数フィールドが存在する
    const minDays = await settingsPage.getMinAdvanceBookingDays();
    expect(minDays).toBeDefined();

    // And: 最長予約日数フィールドが存在する
    const maxDays = await settingsPage.getMaxAdvanceBookingDays();
    expect(maxDays).toBeDefined();
  });

  /**
   * Scenario: 最短予約日数のみを変更できる
   *   Given 店舗設定ページにアクセスしている
   *   When 「最短予約日数」に"3"を入力する
   *   And "保存"ボタンをクリックする
   *   Then 「設定を保存しました」というメッセージが表示される
   *   And 最短予約日数が"3"に更新される
   */
  test('最短予約日数のみを変更できる', async () => {
    // When: 最短予約日数のみを変更
    await settingsPage.fillMinAdvanceBookingDays('3');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectMinAdvanceBookingDays('3');
  });

  /**
   * Scenario: 最長予約日数のみを変更できる
   *   Given 店舗設定ページにアクセスしている
   *   When 「最長予約日数」に"60"を入力する
   *   And "保存"ボタンをクリックする
   *   Then 「設定を保存しました」というメッセージが表示される
   *   And 最長予約日数が"60"に更新される
   */
  test('最長予約日数のみを変更できる', async () => {
    // When: 最長予約日数のみを変更
    await settingsPage.fillMaxAdvanceBookingDays('60');

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: 値が更新される
    await settingsPage.expectMaxAdvanceBookingDays('60');
  });
});
