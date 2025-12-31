import { test, expect } from '@playwright/test';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { setupMSW } from './msw-setup';

/**
 * Feature: スタッフ管理
 * Issue: #21, #22
 *
 * ユーザーストーリー:
 * As a store admin
 * I want to manage staff members and their shifts
 * So that I can schedule reservations effectively
 *
 * Gherkinシナリオ: features/admin/staff.feature
 */

test.describe('スタッフ管理 (#21)', () => {
  let staffPage: AdminStaffPage;

  test.beforeEach(async ({ page }) => {
    // MSW API モックをセットアップ
    await setupMSW(page);

    staffPage = new AdminStaffPage(page);
    // TODO: 管理者ログイン処理を実装後に追加（Issue #7）
    // 現在はログイン不要でスタッフ管理ページに直接アクセス
    await staffPage.goto();
  });

  /**
   * Scenario: スタッフ一覧を表示（ハッピーパス）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   When ページが読み込まれる
   *   Then すべてのスタッフが一覧表示される
   *   And 各スタッフに名前が表示される
   *   And 各スタッフにメールアドレスが表示される
   *   And 各スタッフに電話番号が表示される
   *   And 各スタッフの出勤状況が表示される
   */
  test('スタッフ一覧を表示（ハッピーパス）', async () => {
    // Then: ページタイトルが表示される
    await staffPage.expectPageTitle('スタッフ管理');

    // And: スタッフ追加ボタンが表示される
    await staffPage.expectAddButtonVisible();

    // And: スタッフ一覧が表示される
    await staffPage.expectStaffListVisible();

    // And: スタッフ件数を確認
    const count = await staffPage.getStaffCount();
    expect(count).toBeGreaterThan(0);

    // And: 最初のスタッフに必要な情報がすべて表示される
    await staffPage.expectStaffItem(0, {
      name: '田中太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      status: '勤務中',
    });
  });

  /**
   * Scenario: スタッフを追加（ハッピーパス）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   When "スタッフを追加"ボタンをクリックする
   *   Then スタッフ追加モーダルが表示される
   *   When 名前に"佐藤花子"を入力する
   *   And メールアドレスに"sato@example.com"を入力する
   *   And 電話番号に"090-1111-2222"を入力する
   *   And "追加"ボタンをクリックする
   *   Then スタッフが追加される
   *   And 成功メッセージが表示される
   *   And スタッフ一覧に新しいスタッフが表示される
   */
  test('スタッフを追加（ハッピーパス）', async () => {
    // When: スタッフ追加ボタンをクリック
    await staffPage.clickAddStaff();

    // Then: スタッフ追加モーダルが表示される
    await staffPage.expectAddModalVisible();

    // When: フォームに入力
    await staffPage.fillAddStaffForm({
      name: '佐藤花子',
      email: 'sato@example.com',
      phone: '090-1111-2222',
    });

    // And: 追加ボタンをクリック
    await staffPage.submitAddStaff();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('スタッフを追加しました');

    // And: モーダルが閉じる
    await staffPage.expectModalClosed();

    // And: 新しいスタッフが一覧に表示される
    await staffPage.expectStaffItem(0, {
      name: '佐藤花子',
      email: 'sato@example.com',
      phone: '090-1111-2222',
    });
  });

  /**
   * Scenario: スタッフ追加失敗（必須項目未入力）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   When "スタッフを追加"ボタンをクリックする
   *   Then スタッフ追加モーダルが表示される
   *   When 何も入力せずに"追加"ボタンをクリックする
   *   Then エラーメッセージ"名前を入力してください"が表示される
   *   And エラーメッセージ"メールアドレスを入力してください"が表示される
   *   And スタッフは追加されない
   */
  test('スタッフ追加失敗（必須項目未入力）', async () => {
    // When: スタッフ追加ボタンをクリック
    await staffPage.clickAddStaff();

    // Then: スタッフ追加モーダルが表示される
    await staffPage.expectAddModalVisible();

    // When: 何も入力せずに追加ボタンをクリック
    await staffPage.submitAddStaff();

    // Then: エラーメッセージが表示される
    await staffPage.expectValidationError('名前を入力してください');
    await staffPage.expectValidationError('メールアドレスを入力してください');

    // And: モーダルはまだ開いている
    await expect(staffPage.page.locator('[data-testid="add-staff-modal"]')).toBeVisible();
  });

  /**
   * Scenario: スタッフ追加失敗（メールアドレス重複）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And メールアドレス"sato@example.com"のスタッフが既に存在する
   *   When "スタッフを追加"ボタンをクリックする
   *   Then スタッフ追加モーダルが表示される
   *   When 名前に"佐藤花子"を入力する
   *   And メールアドレスに"sato@example.com"を入力する
   *   And "追加"ボタンをクリックする
   *   Then エラーメッセージ"このメールアドレスは既に登録されています"が表示される
   *   And スタッフは追加されない
   */
  test('スタッフ追加失敗（メールアドレス重複）', async () => {
    // Given: メールアドレス"sato@example.com"のスタッフが既に存在する（APIモックで提供）

    // When: スタッフ追加ボタンをクリック
    await staffPage.clickAddStaff();

    // Then: スタッフ追加モーダルが表示される
    await staffPage.expectAddModalVisible();

    // When: 既存のメールアドレスでフォームに入力
    await staffPage.fillAddStaffForm({
      name: '佐藤花子',
      email: 'sato@example.com',
    });

    // And: 追加ボタンをクリック
    await staffPage.submitAddStaff();

    // Then: エラーメッセージが表示される
    await staffPage.expectErrorMessage('このメールアドレスは既に登録されています');
  });

  /**
   * Scenario: スタッフを編集（ハッピーパス）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And スタッフが1件以上存在する
   *   When スタッフを選択する
   *   And "編集"ボタンをクリックする
   *   Then スタッフ編集モーダルが表示される
   *   When 電話番号を"090-3333-4444"に変更する
   *   And "保存"ボタンをクリックする
   *   Then スタッフ情報が更新される
   *   And 成功メッセージが表示される
   */
  test('スタッフを編集（ハッピーパス）', async () => {
    // When: 編集ボタンをクリック
    await staffPage.clickEdit(0);

    // Then: スタッフ編集モーダルが表示される
    await staffPage.expectEditModalVisible();

    // When: 電話番号を変更
    await staffPage.changePhone('090-3333-4444');

    // And: 保存ボタンをクリック
    await staffPage.submitEditStaff();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('スタッフ情報を更新しました');

    // And: モーダルが閉じる
    await staffPage.expectModalClosed();

    // And: 更新されたスタッフ情報が表示される
    await staffPage.expectStaffItem(0, {
      phone: '090-3333-4444',
    });
  });

  /**
   * Scenario: スタッフを削除（ハッピーパス）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And スタッフが1件以上存在する
   *   When スタッフを選択する
   *   And "削除"ボタンをクリックする
   *   Then "スタッフを削除しますか？"という確認ダイアログが表示される
   *   When 確認ダイアログで"はい"を選択する
   *   Then スタッフが削除される
   *   And 成功メッセージが表示される
   *   And スタッフ一覧から該当スタッフが削除される
   */
  test('スタッフを削除（ハッピーパス）', async () => {
    // 初期のスタッフ数を取得
    const initialCount = await staffPage.getStaffCount();

    // When: 削除ボタンをクリック
    await staffPage.clickDelete(0);

    // Then: 削除確認ダイアログが表示される
    await staffPage.expectDeleteDialogVisible();

    // When: 削除を確定
    await staffPage.confirmDelete();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('スタッフを削除しました');

    // And: ダイアログが閉じる
    await staffPage.expectDialogClosed();

    // And: スタッフ数が減っている
    const newCount = await staffPage.getStaffCount();
    expect(newCount).toBe(initialCount - 1);
  });

  /**
   * Scenario: スタッフ削除失敗（予約が存在する）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And スタッフが1件以上存在する
   *   And 該当スタッフに予約が存在する
   *   When スタッフを選択する
   *   And "削除"ボタンをクリックしようとする
   *   Then "削除"ボタンが無効化されている
   *   And エラーメッセージ"予約が存在するため削除できません"が表示される
   */
  test('スタッフ削除失敗（予約が存在する）', async () => {
    // Given: スタッフに予約が存在する（APIモックで提供）

    // Then: 削除ボタンが無効化されている
    await staffPage.expectDeleteButtonDisabled(0);

    // And: エラーメッセージが表示される
    await staffPage.expectErrorMessage('予約が存在するため削除できません');
  });

  /**
   * Scenario: スタッフの出勤状況を表示
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   When ページが読み込まれる
   *   Then 各スタッフの出勤状況が表示される
   *   And "勤務中"のスタッフには緑色のインジケータが表示される
   *   And "休憩中"のスタッフには黄色のインジケータが表示される
   *   And "退勤"のスタッフには灰色のインジケータが表示される
   */
  test('スタッフの出勤状況を表示', async () => {
    // Then: 各スタッフの出勤状況が表示される
    await staffPage.expectStaffItem(0, { status: '勤務中' });

    // And: 勤務中のスタッフには緑色のインジケータ
    await staffPage.expectStatusIndicator(0, 'green');

    // TODO: 休憩中、退勤のスタッフをAPIモックで追加して確認
  });

  /**
   * Scenario: スタッフ一覧が空の場合
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And スタッフが0件である
   *   When ページが読み込まれる
   *   Then "スタッフが登録されていません"というメッセージが表示される
   */
  test('スタッフ一覧が空の場合', async () => {
    // TODO: APIモックでスタッフ0件を返すように設定

    // Then: 空状態メッセージが表示される
    // await staffPage.expectEmptyMessage('スタッフが登録されていません');
  });

  /**
   * Scenario: スタッフ検索機能
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   When 検索ボックスに"佐藤"と入力する
   *   Then "佐藤"を含むスタッフ名のスタッフのみが表示される
   */
  test('スタッフ検索機能', async () => {
    // When: 検索ボックスに入力
    await staffPage.searchByName('佐藤');

    // Then: 佐藤を含むスタッフのみが表示される
    const count = await staffPage.getStaffCount();
    expect(count).toBeGreaterThan(0);

    await staffPage.expectStaffItem(0, {
      name: '佐藤',
    });
  });
});

