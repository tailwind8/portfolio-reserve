import { test, expect } from '@playwright/test';
import { AdminReservationsPage } from './pages/AdminReservationsPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: 管理者向け予約管理
 * Issue: #17, #18
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to manage all reservations
 * So that I can handle phone bookings and update reservation details
 *
 * Gherkinシナリオ: features/admin/reservations.feature
 */

test.describe('管理者向け予約管理 (#17, #18)', () => {
  let reservationsPage: AdminReservationsPage;

  test.beforeEach(async ({ page }) => {
    // LocalStorageをクリア（表示モードを常にデフォルトの'list'で開始）
    await page.addInitScript(() => {
      localStorage.clear();
    });

    // MSW API モックをセットアップ
    await setupMSW(page);

    reservationsPage = new AdminReservationsPage(page);
    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要で予約一覧ページに直接アクセス
    await reservationsPage.goto();
  });

  /**
   * Scenario: 予約一覧ページにアクセスする
   *   Then ページタイトルに「予約一覧」が表示される
   *   And 「新規予約を追加」ボタンが表示される
   */
  test('予約一覧ページにアクセスする @smoke', async () => {
    // Then: ページタイトルが表示される
    await reservationsPage.expectPageTitle('予約一覧');

    // And: 新規予約追加ボタンが表示される
    await reservationsPage.expectAddButtonVisible();
  });

  /**
   * Scenario: すべての予約が一覧表示される
   *   Given 予約が5件存在する
   *   When ページが読み込まれる
   *   Then 予約一覧テーブルが表示される
   *   And 各予約に予約日時が表示される
   *   And 各予約に顧客名が表示される
   *   And 各予約にメニュー名が表示される
   *   And 各予約にスタッフ名が表示される
   *   And 各予約にステータスバッジが表示される
   *   And 各予約に「編集」ボタンが表示される
   *   And 各予約に「削除」ボタンが表示される
   */
  test('すべての予約が一覧表示される @smoke', async () => {
    // Given: 予約が5件存在する（APIモックで提供）

    // When: ページが読み込まれる（beforeEachで実行済み）

    // Then: 予約一覧テーブルが表示される
    await reservationsPage.expectTableVisible();

    // And: 予約件数を確認
    const count = await reservationsPage.getReservationCount();
    expect(count).toBeGreaterThan(0);

    // And: 最初の予約に必要な情報がすべて表示される
    await reservationsPage.expectReservationRow(0, {
      date: '2025-01-20',
      time: '10:00',
      customer: '山田太郎',
      menu: 'カット',
      staff: '田中',
      status: 'confirmed',
    });

    // And: 編集・削除ボタンが表示される
    await reservationsPage.expectActionButtonsVisible(0);
  });

  /**
   * Scenario: 予約が存在しない場合
   *   Given 予約が0件である
   *   When ページが読み込まれる
   *   Then 「予約がありません」というメッセージが表示される
   *   And 「新規予約を追加」ボタンが表示される
   */
  test('予約が存在しない場合', async ({ page }) => {
    // Given: 予約が0件のモックデータ
    await setupMSW(page, { adminReservationsEmpty: true });
    await reservationsPage.goto();

    // Then: 予約がないメッセージが表示される
    await reservationsPage.expectEmptyMessage('予約がありません');

    // And: 新規予約追加ボタンが表示される
    await reservationsPage.expectAddButtonVisible();
  });

  /**
   * Scenario: ステータスで予約をフィルタリングできる
   *   Given 予約一覧ページにアクセスしている
   *   When ステータスフィルターで「確定」を選択する
   *   Then 確定済みの予約のみが表示される
   */
  test('ステータスで予約をフィルタリングできる', async () => {
    // Given: 予約一覧ページにアクセスしている（beforeEachで実行済み）

    // When: ステータスフィルターで「確定」を選択する
    await reservationsPage.filterByStatus('confirmed');

    // Then: フィルタリングされた予約が表示される
    await reservationsPage.expectTableVisible();
  });

  /**
   * Scenario: 日付範囲で予約をフィルタリングできる
   *   Given 予約一覧ページにアクセスしている
   *   When 日付範囲フィルターで「今週」を選択する
   *   Then 今週の予約のみが表示される
   */
  test('日付範囲で予約をフィルタリングできる', async () => {
    // Given: 予約一覧ページにアクセスしている（beforeEachで実行済み）

    // When: 日付範囲フィルターで「今週」を選択する
    await reservationsPage.filterByDateRange('this-week');

    // Then: フィルタリングされた予約が表示される
    await reservationsPage.expectTableVisible();
  });

  // ===== 予約手動追加（Issue #17） =====

  /**
   * Scenario: 新規予約追加モーダルを開く
   *   When 「新規予約を追加」ボタンをクリックする
   *   Then 「新規予約を追加」というタイトルのモーダルが表示される
   *   And フォーム要素がすべて表示される
   */
  test('新規予約追加モーダルを開く', async () => {
    // When: 新規予約追加ボタンをクリックする
    await reservationsPage.clickAddReservation();

    // Then: モーダルが表示される
    await reservationsPage.expectAddModalVisible();

    // And: フォーム要素が表示される
    await reservationsPage.expectAddModalFormVisible();
  });

  /**
   * Scenario: 新規予約追加モーダルを閉じる
   *   Given 新規予約追加モーダルを開いている
   *   When 「キャンセル」ボタンをクリックする
   *   Then モーダルが閉じる
   */
  test('新規予約追加モーダルを閉じる', async () => {
    // Given: 新規予約追加モーダルを開いている
    await reservationsPage.clickAddReservation();
    await reservationsPage.expectAddModalVisible();

    // When: キャンセルボタンをクリックする
    await reservationsPage.cancelAddModal();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();
  });

  /**
   * Scenario: 必須項目が未入力の場合エラーが表示される
   *   Given 新規予約追加モーダルを開いている
   *   When 必須項目を入力せずに「予約を作成」ボタンをクリックする
   *   Then バリデーションエラーメッセージが表示される
   *   And モーダルは閉じない
   */
  test('必須項目が未入力の場合エラーが表示される', async () => {
    // Given: 新規予約追加モーダルを開いている
    await reservationsPage.clickAddReservation();
    await reservationsPage.expectAddModalVisible();

    // When: 必須項目を入力せずに送信
    await reservationsPage.submitAddReservation();

    // Then: バリデーションエラーが表示される
    await reservationsPage.expectValidationError();

    // And: モーダルは閉じない
    await reservationsPage.expectAddModalVisible();
  });

  /**
   * Scenario: 新規予約を正常に追加できる
   *   Given 新規予約追加モーダルを開いている
   *   When フォームに必要な情報を入力する
   *   And 「予約を作成」ボタンをクリックする
   *   Then 予約が作成される
   *   And モーダルが閉じる
   *   And 成功メッセージが表示される
   */
  test('新規予約を正常に追加できる', async () => {
    // Given: 新規予約追加モーダルを開いている
    await reservationsPage.clickAddReservation();
    await reservationsPage.expectAddModalVisible();

    // When: フォームに入力する
    await reservationsPage.fillAddReservationForm({
      customer: '山田太郎',
      menu: 'カット',
      staff: '田中',
      date: '2025-01-25',
      time: '10:00',
      notes: '初回来店',
    });

    // And: 予約を作成
    await reservationsPage.submitAddReservation();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();

    // And: 成功メッセージが表示される
    await reservationsPage.expectSuccessMessage('予約を追加しました');
  });

  // ===== 予約編集（Issue #18） =====

  /**
   * Scenario: 予約編集モーダルを開く
   *   Given 予約が1件以上存在する
   *   When 最初の予約の「編集」ボタンをクリックする
   *   Then 「予約を編集」というタイトルのモーダルが表示される
   *   And 既存の予約情報が事前入力されている
   *   And フォーム要素がすべて表示される
   */
  test('予約編集モーダルを開く', async () => {
    // Given: 予約が存在する（APIモックで提供）

    // When: 編集ボタンをクリックする
    await reservationsPage.clickEdit(0);

    // Then: モーダルが表示される
    await reservationsPage.expectEditModalVisible();

    // And: 既存データが事前入力されている
    await reservationsPage.expectEditModalPreFilled();

    // And: フォーム要素が表示される
    await reservationsPage.expectEditModalFormVisible();
  });

  /**
   * Scenario: 予約編集モーダルを閉じる
   *   Given 予約編集モーダルを開いている
   *   When 「キャンセル」ボタンをクリックする
   *   Then モーダルが閉じる
   */
  test('予約編集モーダルを閉じる', async () => {
    // Given: 予約編集モーダルを開いている
    await reservationsPage.clickEdit(0);
    await reservationsPage.expectEditModalVisible();

    // When: キャンセルボタンをクリックする
    await reservationsPage.cancelEditModal();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();
  });

  /**
   * Scenario: 予約のステータスを変更できる
   *   Given 予約編集モーダルを開いている
   *   When ステータスを「確定」に変更する
   *   And 「更新する」ボタンをクリックする
   *   Then 予約が更新される
   *   And 成功メッセージが表示される
   */
  test('予約のステータスを変更できる', async () => {
    // Given: 予約編集モーダルを開いている
    await reservationsPage.clickEdit(0);
    await reservationsPage.expectEditModalVisible();

    // When: ステータスを変更
    await reservationsPage.changeStatus('CONFIRMED');

    // And: 更新する
    await reservationsPage.submitEditReservation();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();

    // And: 成功メッセージが表示される
    await reservationsPage.expectSuccessMessage('予約を更新しました');
  });

  /**
   * Scenario: 予約の日時を変更できる
   *   Given 予約編集モーダルを開いている
   *   When 日付と時間を変更する
   *   And 「更新する」ボタンをクリックする
   *   Then 予約が更新される
   */
  test('予約の日時を変更できる', async () => {
    // Given: 予約編集モーダルを開いている
    await reservationsPage.clickEdit(0);
    await reservationsPage.expectEditModalVisible();

    // When: 日時を変更
    await reservationsPage.changeDateTime('2025-01-22', '14:00');

    // And: 更新する
    await reservationsPage.submitEditReservation();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();

    // And: 成功メッセージが表示される
    await reservationsPage.expectSuccessMessage('予約を更新しました');
  });

  /**
   * Scenario: 予約のメニューとスタッフを変更できる
   *   Given 予約編集モーダルを開いている
   *   When メニューとスタッフを変更する
   *   And 「更新する」ボタンをクリックする
   *   Then 予約が更新される
   */
  test('予約のメニューとスタッフを変更できる', async () => {
    // Given: 予約編集モーダルを開いている
    await reservationsPage.clickEdit(0);
    await reservationsPage.expectEditModalVisible();

    // When: メニューとスタッフを変更
    await reservationsPage.changeMenuAndStaff('カラー', '佐藤');

    // And: 更新する
    await reservationsPage.submitEditReservation();

    // Then: モーダルが閉じる
    await reservationsPage.expectModalClosed();

    // And: 成功メッセージが表示される
    await reservationsPage.expectSuccessMessage('予約を更新しました');
  });

  // ===== 予約削除（Issue #18） =====

  /**
   * Scenario: 予約削除確認ダイアログを開く
   *   Given 予約が1件以上存在する
   *   When 最初の予約の「削除」ボタンをクリックする
   *   Then 削除確認ダイアログが表示される
   *   And 予約詳細と警告メッセージが表示される
   */
  test('予約削除確認ダイアログを開く', async () => {
    // Given: 予約が存在する（APIモックで提供）

    // When: 削除ボタンをクリックする
    await reservationsPage.clickDelete(0);

    // Then: 削除確認ダイアログが表示される
    await reservationsPage.expectDeleteDialogVisible();

    // And: 予約詳細が表示される
    await reservationsPage.expectDeleteDialogDetails({
      date: '2025-01-20',
      customer: '山田太郎',
      menu: 'カット',
    });

    // And: 警告メッセージが表示される
    await reservationsPage.expectDeleteWarningVisible();
  });

  /**
   * Scenario: 削除確認ダイアログを閉じる
   *   Given 削除確認ダイアログを開いている
   *   When 「戻る」ボタンをクリックする
   *   Then ダイアログが閉じる
   */
  test('削除確認ダイアログを閉じる', async () => {
    // Given: 削除確認ダイアログを開いている
    await reservationsPage.clickDelete(0);
    await reservationsPage.expectDeleteDialogVisible();

    // When: 戻るボタンをクリックする
    await reservationsPage.cancelDelete();

    // Then: ダイアログが閉じる
    await reservationsPage.expectDialogClosed();
  });

  /**
   * Scenario: 予約を削除できる
   *   Given 削除確認ダイアログを開いている
   *   When 「削除する」ボタンをクリックする
   *   Then 予約が削除される
   *   And 成功メッセージが表示される
   */
  test('予約を削除できる', async () => {
    // Given: 削除確認ダイアログを開いている
    await reservationsPage.clickDelete(0);
    await reservationsPage.expectDeleteDialogVisible();

    // When: 削除を確定
    await reservationsPage.confirmDelete();

    // Then: ダイアログが閉じる
    await reservationsPage.expectDialogClosed();

    // And: 成功メッセージが表示される
    await reservationsPage.expectSuccessMessage('予約を削除しました');
  });

  // ===== 検索機能 =====

  /**
   * Scenario: 顧客名で予約を検索できる
   *   Given 予約が複数件存在する
   *   When 検索ボックスに「山田」と入力する
   *   Then 「山田」を含む顧客の予約のみが表示される
   */
  test('顧客名で予約を検索できる', async () => {
    // Given: 予約が複数件存在する（APIモックで提供）

    // When: 検索ボックスに入力
    await reservationsPage.searchByCustomerName('山田');

    // Then: 検索結果が表示される
    await reservationsPage.expectTableVisible();
  });

  // ===== ページネーション =====

  /**
   * Scenario: 予約が多い場合にページネーションが表示される
   *   Given 予約が20件以上存在する
   *   When ページが読み込まれる
   *   Then ページネーションが表示される
   */
  test.skip('予約が多い場合にページネーションが表示される', async ({ page }) => {
    // ページネーション機能が実装されたら有効化
    // Given: 予約が20件以上のモックデータ
    await setupMSW(page, { adminReservationsLarge: true });
    const reservationsPageLocal = new AdminReservationsPage(page);
    await reservationsPageLocal.goto();

    // Then: ページネーションが表示される
    await reservationsPageLocal.expectPaginationVisible();
  });

  // ===== エラーハンドリング =====

  /**
   * Scenario: APIエラー時にエラーメッセージが表示される
   *   Given APIがエラーを返す
   *   When 予約一覧ページにアクセスする
   *   Then エラーメッセージが表示される
   */
  test('APIエラー時にエラーメッセージが表示される', async ({ page }) => {
    // Given: APIがエラーを返す状態
    await setupMSW(page, { adminReservationsError: true });
    const reservationsPageLocal = new AdminReservationsPage(page);

    // When: 予約一覧ページにアクセスする
    await reservationsPageLocal.goto();

    // Then: エラーメッセージが表示される
    await reservationsPageLocal.expectErrorMessage();
  });
});
