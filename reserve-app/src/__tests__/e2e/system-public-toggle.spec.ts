import { test, expect } from '@playwright/test';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: システム公開・非公開トグル
 * Issue: #24
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to control system public status
 * So that I can put the system into maintenance mode when needed
 *
 * Gherkinシナリオ: features/system-public-toggle.feature
 */
test.describe('システム公開・非公開トグル', () => {
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
   * Scenario: デフォルトで公開中になっている
   *   When ページが読み込まれる
   *   Then isPublicトグルがONになっている
   *   And isPublicラベルが「システム公開中」と表示される
   */
  test('デフォルトで公開中になっている', async () => {
    // Then: システム公開設定セクションが表示される
    await settingsPage.expectSystemPublicSectionVisible();

    // And: isPublicトグルがON
    await settingsPage.expectIsPublicEnabled();

    // And: ラベルが「システム公開中」
    await settingsPage.expectIsPublicLabel('システム公開中');
  });

  /**
   * Scenario: システムを非公開に変更できる
   *   Given システムが公開中である
   *   When isPublicトグルをOFFにする
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And isPublicトグルがOFFになっている
   */
  test('システムを非公開に変更できる', async () => {
    // When: isPublicトグルをOFFにする
    await settingsPage.disableIsPublic();

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: トグルがOFF
    await settingsPage.expectIsPublicDisabled();

    // And: ラベルが「メンテナンス中（非公開）」
    await settingsPage.expectIsPublicLabel('メンテナンス中（非公開）');
  });

  /**
   * Scenario: システムを公開に変更できる
   *   Given システムが非公開である
   *   When isPublicトグルをONにする
   *   And 保存ボタンをクリックする
   *   Then 「店舗設定を更新しました」という成功メッセージが表示される
   *   And isPublicトグルがONになっている
   */
  test('システムを公開に変更できる', async () => {
    // Given: 先に非公開にする
    await settingsPage.disableIsPublic();
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: 公開に戻す
    await settingsPage.enableIsPublic();

    // And: 保存ボタンをクリック
    await settingsPage.clickSave();

    // Then: 成功メッセージが表示される
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // And: トグルがON
    await settingsPage.expectIsPublicEnabled();

    // And: ラベルが「システム公開中」
    await settingsPage.expectIsPublicLabel('システム公開中');
  });

  /**
   * Scenario: 非公開時は一般ページがメンテナンス画面にリダイレクトされる
   *   Given システムを非公開に変更して保存した
   *   When ホームページ「/」にアクセスする
   *   Then メンテナンスページ「/maintenance」にリダイレクトされる
   *   And メンテナンスタイトルが表示される
   */
  test('非公開時は一般ページがメンテナンス画面にリダイレクトされる', async ({ page }) => {
    // Given: システムを非公開にする
    await settingsPage.disableIsPublic();
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: ホームページにアクセス
    await page.goto('/');

    // Then: メンテナンスページにリダイレクト
    await expect(page).toHaveURL('/maintenance');

    // And: メンテナンスタイトルが表示される
    await expect(page.locator('[data-testid="maintenance-title"]')).toHaveText('メンテナンス中');
  });

  /**
   * Scenario: 非公開時でも管理画面にはアクセスできる
   *   Given システムを非公開に変更して保存した
   *   When 店舗設定ページ「/admin/settings」に直接アクセスする
   *   Then ページが正常に表示される
   *   And ページタイトルに「店舗設定」が表示される
   */
  test('非公開時でも管理画面にはアクセスできる', async ({ page }) => {
    // Given: システムを非公開にする
    await settingsPage.disableIsPublic();
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: 店舗設定ページに直接アクセス
    await page.goto('/admin/settings');

    // Then: ページが正常に表示される
    await expect(page).toHaveURL('/admin/settings');

    // And: ページタイトルが表示される
    await settingsPage.expectPageTitle('店舗設定');
  });

  /**
   * Scenario: ページをリロードしても設定が保持される
   *   Given システムを非公開に変更して保存した
   *   When ページをリロードする
   *   Then isPublicトグルがOFFのまま表示される
   */
  test('ページをリロードしても設定が保持される', async () => {
    // Given: システムを非公開にする
    await settingsPage.disableIsPublic();
    await settingsPage.clickSave();
    await settingsPage.expectSuccessMessage('店舗設定を更新しました');

    // When: ページをリロード
    await settingsPage.reload();

    // Then: トグルがOFFのまま
    await settingsPage.expectIsPublicDisabled();

    // And: ラベルが「メンテナンス中（非公開）」
    await settingsPage.expectIsPublicLabel('メンテナンス中（非公開）');
  });
});
