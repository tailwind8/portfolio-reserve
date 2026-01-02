import { test, expect } from '@playwright/test';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';

/**
 * Feature: スーパー管理者 - 機能フラグ管理
 * Issue: Phase 3, #95-98
 *
 * ユーザーストーリー:
 * As a super administrator
 * I want to manage feature flags for optional features
 * So that I can enable or disable features based on customer purchases
 *
 * Gherkinシナリオ: features/super-admin/feature-flags.feature
 */

test.describe('スーパー管理者 - 機能フラグ管理 (Phase 3)', () => {
  let featureFlagsPage: FeatureFlagsPage;

  test.beforeEach(async ({ page }) => {
    featureFlagsPage = new FeatureFlagsPage(page);
    // TODO: スーパー管理者ログイン処理を実装後に追加
    // 現在はログイン不要で直接アクセス
    await featureFlagsPage.goto();
  });

  /**
   * Scenario: 機能フラグ管理ページが正しく表示される
   *   Then ページタイトルに「機能フラグ管理」が表示される
   *   And ページ見出しに「機能フラグ管理」が表示される
   *   And テナント選択ドロップダウンが表示される
   *   And 10種類のオプション機能トグルスイッチが表示される
   *   And 「保存」ボタンが表示される
   */
  test('機能フラグ管理ページが正しく表示される', async ({ page }) => {
    // Then: ページタイトルを確認
    await expect(page).toHaveTitle(/機能フラグ管理/);

    // And: ページ見出しを確認
    await featureFlagsPage.expectHeading('機能フラグ管理');

    // And: テナント選択ドロップダウンが表示される
    await featureFlagsPage.expectTenantSelectVisible();

    // And: 10種類のオプション機能トグルスイッチが表示される
    await featureFlagsPage.expectAllFeaturesVisible();

    // And: 保存ボタンが表示される
    await featureFlagsPage.expectSaveButtonVisible();
  });

  /**
   * Scenario: デモテナントの初期状態が正しく表示される
   *   When テナント「demo-booking」を選択する
   *   Then 以下の機能フラグがONになっている
   */
  test('デモテナントの初期状態が正しく表示される', async () => {
    // When: テナント選択（デフォルトで選択されている想定）
    await featureFlagsPage.selectTenant('demo-booking');

    // Then: 実装済み機能がON
    await featureFlagsPage.expectFeatureEnabled('enableStaffSelection');
    await featureFlagsPage.expectFeatureEnabled('enableStaffShiftManagement');
    await featureFlagsPage.expectFeatureEnabled('enableCustomerManagement');
    await featureFlagsPage.expectFeatureEnabled('enableReminderEmail');
    await featureFlagsPage.expectFeatureEnabled('enableManualReservation');
    await featureFlagsPage.expectFeatureEnabled('enableAnalyticsReport');

    // And: 未実装機能がOFF
    await featureFlagsPage.expectFeatureDisabled('enableReservationUpdate');
    await featureFlagsPage.expectFeatureDisabled('enableRepeatRateAnalysis');
    await featureFlagsPage.expectFeatureDisabled('enableCouponFeature');
    await featureFlagsPage.expectFeatureDisabled('enableLineNotification');
  });

  /**
   * Scenario: 機能フラグをONにできる
   *   Given 「予約変更機能」がOFFの状態
   *   When 「予約変更機能」のトグルスイッチをクリックする
   *   Then 「予約変更機能」のトグルスイッチがONになる
   *   And 「保存」ボタンが有効化される
   */
  test('機能フラグをONにできる', async () => {
    // Given: 予約変更機能がOFFの状態を確認
    await featureFlagsPage.expectFeatureDisabled('enableReservationUpdate');

    // When: トグルスイッチをクリック
    await featureFlagsPage.toggleFeature('enableReservationUpdate');

    // Then: ONになる
    await featureFlagsPage.expectFeatureEnabled('enableReservationUpdate');

    // And: 保存ボタンが有効化される
    await featureFlagsPage.expectSaveButtonEnabled();
  });

  /**
   * Scenario: 機能フラグをOFFにできる
   *   Given 「スタッフ指名機能」がONの状態
   *   When 「スタッフ指名機能」のトグルスイッチをクリックする
   *   Then 「スタッフ指名機能」のトグルスイッチがOFFになる
   *   And 「保存」ボタンが有効化される
   */
  test('機能フラグをOFFにできる', async () => {
    // Given: スタッフ指名機能がONの状態を確認
    await featureFlagsPage.expectFeatureEnabled('enableStaffSelection');

    // When: トグルスイッチをクリック
    await featureFlagsPage.toggleFeature('enableStaffSelection');

    // Then: OFFになる
    await featureFlagsPage.expectFeatureDisabled('enableStaffSelection');

    // And: 保存ボタンが有効化される
    await featureFlagsPage.expectSaveButtonEnabled();
  });

  /**
   * Scenario: すべての機能フラグをONにできる
   *   When 「すべて有効化」ボタンをクリックする
   *   Then すべての機能フラグがONになる
   */
  test('すべての機能フラグをONにできる', async () => {
    // When: すべて有効化ボタンをクリック
    await featureFlagsPage.enableAll();

    // Then: すべての機能フラグがONになる
    const allFeatures = [
      'enableStaffSelection',
      'enableStaffShiftManagement',
      'enableCustomerManagement',
      'enableReservationUpdate',
      'enableReminderEmail',
      'enableManualReservation',
      'enableAnalyticsReport',
      'enableRepeatRateAnalysis',
      'enableCouponFeature',
      'enableLineNotification',
    ];

    for (const feature of allFeatures) {
      await featureFlagsPage.expectFeatureEnabled(feature);
    }
  });

  /**
   * Scenario: すべての機能フラグをOFFにできる
   *   When 「すべて無効化」ボタンをクリックする
   *   Then すべての機能フラグがOFFになる
   */
  test('すべての機能フラグをOFFにできる', async () => {
    // When: すべて無効化ボタンをクリック
    await featureFlagsPage.disableAll();

    // Then: すべての機能フラグがOFFになる
    const allFeatures = [
      'enableStaffSelection',
      'enableStaffShiftManagement',
      'enableCustomerManagement',
      'enableReservationUpdate',
      'enableReminderEmail',
      'enableManualReservation',
      'enableAnalyticsReport',
      'enableRepeatRateAnalysis',
      'enableCouponFeature',
      'enableLineNotification',
    ];

    for (const feature of allFeatures) {
      await featureFlagsPage.expectFeatureDisabled(feature);
    }
  });

  /**
   * Scenario: 機能フラグの変更を保存できる（ハッピーパス）
   *   Given 「予約変更機能」をONにする
   *   When 「保存」ボタンをクリックする
   *   Then 成功メッセージ「機能フラグを更新しました」が表示される
   */
  test.skip('機能フラグの変更を保存できる', async () => {
    // TODO: API実装後に有効化
    // Given: 予約変更機能をONにする
    await featureFlagsPage.enableFeature('enableReservationUpdate');

    // When: 保存ボタンをクリック
    await featureFlagsPage.save();

    // Then: 成功メッセージが表示される
    await featureFlagsPage.expectSuccessMessage('機能フラグを更新しました');
  });

  /**
   * Scenario: 変更がない場合は保存ボタンが無効
   *   Given 機能フラグを変更していない
   *   Then 「保存」ボタンが無効化されている
   */
  test('変更がない場合は保存ボタンが無効', async () => {
    // Given: 機能フラグを変更していない（初期状態）

    // Then: 保存ボタンが無効化されている
    await featureFlagsPage.expectSaveButtonDisabled();
  });

  /**
   * Scenario: 保存後にページをリロードしても変更が保持される
   *   Given 「予約変更機能」をONにして保存済み
   *   When ページをリロードする
   *   Then 「予約変更機能」がONの状態で表示される
   */
  test.skip('保存後にページをリロードしても変更が保持される', async () => {
    // TODO: API実装後に有効化
    // Given: 予約変更機能をONにして保存
    await featureFlagsPage.enableFeature('enableReservationUpdate');
    await featureFlagsPage.save();
    await featureFlagsPage.expectSuccessMessage('機能フラグを更新しました');

    // When: ページをリロード
    await featureFlagsPage.reload();

    // Then: 変更が保持されている
    await featureFlagsPage.expectFeatureEnabled('enableReservationUpdate');
  });

  /**
   * Scenario: 実装済み機能には「実装済み」バッジが表示される
   */
  test('実装済み機能には「実装済み」バッジが表示される', async () => {
    // Then: 実装済み機能にバッジが表示される
    await featureFlagsPage.expectImplementedBadge('スタッフ指名機能');
    await featureFlagsPage.expectImplementedBadge('スタッフシフト管理');
    await featureFlagsPage.expectImplementedBadge('顧客管理・メモ機能');
    await featureFlagsPage.expectImplementedBadge('リマインダーメール');
    await featureFlagsPage.expectImplementedBadge('予約手動追加');
    await featureFlagsPage.expectImplementedBadge('分析レポート');
  });

  /**
   * Scenario: 未実装機能には「未実装」バッジが表示される
   */
  test('未実装機能には「未実装」バッジが表示される', async () => {
    // Then: 未実装機能にバッジが表示される
    await featureFlagsPage.expectNotImplementedBadge('予約変更機能');
    await featureFlagsPage.expectNotImplementedBadge('リピート率分析');
    await featureFlagsPage.expectNotImplementedBadge('クーポン機能');
    await featureFlagsPage.expectNotImplementedBadge('LINE通知連携');
  });

  /**
   * Scenario: モバイルで正しく表示される
   *   Given モバイル画面サイズ（375x667）に設定している
   *   When 機能フラグ管理ページにアクセスする
   *   Then すべてのトグルスイッチが操作可能である
   */
  test('モバイルで正しく表示される', async ({ page }) => {
    // Given: モバイル画面サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // When: ページにアクセス（beforeEachで実行済み）

    // Then: すべての要素が表示される
    await featureFlagsPage.expectAllFeaturesVisible();
    await featureFlagsPage.expectSaveButtonVisible();
  });
});
