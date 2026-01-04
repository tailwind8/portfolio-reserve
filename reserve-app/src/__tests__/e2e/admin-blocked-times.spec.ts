import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { BlockedTimesPage } from './pages/BlockedTimesPage';

/**
 * 予約ブロック管理機能のE2Eテスト
 *
 * テスト観点:
 * - 管理者による予約ブロックのCRUD操作
 * - ブロックされた時間帯がオンライン予約で選択不可になることを確認
 * - バリデーションエラーの検証
 * - 日付範囲フィルタリング
 */

test.describe.serial('予約ブロック管理', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);

    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要でブロック管理ページに直接アクセス

    // テスト用のブロックデータをクリーンアップ
    await page.request.delete('/api/test/cleanup-blocked-times');
  });

  test('予約ブロックを追加する', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    // 予約ブロック管理ページにアクセス
    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();

    // ページが正しく表示されることを確認
    await blockedTimesPage.expectPageHeading('予約ブロック管理');
    await blockedTimesPage.expectAddButtonVisible();

    // 新規ブロック追加ボタンをクリック
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.expectFormModalVisible('予約ブロック追加');

    // フォームに入力
    await blockedTimesPage.fillStartDateTime('2026-01-15T14:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T15:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.fillDescription('山田様の予約');

    // 追加ボタンをクリック
    await blockedTimesPage.clickSubmitButton();

    // 成功メッセージが表示される
    await blockedTimesPage.expectSuccessMessage('予約ブロックを追加しました');

    // ブロックが一覧に表示される
    await blockedTimesPage.expectBlockAdded('2026-01-15 14:00', '2026-01-15 15:00');
    await blockedTimesPage.expectBlockedTimeDetails(
      '2026-01-15 14:00',
      '2026-01-15 15:00',
      'ホットペッパー予約',
      '山田様の予約'
    );
  });

  // TODO: 予約ページとの連携機能実装後に有効化
  test.skip('ブロックされた時間はオンライン予約できない', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    // 予約ブロックを追加
    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-15T14:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T15:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.expectSuccessMessage('予約ブロックを追加しました');

    // ユーザーとして予約ページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // メニューを選択
    const menuSelect = page.locator('[data-testid="menu-select"]');
    await menuSelect.selectOption({ index: 1 }); // "カット"を選択

    // 日付を選択（2026-01-15）
    await page.click('[data-testid="date-picker"]');
    await page.click('button[data-date="2026-01-15"]');

    // 14:00の時間スロットが選択不可になっている
    const slot14 = page.locator('[data-testid="time-slot-14:00"]');
    await expect(slot14).toBeDisabled();

    // 13:00は選択可能
    const slot13 = page.locator('[data-testid="time-slot-13:00"]');
    await expect(slot13).toBeEnabled();
  });

  test('ブロックを編集する', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    // 既存のブロックを追加
    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-15T14:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T15:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.waitForSeconds(1);

    // 編集ボタンをクリック
    await blockedTimesPage.clickEditButton('2026-01-15 14:00');
    await blockedTimesPage.expectFormModalVisible('予約ブロック編集');

    // 終了時刻を変更
    await blockedTimesPage.fillEndDateTime('2026-01-15T16:00');
    await blockedTimesPage.fillDescription('時間延長');

    // 保存ボタンをクリック
    await blockedTimesPage.clickSubmitButton();

    // 成功メッセージが表示される
    await blockedTimesPage.expectSuccessMessage('予約ブロックを更新しました');

    // ブロックが更新される
    await blockedTimesPage.expectBlockUpdated(
      '2026-01-15 14:00',
      '2026-01-15 16:00',
      'ホットペッパー予約',
      '時間延長'
    );
  });

  test('ブロックを削除する', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    // 既存のブロックを追加
    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-15T14:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T15:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.waitForSeconds(1);

    // 確認ダイアログを自動承認
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('削除');
      await dialog.accept();
    });

    // 削除ボタンをクリック
    await blockedTimesPage.clickDeleteButton('2026-01-15 14:00');

    // 少し待つ
    await blockedTimesPage.waitForSeconds(1);

    // 成功メッセージが表示される
    await blockedTimesPage.expectSuccessMessage('予約ブロックを削除しました');

    // ブロックが一覧から削除される
    await blockedTimesPage.expectBlockDeleted('2026-01-15 14:00');
  });

  test('終了日時が開始日時より前の場合はエラー', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();
    await blockedTimesPage.clickAddButton();

    // 終了日時が開始日時より前
    await blockedTimesPage.fillStartDateTime('2026-01-15T15:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T14:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.clickSubmitButton();

    // エラーメッセージが表示される
    await blockedTimesPage.expectErrorMessage('終了日時は開始日時より後にしてください');

    // ブロックは追加されない
    await blockedTimesPage.clickCancelButton();
    const count = await blockedTimesPage.getBlockedTimeCount();
    expect(count).toBe(0);
  });

  // TODO: 予約ページとの連携機能実装後に有効化
  test.skip('臨時休業で全日ブロックする', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    // 全日ブロックを追加
    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-20T09:00');
    await blockedTimesPage.fillEndDateTime('2026-01-20T18:00');
    await blockedTimesPage.selectReason('臨時休業');
    await blockedTimesPage.fillDescription('全スタッフ研修参加');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.expectSuccessMessage('予約ブロックを追加しました');

    // ユーザーとして予約ページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // メニューを選択
    const menuSelect = page.locator('[data-testid="menu-select"]');
    await menuSelect.selectOption({ index: 1 });

    // 日付を選択（2026-01-20）
    await page.click('[data-testid="date-picker"]');
    await page.click('button[data-date="2026-01-20"]');

    // すべての時間スロットが選択不可になっている
    const timeSlots = page.locator('[data-testid^="time-slot-"]');
    const count = await timeSlots.count();

    for (let i = 0; i < count; i++) {
      const slot = timeSlots.nth(i);
      await expect(slot).toBeDisabled();
    }
  });

  // TODO: 日付範囲フィルタリング機能実装後に有効化
  test.skip('ブロック一覧を日付範囲でフィルタリング', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();

    // 複数のブロックを追加
    // ブロック1: 2026-01-15
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-15T14:00');
    await blockedTimesPage.fillEndDateTime('2026-01-15T15:00');
    await blockedTimesPage.selectReason('ホットペッパー予約');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.waitForSeconds(1);

    // ブロック2: 2026-01-20
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-01-20T09:00');
    await blockedTimesPage.fillEndDateTime('2026-01-20T18:00');
    await blockedTimesPage.selectReason('臨時休業');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.waitForSeconds(1);

    // ブロック3: 2026-02-05
    await blockedTimesPage.clickAddButton();
    await blockedTimesPage.fillStartDateTime('2026-02-05T10:00');
    await blockedTimesPage.fillEndDateTime('2026-02-05T11:00');
    await blockedTimesPage.selectReason('電話予約');
    await blockedTimesPage.clickSubmitButton();
    await blockedTimesPage.waitForSeconds(1);

    // 日付範囲でフィルタリング（2026-01-01 〜 2026-01-31）
    await blockedTimesPage.filterByDateRange('2026-01-01', '2026-01-31');

    // 2件のブロックが表示される
    const count = await blockedTimesPage.getBlockedTimeCount();
    expect(count).toBe(2);

    // 2026-01-15のブロックが表示される
    await blockedTimesPage.expectBlockedTimeVisible('2026-01-15 14:00', '2026-01-15 15:00');

    // 2026-01-20のブロックが表示される
    await blockedTimesPage.expectBlockedTimeVisible('2026-01-20 09:00', '2026-01-20 18:00');

    // 2026-02-05のブロックは表示されない
    await blockedTimesPage.expectBlockDeleted('2026-02-05 10:00');
  });

  // TODO: テストデータクリーンアップ機能実装後に有効化
  test.skip('空状態が正しく表示される', async ({ page }) => {
    const blockedTimesPage = new BlockedTimesPage(page);

    await blockedTimesPage.goto();
    await blockedTimesPage.waitForLoad();

    // ブロックがない場合、空状態が表示される
    await blockedTimesPage.expectEmptyStateVisible();
  });
});
