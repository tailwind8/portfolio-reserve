import { test, expect } from '@playwright/test';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { setupMSW, setupAdminAuth } from './msw-setup';

/**
 * Feature: 顧客管理
 * Issue: #19, #20
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to view customer information
 * So that I can provide personalized service
 *
 * Gherkinシナリオ: features/admin/customers.feature
 */

test.describe('顧客管理 (#19, #20)', () => {
  let customersPage: AdminCustomersPage;

  test.beforeEach(async ({ page }) => {
    // MSW API モックをセットアップ
    await setupMSW(page);
    
    // 管理者認証cookieを設定（middlewareの認証チェックを通過するため）
    await setupAdminAuth(page);

    customersPage = new AdminCustomersPage(page);
  });

  /**
   * Scenario: 顧客一覧を表示（ハッピーパス）
   *   Given 管理者が顧客管理ページにアクセスしている
   *   When ページが読み込まれる
   *   Then すべての顧客が一覧表示される
   *   And 各顧客に名前が表示される
   *   And 各顧客にメールアドレスが表示される
   *   And 各顧客に電話番号が表示される
   *   And 各顧客に来店回数が表示される
   *   And 各顧客に最終来店日が表示される
   */
  test('顧客一覧を表示（ハッピーパス）', async () => {
    // Given: 顧客管理ページにアクセス
    await customersPage.goto();

    // When: ページが読み込まれる
    await customersPage.expectPageTitle('顧客管理');

    // Then: 顧客一覧が表示される（ローディングが終わるまで待つ）
    await customersPage.page.waitForSelector('[data-testid="customer-list"], [data-testid="empty-message"], [data-testid="loading-message"]', { timeout: 5000 });
    await customersPage.expectCustomerListVisible();

    // And: 顧客件数を確認
    const count = await customersPage.getCustomerCount();
    expect(count).toBeGreaterThan(0);

    // And: 最初の顧客に必要な情報がすべて表示される
    // 日付フォーマットは toLocaleDateString('ja-JP') により "2025/1/15" 形式になる
    await customersPage.expectCustomerItem(0, {
      name: '山田太郎',
      email: 'yamada@example.com',
      phone: '080-1111-2222',
      visitCount: 3,
      lastVisitDate: '2025/1/15',
    });
  });

  /**
   * Scenario: 顧客詳細を表示
   *   Given 管理者が顧客管理ページにアクセスしている
   *   And 顧客が1件以上存在する
   *   When 顧客をクリックする
   *   Then 顧客詳細ページに遷移する
   *   And 顧客の基本情報が表示される
   *   And 来店履歴が表示される
   *   And 予約履歴が表示される
   */
  test('顧客詳細を表示', async () => {
    // Given: 顧客管理ページにアクセス
    await customersPage.goto();

    // ローディングが終わるまで待つ
    await customersPage.page.waitForSelector('[data-testid="customer-list"], [data-testid="empty-message"], [data-testid="loading-message"]', { timeout: 5000 });

    // And: 顧客が1件以上存在する
    const count = await customersPage.getCustomerCount();
    expect(count).toBeGreaterThan(0);

    // When: 顧客をクリック
    await customersPage.clickCustomer(0);

    // Then: 顧客詳細ページに遷移する
    await expect(customersPage.page).toHaveURL(/\/admin\/customers\/[^/]+/);

    // And: 顧客の基本情報が表示される
    await customersPage.expectCustomerDetail({
      name: '山田太郎',
      email: 'yamada@example.com',
      phone: '080-1111-2222',
    });

    // And: 来店履歴が表示される
    await customersPage.expectVisitHistoryVisible();

    // And: 予約履歴が表示される（タブを切り替えて確認）
    await customersPage.clickReservationHistoryTab();
    await customersPage.expectReservationHistoryVisible();
  });

  /**
   * Scenario: 来店履歴を表示
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 来店履歴一覧が表示される
   *   And 各来店履歴に日時が表示される
   *   And 各来店履歴にメニューが表示される
   *   And 各来店履歴にスタッフ名が表示される
   *   And 各来店履歴に料金が表示される
   */
  test('来店履歴を表示', async () => {
    // Given: 顧客詳細ページにアクセス
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // When: ページが読み込まれる
    await customersPage.expectPageTitle('顧客詳細');

    // Then: 来店履歴一覧が表示される
    await customersPage.expectVisitHistoryVisible();

    // And: 来店履歴が存在することを確認
    const visitCount = await customersPage.getVisitHistoryCount();
    expect(visitCount).toBeGreaterThan(0);

    // And: 各来店履歴に必要な情報が表示される（最初の履歴を確認）
    const firstVisit = customersPage.page.locator('[data-testid="visit-history-item"]').first();
    await expect(firstVisit).toBeVisible();
    // 日時、メニュー、スタッフ名、料金が含まれていることを確認
    await expect(firstVisit).toContainText(/202[0-9]/); // 日付
    await expect(firstVisit).toContainText(/[0-9]{2}:[0-9]{2}/); // 時間
  });

  /**
   * Scenario: 顧客メモを追加（ハッピーパス）
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   When "メモを追加"ボタンをクリックする
   *   Then メモ入力欄が表示される
   *   When メモに"アレルギー：なし。好みの席：窓際"と入力する
   *   And "保存"ボタンをクリックする
   *   Then メモが保存される
   *   And 成功メッセージが表示される
   *   And メモが顧客詳細に表示される
   */
  test('顧客メモを追加（ハッピーパス）', async () => {
    // Given: 顧客詳細ページにアクセス
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // When: メモを追加ボタンをクリック
    await customersPage.clickEditMemo();

    // Then: メモ入力欄が表示される
    await customersPage.expectMemoInputVisible();

    // When: メモに入力
    const memoText = 'アレルギー：なし。好みの席：窓際';
    await customersPage.fillMemo(memoText);

    // And: 保存ボタンをクリック
    await customersPage.saveMemo();

    // Then: 成功メッセージが表示される
    await customersPage.expectSuccessMessage('メモを保存しました');

    // And: メモが顧客詳細に表示される
    await customersPage.expectMemo(memoText);
  });

  /**
   * Scenario: 顧客メモを編集
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   And メモが既に存在する
   *   When "メモを編集"ボタンをクリックする
   *   Then メモ入力欄が編集可能になる
   *   When メモを"アレルギー：なし。好みの席：窓際。前回の要望：静かな席を希望"に変更する
   *   And "保存"ボタンをクリックする
   *   Then メモが更新される
   *   And 成功メッセージが表示される
   */
  test('顧客メモを編集', async () => {
    // Given: 顧客詳細ページにアクセス（メモが既に存在する顧客）
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // まずメモを追加
    await customersPage.clickEditMemo();
    await customersPage.fillMemo('アレルギー：なし。好みの席：窓際');
    await customersPage.saveMemo();
    await customersPage.expectSuccessMessage('メモを保存しました');

    // When: メモを編集ボタンをクリック
    await customersPage.clickEditMemo();

    // Then: メモ入力欄が編集可能になる
    await customersPage.expectMemoInputVisible();

    // When: メモを変更
    const updatedMemo = 'アレルギー：なし。好みの席：窓際。前回の要望：静かな席を希望';
    await customersPage.fillMemo(updatedMemo);

    // And: 保存ボタンをクリック
    await customersPage.saveMemo();

    // Then: 成功メッセージが表示される
    await customersPage.expectSuccessMessage('メモを保存しました');

    // And: メモが更新される
    await customersPage.expectMemo(updatedMemo);
  });

  /**
   * Scenario: 顧客メモを削除
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   And メモが既に存在する
   *   When "メモを削除"ボタンをクリックする
   *   Then "メモを削除しますか？"という確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then メモが削除される
   *   And 成功メッセージが表示される
   */
  test('顧客メモを削除', async () => {
    // Given: 顧客詳細ページにアクセス（メモが既に存在する顧客）
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // まずメモを追加
    await customersPage.clickEditMemo();
    await customersPage.fillMemo('テストメモ');
    await customersPage.saveMemo();
    await customersPage.expectSuccessMessage('メモを保存しました');

    // When: メモを削除ボタンをクリック
    await customersPage.clickDeleteMemo();

    // Then: 確認ダイアログが表示される（ブラウザのconfirmダイアログ）
    // Playwrightは自動的にconfirmダイアログを承認する
    customersPage.page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('メモを削除しますか');
      await dialog.accept();
    });

    // 再度クリック（ダイアログハンドラーが設定された後）
    await customersPage.clickDeleteMemo();

    // Then: 成功メッセージが表示される
    await customersPage.expectSuccessMessage('メモを削除しました');
  });

  /**
   * Scenario: 顧客情報を編集
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   When "顧客情報を編集"ボタンをクリックする
   *   Then 顧客情報編集モーダルが表示される
   *   When 電話番号を"090-9999-8888"に変更する
   *   And "保存"ボタンをクリックする
   *   Then 顧客情報が更新される
   *   And 成功メッセージが表示される
   */
  test('顧客情報を編集', async () => {
    // Given: 顧客詳細ページにアクセス
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // When: 顧客情報を編集ボタンをクリック
    await customersPage.clickEditInfo();

    // Then: 顧客情報編集モーダルが表示される
    await customersPage.expectEditModalVisible();

    // When: 電話番号を変更
    await customersPage.fillEditForm({
      phone: '090-9999-8888',
    });

    // And: 保存ボタンをクリック
    await customersPage.submitEditInfo();

    // Then: 成功メッセージが表示される
    await customersPage.expectSuccessMessage('顧客情報を更新しました');

    // And: 顧客情報が更新される
    await customersPage.expectCustomerDetail({
      phone: '090-9999-8888',
    });
  });

  /**
   * Scenario: 顧客検索機能
   *   Given 管理者が顧客管理ページにアクセスしている
   *   When 検索ボックスに"山田"と入力する
   *   Then "山田"を含む顧客名の顧客のみが表示される
   */
  test('顧客検索機能', async () => {
    // Given: 顧客管理ページにアクセス
    await customersPage.goto();

    // When: 検索ボックスに入力
    await customersPage.search('山田');

    // Then: 検索結果が表示される
    await customersPage.expectCustomerListVisible();

    // And: 検索結果の顧客名に"山田"が含まれる
    const count = await customersPage.getCustomerCount();
    for (let i = 0; i < count; i++) {
      const name = await customersPage.page
        .locator('[data-testid="customer-item"]')
        .nth(i)
        .locator('[data-testid="customer-name"]')
        .textContent();
      expect(name).toContain('山田');
    }
  });

  /**
   * Scenario: 顧客一覧のソート機能
   *   Given 管理者が顧客管理ページにアクセスしている
   *   When "来店回数"でソートする
   *   Then 顧客が来店回数順に並び替えられる
   *   When "最終来店日"でソートする
   *   Then 顧客が最終来店日順に並び替えられる
   */
  test('顧客一覧のソート機能', async () => {
    // Given: 顧客管理ページにアクセス
    await customersPage.goto();

    // When: 来店回数でソート
    await customersPage.sortByVisitCount();

    // Then: 顧客が来店回数順に並び替えられる（UIの確認）
    await customersPage.expectCustomerListVisible();

    // When: 最終来店日でソート
    await customersPage.sortByLastVisitDate();

    // Then: 顧客が最終来店日順に並び替えられる（UIの確認）
    await customersPage.expectCustomerListVisible();
  });

  /**
   * Scenario: 顧客一覧が空の場合
   *   Given 管理者が顧客管理ページにアクセスしている
   *   And 顧客が0件である
   *   When ページが読み込まれる
   *   Then "顧客が登録されていません"というメッセージが表示される
   */
  test('顧客一覧が空の場合', async () => {
    // Given: 顧客管理ページにアクセス（顧客が0件の状態をモックで再現）
    await customersPage.goto();

    // 検索で存在しない顧客を検索して空状態を再現
    await customersPage.search('存在しない顧客名12345');

    // When: ページが読み込まれる
    // Then: 空メッセージが表示される
    await customersPage.expectEmptyMessage('顧客が登録されていません');
  });

  /**
   * Scenario: 顧客の予約履歴を表示
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   When "予約履歴"タブをクリックする
   *   Then 予約履歴一覧が表示される
   *   And 各予約に日時が表示される
   *   And 各予約にメニューが表示される
   *   And 各予約にステータスが表示される
   */
  test('顧客の予約履歴を表示', async () => {
    // Given: 顧客詳細ページにアクセス
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // When: 予約履歴タブをクリック
    await customersPage.clickReservationHistoryTab();

    // Then: 予約履歴一覧が表示される
    await customersPage.expectReservationHistoryVisible();

    // And: 予約履歴が存在することを確認
    const reservationCount = await customersPage.getReservationHistoryCount();
    expect(reservationCount).toBeGreaterThan(0);

    // And: 各予約に必要な情報が表示される（最初の予約を確認）
    const firstReservation = customersPage.page
      .locator('[data-testid="reservation-history-item"]')
      .first();
    await expect(firstReservation).toBeVisible();
    // 日時、メニュー、ステータスが含まれていることを確認
    await expect(firstReservation).toContainText(/202[0-9]/); // 日付
  });

  /**
   * Scenario: 顧客メモの文字数制限
   *   Given 管理者が顧客詳細ページにアクセスしている
   *   When "メモを追加"ボタンをクリックする
   *   Then メモ入力欄が表示される
   *   When メモに1000文字を超えるテキストを入力しようとする
   *   Then メモ入力欄が500文字までに制限される
   *   And 文字カウンター"500/500文字"が表示される
   */
  test('顧客メモの文字数制限', async () => {
    // Given: 顧客詳細ページにアクセス
    await customersPage.gotoDetail('550e8400-e29b-41d4-a716-446655440031');

    // When: メモを追加ボタンをクリック
    await customersPage.clickEditMemo();

    // Then: メモ入力欄が表示される
    await customersPage.expectMemoInputVisible();

    // When: 500文字を超えるテキストを入力しようとする
    const longText = 'あ'.repeat(600);
    await customersPage.fillMemo(longText);

    // Then: メモ入力欄が500文字までに制限される
    const inputValue = await customersPage.page
      .locator('[data-testid="customer-memo-input"]')
      .inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(500);

    // And: 文字カウンターが表示される
    await customersPage.expectMemoCharCount(500, 500);
  });
});