/**
 * Feature: スタッフシフト設定
 * Issue: #22
 */
test.describe('スタッフシフト設定 (#22)', () => {
  let staffPage: AdminStaffPage;

  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    staffPage = new AdminStaffPage(page);
    await staffPage.goto();
  });

  /**
   * Scenario: スタッフシフト設定（ハッピーパス）
   *   Given 管理者がスタッフ管理ページにアクセスしている
   *   And スタッフが1件以上存在する
   *   When スタッフを選択する
   *   And "シフト設定"ボタンをクリックする
   *   Then シフト設定モーダルが表示される
   *   When 月曜日の出勤時間"09:00"を設定する
   *   And 月曜日の退勤時間"18:00"を設定する
   *   And 月曜日のチェックボックスをチェックする
   *   And "保存"ボタンをクリックする
   *   Then シフトが保存される
   *   And 成功メッセージが表示される
   */
  test('スタッフシフト設定（ハッピーパス）', async () => {
    // When: シフト設定ボタンをクリック
    await staffPage.clickShiftSetting(0);

    // Then: シフト設定モーダルが表示される
    await staffPage.expectShiftModalVisible();

    // When: 月曜日のシフトを設定
    await staffPage.checkDayOfWeek('月曜日');
    await staffPage.setStartTime('月曜日', '09:00');
    await staffPage.setEndTime('月曜日', '18:00');

    // And: 保存ボタンをクリック
    await staffPage.submitShiftSetting();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('シフトを保存しました');

    // And: モーダルが閉じる
    await staffPage.expectModalClosed();
  });

  /**
   * Scenario: スタッフシフト設定（複数曜日）
   */
  test('スタッフシフト設定（複数曜日）', async () => {
    // When: シフト設定ボタンをクリック
    await staffPage.clickShiftSetting(0);

    // Then: シフト設定モーダルが表示される
    await staffPage.expectShiftModalVisible();

    // When: 月曜日と水曜日のシフトを設定
    await staffPage.checkDayOfWeek('月曜日');
    await staffPage.setStartTime('月曜日', '09:00');
    await staffPage.setEndTime('月曜日', '18:00');

    await staffPage.checkDayOfWeek('水曜日');
    await staffPage.setStartTime('水曜日', '10:00');
    await staffPage.setEndTime('水曜日', '19:00');

    // And: 保存ボタンをクリック
    await staffPage.submitShiftSetting();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('シフトを保存しました');
  });

  /**
   * Scenario: スタッフシフト設定（休暇設定）
   */
  test('スタッフシフト設定（休暇設定）', async () => {
    // When: シフト設定ボタンをクリック
    await staffPage.clickShiftSetting(0);

    // Then: シフト設定モーダルが表示される
    await staffPage.expectShiftModalVisible();

    // When: 休暇設定タブをクリック
    await staffPage.clickVacationTab();

    // And: 休暇期間を設定
    await staffPage.setVacationPeriod('2025-01-25', '2025-01-27');

    // And: 保存ボタンをクリック
    await staffPage.submitShiftSetting();

    // Then: 成功メッセージが表示される
    await staffPage.expectSuccessMessage('休暇を設定しました');
  });

  /**
   * Scenario: スタッフシフト設定（時間外設定）
   *   When 月曜日の出勤時間"22:00"を設定する
   *   And 月曜日の退勤時間"09:00"を設定する
   *   And "保存"ボタンをクリックする
   *   Then エラーメッセージ"退勤時間は出勤時間より後である必要があります"が表示される
   *   And シフトは保存されない
   */
  test('スタッフシフト設定（時間外設定）', async () => {
    // When: シフト設定ボタンをクリック
    await staffPage.clickShiftSetting(0);

    // Then: シフト設定モーダルが表示される
    await staffPage.expectShiftModalVisible();

    // When: 不正な時間を設定
    await staffPage.checkDayOfWeek('月曜日');
    await staffPage.setStartTime('月曜日', '22:00');
    await staffPage.setEndTime('月曜日', '09:00');

    // And: 保存ボタンをクリック
    await staffPage.submitShiftSetting();

    // Then: エラーメッセージが表示される
    await staffPage.expectShiftValidationError('退勤時間は出勤時間より後である必要があります');

    // And: モーダルはまだ開いている
    await expect(staffPage.page.locator('[data-testid="shift-setting-modal"]')).toBeVisible();
  });
});
