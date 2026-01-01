import { test, expect } from '@playwright/test';
import { AdminMenuPage } from './pages/AdminMenuPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: メニュー管理
 * Issue: #23
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to manage service menus
 * So that customers can select services when making reservations
 *
 * Gherkinシナリオ: features/admin/menu.feature
 */

test.describe('メニュー管理 (#23)', () => {
  let menuPage: AdminMenuPage;

  test.beforeEach(async ({ page }) => {
    // MSW API モックをセットアップ
    await setupMSW(page);

    menuPage = new AdminMenuPage(page);
    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要でメニュー管理ページに直接アクセス
    await menuPage.goto();
  });

  /**
   * Scenario: メニュー一覧を表示（ハッピーパス）
   *   Given メニューが複数件登録されている
   *   When ページが読み込まれる
   *   Then すべてのメニューが一覧表示される
   *   And 各メニューに名前が表示される
   *   And 各メニューに価格が表示される
   *   And 各メニューに所要時間が表示される
   *   And 各メニューにカテゴリが表示される
   */
  test('メニュー一覧を表示（ハッピーパス）', async () => {
    // Then: ページタイトルが表示される
    await menuPage.expectPageTitle('メニュー管理');

    // And: メニュー追加ボタンが表示される
    await menuPage.expectAddButtonVisible();

    // And: メニュー一覧が表示される
    await menuPage.expectMenuListVisible();

    // And: メニュー件数を確認
    const count = await menuPage.getMenuCount();
    expect(count).toBeGreaterThan(0);

    // And: 最初のメニューに必要な情報がすべて表示される
    await menuPage.expectMenuItem(0, {
      name: 'カット',
      price: 5000,
      duration: 60,
      category: 'ヘアケア',
    });
  });

  /**
   * Scenario: メニューを追加（ハッピーパス）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   When "メニューを追加"ボタンをクリックする
   *   Then メニュー追加モーダルが表示される
   *   When 名前に"カット"を入力する
   *   And 価格に"5000"を入力する
   *   And 所要時間に"60"を入力する
   *   And カテゴリに"ヘアケア"を入力する
   *   And 説明に"シャンプー・ブロー込み"を入力する
   *   And "追加"ボタンをクリックする
   *   Then メニューが追加される
   *   And 成功メッセージ"メニューを追加しました"が表示される
   *   And メニュー一覧に新しいメニューが表示される
   */
  test('メニューを追加（ハッピーパス）', async () => {
    // When: メニュー追加ボタンをクリック
    await menuPage.clickAddMenu();

    // Then: メニュー追加モーダルが表示される
    await menuPage.expectAddModalVisible();

    // When: フォームに入力
    await menuPage.fillAddMenuForm({
      name: 'カット',
      price: '5000',
      duration: '60',
      category: 'ヘアケア',
      description: 'シャンプー・ブロー込み',
    });

    // And: 追加ボタンをクリック
    await menuPage.submitAddMenu();

    // Then: 成功メッセージが表示される
    await menuPage.expectSuccessMessage('メニューを追加しました');

    // And: モーダルが閉じる
    await menuPage.expectModalClosed();

    // And: 新しいメニューが一覧に表示される
    await menuPage.expectMenuItem(0, {
      name: 'カット',
      price: 5000,
      duration: 60,
      category: 'ヘアケア',
      description: 'シャンプー・ブロー込み',
    });
  });

  /**
   * Scenario: メニュー追加失敗（必須項目未入力）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   When "メニューを追加"ボタンをクリックする
   *   Then メニュー追加モーダルが表示される
   *   When 何も入力せずに"追加"ボタンをクリックする
   *   Then エラーメッセージ"名前を入力してください"が表示される
   *   And エラーメッセージ"価格を入力してください"が表示される
   *   And エラーメッセージ"所要時間を入力してください"が表示される
   *   And メニューは追加されない
   */
  test('メニュー追加失敗（必須項目未入力）', async () => {
    // When: メニュー追加ボタンをクリック
    await menuPage.clickAddMenu();

    // Then: メニュー追加モーダルが表示される
    await menuPage.expectAddModalVisible();

    // When: 何も入力せずに追加ボタンをクリック
    await menuPage.submitAddMenu();

    // Then: エラーメッセージが表示される
    await menuPage.expectValidationError('名前を入力してください');
    await menuPage.expectValidationError('価格を入力してください');
    await menuPage.expectValidationError('所要時間を入力してください');

    // And: モーダルはまだ開いている
    await expect(menuPage.page.locator('[data-testid="add-menu-modal"]')).toBeVisible();
  });

  /**
   * Scenario: メニュー追加失敗（価格が不正）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   When "メニューを追加"ボタンをクリックする
   *   Then メニュー追加モーダルが表示される
   *   When 名前に"カット"を入力する
   *   And 価格に"-1000"を入力する
   *   And 所要時間に"60"を入力する
   *   And "追加"ボタンをクリックする
   *   Then エラーメッセージ"価格は0以上の数値を入力してください"が表示される
   *   And メニューは追加されない
   */
  test('メニュー追加失敗（価格が不正）', async () => {
    // When: メニュー追加ボタンをクリック
    await menuPage.clickAddMenu();

    // Then: メニュー追加モーダルが表示される
    await menuPage.expectAddModalVisible();

    // When: 不正な価格でフォームに入力
    await menuPage.fillAddMenuForm({
      name: 'カット',
      price: '-1000',
      duration: '60',
    });

    // And: 追加ボタンをクリック
    await menuPage.submitAddMenu();

    // Then: エラーメッセージが表示される
    await menuPage.expectValidationError('価格は0以上の数値を入力してください');
  });

  /**
   * Scenario: メニューを編集（ハッピーパス）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And メニューが1件以上存在する
   *   When メニューを選択する
   *   And "編集"ボタンをクリックする
   *   Then メニュー編集モーダルが表示される
   *   When 価格を"6000"に変更する
   *   And "保存"ボタンをクリックする
   *   Then メニュー情報が更新される
   *   And 成功メッセージ"メニュー情報を更新しました"が表示される
   */
  test('メニューを編集（ハッピーパス）', async () => {
    // When: 編集ボタンをクリック
    await menuPage.clickEdit(0);

    // Then: メニュー編集モーダルが表示される
    await menuPage.expectEditModalVisible();

    // When: 価格を変更
    await menuPage.changePrice('6000');

    // And: 保存ボタンをクリック
    await menuPage.submitEditMenu();

    // Then: 成功メッセージが表示される
    await menuPage.expectSuccessMessage('メニュー情報を更新しました');

    // And: モーダルが閉じる
    await menuPage.expectModalClosed();

    // And: 更新されたメニュー情報が表示される
    await menuPage.expectMenuItem(0, {
      price: 6000,
    });
  });

  /**
   * Scenario: メニューを削除（ハッピーパス）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And メニューが1件以上存在する
   *   When メニューを選択する
   *   And "削除"ボタンをクリックする
   *   Then "メニューを削除しますか？"という確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then メニューが削除される
   *   And 成功メッセージ"メニューを削除しました"が表示される
   *   And メニュー一覧から該当メニューが削除される
   */
  test('メニューを削除（ハッピーパス）', async () => {
    // 初期のメニュー数を取得
    const initialCount = await menuPage.getMenuCount();

    // When: 削除ボタンをクリック
    await menuPage.clickDelete(0);

    // Then: 削除確認ダイアログが表示される
    await menuPage.expectDeleteDialogVisible();

    // When: 削除を確定
    await menuPage.confirmDelete();

    // Then: 成功メッセージが表示される
    await menuPage.expectSuccessMessage('メニューを削除しました');

    // And: ダイアログが閉じる
    await menuPage.expectDialogClosed();

    // And: メニュー数が減っている
    const newCount = await menuPage.getMenuCount();
    expect(newCount).toBe(initialCount - 1);
  });

  /**
   * Scenario: メニュー削除失敗（予約が存在する）
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And メニューが1件以上存在する
   *   And 該当メニューに予約が存在する
   *   When メニューを選択する
   *   And "削除"ボタンをクリックしようとする
   *   Then "削除"ボタンが無効化されている
   *   And エラーメッセージ"予約が存在するため削除できません"が表示される
   */
  test('メニュー削除失敗（予約が存在する）', async () => {
    // Given: メニューに予約が存在する（APIモックで提供）

    // Then: 削除ボタンが無効化されている
    await menuPage.expectDeleteButtonDisabled(0);

    // And: エラーメッセージが表示される
    await menuPage.expectErrorMessage('予約が存在するため削除できません');
  });

  /**
   * Scenario: カテゴリ別フィルター
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And 複数のカテゴリのメニューが存在する
   *   When カテゴリフィルターで"ヘアケア"を選択する
   *   Then "ヘアケア"カテゴリのメニューのみが表示される
   */
  test('カテゴリ別フィルター', async () => {
    // When: カテゴリフィルターを選択
    await menuPage.selectCategoryFilter('ヘアケア');

    // Then: ヘアケアカテゴリのメニューのみが表示される
    const count = await menuPage.getMenuCount();
    expect(count).toBeGreaterThan(0);

    await menuPage.expectMenuItem(0, {
      category: 'ヘアケア',
    });
  });

  /**
   * Scenario: メニュー一覧が空の場合
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And メニューが0件である
   *   When ページが読み込まれる
   *   Then "メニューが登録されていません"というメッセージが表示される
   */
  test('メニュー一覧が空の場合', async () => {
    // TODO: APIモックでメニュー0件を返すように設定

    // Then: 空状態メッセージが表示される
    // await menuPage.expectEmptyMessage('メニューが登録されていません');
  });

  /**
   * Scenario: メニュー検索機能
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   When 検索ボックスに"カット"と入力する
   *   Then "カット"を含むメニュー名のメニューのみが表示される
   */
  test('メニュー検索機能', async () => {
    // When: 検索ボックスに入力
    await menuPage.searchByName('カット');

    // Then: カットを含むメニューのみが表示される
    const count = await menuPage.getMenuCount();
    expect(count).toBeGreaterThan(0);

    await menuPage.expectMenuItem(0, {
      name: 'カット',
    });
  });

  /**
   * Scenario: メニューの有効/無効切り替え
   *   Given 管理者がメニュー管理ページにアクセスしている
   *   And メニューが1件以上存在する
   *   When メニューを選択する
   *   And "無効にする"ボタンをクリックする
   *   Then メニューが無効状態になる
   *   And 成功メッセージ"メニューを無効にしました"が表示される
   *   And メニュー一覧で無効状態が表示される
   */
  test('メニューの有効/無効切り替え', async () => {
    // When: 無効にするボタンをクリック
    await menuPage.clickDeactivate(0);

    // Then: 成功メッセージが表示される
    await menuPage.expectSuccessMessage('メニューを無効にしました');

    // And: 無効状態が表示される
    await menuPage.expectMenuItem(0, {
      isActive: false,
    });
  });
});
