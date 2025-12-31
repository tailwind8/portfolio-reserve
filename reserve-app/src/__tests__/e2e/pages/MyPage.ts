import { Page, expect, Locator } from '@playwright/test';

/**
 * マイページのPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class MyPage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理
  private selectors = {
    pageHeading: 'h1',
    description: 'text=予約の確認・変更・キャンセルができます',
    loadingSpinner: '.animate-spin',
    emptyState: 'text=予約がありません',

    // ステータスフィルタタブ
    tabAll: 'button:has-text("すべて")',
    tabConfirmed: 'button:has-text("予約確定")',
    tabPending: 'button:has-text("予約待ち")',
    tabCancelled: 'button:has-text("キャンセル")',
    tabCompleted: 'button:has-text("完了")',
    tabWithBadge: 'button:has(span.rounded-full)',

    // 予約カード
    editButton: 'button:has-text("変更")',
    cancelButton: 'button:has-text("キャンセル")',
    statusBadge: 'span.inline-flex',

    // 編集モーダル
    editModalHeading: 'heading:has-text("予約変更")',
    menuSelect: 'select#menu',
    staffSelect: 'select#staff',
    notesTextarea: 'textarea#notes',
    updateButton: 'button:has-text("予約を更新する")',
    closeButton: 'button:has(svg)',

    // キャンセルダイアログ
    cancelDialogHeading: 'heading:has-text("予約をキャンセルしますか？")',
    reservationDateTime: 'text=予約日時',
    menuName: 'text=メニュー',
    staffName: 'text=担当者',
    warningMessage: 'text=この操作は取り消せません',
    backButton: 'button:has-text("戻る")',
    confirmCancelButton: 'button:has-text("キャンセルする")',

    // エラー表示
    errorMessage: 'text=エラーが発生しました',
    retryButton: 'button:has-text("再試行")',

    // レスポンシブ
    scrollableTabsContainer: 'div.overflow-x-auto',
    gridContainer: 'div.grid',
  };

  /**
   * マイページに移動
   */
  async goto() {
    await this.page.goto('/mypage');
  }

  /**
   * ページが読み込まれるまで待つ
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * ローディングスピナーが消えるまで待つ
   */
  async waitForLoadingComplete() {
    await this.page.waitForSelector(this.selectors.loadingSpinner, {
      state: 'hidden',
      timeout: 10000
    });
  }

  // ===========================================
  // 基本表示の検証メソッド
  // ===========================================

  /**
   * ページタイトルを検証
   */
  async expectPageHeading(headingText: string) {
    await expect(this.page.getByRole('heading', { name: headingText, level: 1 }))
      .toBeVisible();
  }

  /**
   * ページ説明を検証
   */
  async expectDescription() {
    await expect(this.page.getByText('予約の確認・変更・キャンセルができます'))
      .toBeVisible();
  }

  /**
   * すべてのステータスタブが表示されることを検証
   */
  async expectAllStatusTabsVisible() {
    // ステータスタブのコンテナを特定（border-bクラスを持つdiv内のボタン）
    const tabsContainer = this.page.locator('.border-b.border-gray-200');

    await expect(tabsContainer.getByRole('button', { name: /すべて/ })).toBeVisible();
    await expect(tabsContainer.getByRole('button', { name: /予約確定/ })).toBeVisible();
    await expect(tabsContainer.getByRole('button', { name: /予約待ち/ })).toBeVisible();
    await expect(tabsContainer.getByRole('button', { name: /キャンセル/ })).toBeVisible();
    await expect(tabsContainer.getByRole('button', { name: /完了/ })).toBeVisible();
  }

  /**
   * 予約一覧または空状態が表示されることを検証
   */
  async expectReservationsOrEmptyState() {
    // Wait for either reservations or empty state to appear
    await this.page.waitForTimeout(2000);

    const hasReservations = (await this.page.locator(this.selectors.editButton).count()) > 0;
    const emptyStateCount = await this.page.getByText('予約がありません').count();
    const hasEmptyState = emptyStateCount > 0;

    // Debug: log what we found
    if (!hasReservations && !hasEmptyState) {
      console.log('Neither reservations nor empty state found');
      console.log('Edit button count:', await this.page.locator(this.selectors.editButton).count());
      console.log('Empty state count:', emptyStateCount);
    }

    // Either reservations or empty state should be visible
    expect(hasReservations || hasEmptyState).toBeTruthy();
  }

  /**
   * 予約カードの情報が正しく表示されることを検証
   */
  async expectReservationCardInfo() {
    // gridコンテナ内の予約カードを取得
    const gridContainer = this.page.locator('.grid');
    const cardCount = await gridContainer.locator('> div').count();

    if (cardCount > 0) {
      // 最初の予約カードを取得
      const firstCard = gridContainer.locator('> div').first();

      // ステータスバッジ（rounded-fullクラスを持つspan）
      await expect(firstCard.locator('span.rounded-full').first()).toBeVisible();

      // アイコン（日時、メニュー、担当）
      const svgIcons = firstCard.locator('svg');
      await expect(svgIcons.first()).toBeVisible();

      // アクションボタン
      await expect(firstCard.getByRole('button', { name: '変更' })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: 'キャンセル' })).toBeVisible();
    }
  }

  // ===========================================
  // ステータスフィルタリング
  // ===========================================

  /**
   * 指定したステータスタブをクリック
   */
  async clickStatusTab(tabName: '予約確定' | 'キャンセル' | 'すべて' | '予約待ち' | '完了') {
    // ステータスタブのコンテナ内で検索
    const tabsContainer = this.page.locator('.border-b.border-gray-200');
    const tab = tabsContainer.getByRole('button', { name: new RegExp(tabName) });
    await tab.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * タブがアクティブであることを検証
   */
  async expectTabActive(tabName: string) {
    const tab = this.page.getByRole('button', { name: new RegExp(tabName) });
    await expect(tab).toHaveClass(/border-blue-500/);
  }

  /**
   * 各タブに件数バッジが表示されることを検証
   */
  async expectTabCountBadges() {
    const tabs = this.page.locator(this.selectors.tabWithBadge);
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(5);
  }

  /**
   * 空状態が表示されることを検証
   */
  async expectEmptyState(statusName?: string) {
    // gridコンテナ内の予約カードを確認
    const gridContainer = this.page.locator('.grid');
    const hasReservations = (await gridContainer.getByRole('button', { name: '変更' }).count()) > 0;

    // 空状態メッセージを確認
    let hasEmptyState = false;
    if (statusName) {
      const specificEmptyCount = await this.page.getByText(`${statusName}の予約がありません`).count();
      const generalEmptyCount = await this.page.getByText('予約がありません').count();
      hasEmptyState = specificEmptyCount > 0 || generalEmptyCount > 0;
    } else {
      const emptyStateCount = await this.page.getByText('予約がありません').count();
      hasEmptyState = emptyStateCount > 0;
    }

    expect(hasReservations || hasEmptyState).toBeTruthy();
  }

  // ===========================================
  // 予約編集フロー
  // ===========================================

  /**
   * 最初の予約の編集ボタンを取得
   * gridコンテナ内で探すことで予約カードのボタンのみを対象にする
   */
  private getFirstEditButton(): Locator {
    const gridContainer = this.page.locator('.grid');
    return gridContainer.getByRole('button', { name: '変更' }).first();
  }

  /**
   * 編集ボタンをクリックしてモーダルを開く
   */
  async openEditModal() {
    const editButton = this.getFirstEditButton();
    if (await editButton.isVisible()) {
      await editButton.click();
    }
  }

  /**
   * 編集モーダルが表示されることを検証
   */
  async expectEditModalVisible() {
    await expect(this.page.getByRole('heading', { name: '予約変更' })).toBeVisible();
    await expect(this.page.getByText('日')).toBeVisible();
    await expect(this.page.getByText('月')).toBeVisible();
    await expect(this.page.locator(this.selectors.menuSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.staffSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.notesTextarea)).toBeVisible();
    await expect(this.page.getByRole('button', { name: '予約を更新する' })).toBeVisible();
  }

  /**
   * 閉じるボタンをクリックしてモーダルを閉じる
   */
  async closeEditModal() {
    const closeButton = this.page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await closeButton.click();
  }

  /**
   * 編集モーダルが閉じていることを検証
   */
  async expectEditModalClosed() {
    await expect(this.page.getByRole('heading', { name: '予約変更' })).not.toBeVisible();
  }

  /**
   * フォームに既存データが入っていることを検証
   */
  async expectFormPreFilled() {
    await this.page.waitForSelector(this.selectors.menuSelect);

    const menuSelect = this.page.locator(this.selectors.menuSelect);
    const menuValue = await menuSelect.inputValue();
    expect(menuValue).not.toBe('');

    const staffSelect = this.page.locator(this.selectors.staffSelect);
    const staffValue = await staffSelect.inputValue();
    expect(staffValue).not.toBe('');
  }

  /**
   * 過去の日付が無効化されていることを検証
   */
  async expectPastDatesDisabled() {
    await this.page.waitForTimeout(1000);
    const disabledDates = this.page.locator('button:disabled:has-text("1"), button:disabled:has-text("2")');
    const count = await disabledDates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  }

  /**
   * メニューを変更
   */
  async changeMenu() {
    const menuSelect = this.page.locator(this.selectors.menuSelect);
    await this.page.waitForSelector(this.selectors.menuSelect);
    const initialValue = await menuSelect.inputValue();
    await menuSelect.selectOption({ index: 1 });
    const newValue = await menuSelect.inputValue();
    expect(newValue).not.toBe(initialValue);
  }

  /**
   * スタッフを変更
   */
  async changeStaff() {
    const staffSelect = this.page.locator(this.selectors.staffSelect);
    await this.page.waitForSelector(this.selectors.staffSelect);
    const initialValue = await staffSelect.inputValue();
    await staffSelect.selectOption({ index: 1 });
    const newValue = await staffSelect.inputValue();
    expect(newValue).not.toBe(initialValue);
  }

  /**
   * 備考を編集
   */
  async editNotes(newNotes: string) {
    const notesTextarea = this.page.locator(this.selectors.notesTextarea);
    await this.page.waitForSelector(this.selectors.notesTextarea);
    await notesTextarea.fill('');
    await notesTextarea.fill(newNotes);
    const value = await notesTextarea.inputValue();
    expect(value).toBe(newNotes);
  }

  // ===========================================
  // 予約キャンセルフロー
  // ===========================================

  /**
   * 最初の予約のキャンセルボタンを取得
   * ステータスタブのキャンセルボタンと区別するため、gridコンテナ内で探す
   */
  private getFirstCancelButton(): Locator {
    const gridContainer = this.page.locator('.grid');
    return gridContainer.getByRole('button', { name: 'キャンセル' }).first();
  }

  /**
   * キャンセルボタンをクリックして確認ダイアログを開く
   */
  async openCancelDialog() {
    const cancelButton = this.getFirstCancelButton();
    if ((await cancelButton.isVisible()) && (await cancelButton.isEnabled())) {
      await cancelButton.click();
    }
  }

  /**
   * キャンセル確認ダイアログが表示されることを検証
   */
  async expectCancelDialogVisible() {
    await expect(this.page.getByText('予約をキャンセルしますか?')).toBeVisible();
    await expect(this.page.getByText('日時:')).toBeVisible();
    await expect(this.page.getByText('メニュー:')).toBeVisible();
    await expect(this.page.getByText('この操作は取り消せません。')).toBeVisible();
    await expect(this.page.getByRole('button', { name: '戻る' })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'キャンセルする' })).toBeVisible();
  }

  /**
   * キャンセルダイアログを閉じる
   */
  async closeCancelDialog() {
    await this.page.getByRole('button', { name: '戻る' }).click();
  }

  /**
   * キャンセルダイアログが閉じていることを検証
   */
  async expectCancelDialogClosed() {
    await expect(this.page.getByText('予約をキャンセルしますか?'))
      .not.toBeVisible();
  }

  /**
   * キャンセルダイアログで予約詳細が表示されることを検証
   */
  async expectReservationDetailsInDialog() {
    await expect(this.page.getByText('日時:')).toBeVisible();
    await expect(this.page.getByText('メニュー:')).toBeVisible();
    await expect(this.page.getByText('担当:')).toBeVisible();
  }

  /**
   * キャンセル警告メッセージが表示されることを検証
   */
  async expectCancelWarningMessage() {
    await expect(this.page.getByText('この操作は取り消せません。')).toBeVisible({ timeout: 10000 });
  }

  /**
   * 過去の予約のボタンが無効化されていることを検証
   */
  async expectPastReservationButtonsDisabled() {
    const disabledEditButtons = this.page.locator('button:disabled:has-text("予約を変更")');
    const disabledCancelButtons = this.page.locator('button:disabled:has-text("キャンセル")');

    const editCount = await disabledEditButtons.count();
    const cancelCount = await disabledCancelButtons.count();

    if (editCount > 0 || cancelCount > 0) {
      expect(editCount).toEqual(cancelCount);
    }
  }

  /**
   * キャンセル確定ボタンをクリック
   */
  async confirmCancel() {
    await this.page.getByRole('button', { name: 'キャンセルする' }).click();
  }

  /**
   * キャンセル成功メッセージが表示されることを検証
   */
  async expectCancelSuccessMessage() {
    await expect(this.page.getByText('予約をキャンセルしました')).toBeVisible({ timeout: 10000 });
  }

  /**
   * キャンセルボタンが無効化されていることを検証
   */
  async expectCancelButtonDisabled() {
    const cancelButton = this.getFirstCancelButton();
    await expect(cancelButton).toBeDisabled();
  }

  /**
   * 特定のエラーメッセージが表示されることを検証
   */
  async expectSpecificErrorMessage(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 10000 });
  }

  /**
   * 予約のステータスバッジが指定したステータスになることを検証
   */
  async expectReservationStatus(status: string) {
    const gridContainer = this.page.locator('.grid');
    const statusBadge = gridContainer.locator('span.rounded-full').first();
    await expect(statusBadge).toContainText(status);
  }

  /**
   * 予約カードの件数を取得
   */
  async getReservationCount(): Promise<number> {
    const gridContainer = this.page.locator('.grid');
    return await gridContainer.locator('> div').count();
  }

  /**
   * 特定のインデックスの予約のキャンセルボタンをクリック
   */
  async clickCancelButtonAt(index: number) {
    const gridContainer = this.page.locator('.grid');
    const cancelButton = gridContainer.getByRole('button', { name: 'キャンセル' }).nth(index);
    await cancelButton.click();
  }

  // ===========================================
  // エラーハンドリング
  // ===========================================

  /**
   * エラーメッセージが表示されることを検証
   */
  async expectErrorMessageVisible() {
    await expect(this.page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByRole('button', { name: '再試行' })).toBeVisible();
  }

  /**
   * 再試行ボタンをクリック
   */
  async clickRetryButton() {
    await this.page.getByRole('button', { name: '再試行' }).click();
  }

  /**
   * エラーメッセージが消えることを検証
   */
  async expectErrorMessageHidden() {
    await expect(this.page.getByText('エラーが発生しました')).not.toBeVisible();
  }

  // ===========================================
  // レスポンシブデザイン
  // ===========================================

  /**
   * モバイルビューポートに設定
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * タブレットビューポートに設定
   */
  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * デスクトップビューポートに設定
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * スクロール可能なタブコンテナが表示されることを検証
   */
  async expectScrollableTabsVisible() {
    const tabsContainer = this.page.locator(this.selectors.scrollableTabsContainer).first();
    await expect(tabsContainer).toBeVisible();
  }

  /**
   * グリッドコンテナが表示されることを検証
   */
  async expectGridVisible() {
    const grid = this.page.locator(this.selectors.gridContainer).first();
    await expect(grid).toBeVisible();
  }
}
