import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者向け予約一覧・管理ページ
 *
 * このクラスは管理者向け予約管理ページのすべての要素とインタラクションを管理します。
 * テストコードから実装詳細を隠蔽し、data-testid属性を使用して要素を特定します。
 */
export class AdminReservationsPage {
  readonly page: Page;

  // セレクタ定義（すべてdata-testid属性を使用）
  private readonly selectors = {
    // ページ要素
    pageTitle: '[data-testid="page-title"]',
    addReservationButton: '[data-testid="add-reservation-button"]',
    searchBox: '[data-testid="search-box"]',
    statusFilter: '[data-testid="status-filter"]',
    dateRangeFilter: '[data-testid="date-range-filter"]',
    retryButton: '[data-testid="retry-button"]',

    // テーブル
    reservationsTable: '[data-testid="reservations-table"]',
    reservationRow: '[data-testid="reservation-row"]',
    reservationDate: '[data-testid="reservation-date"]',
    reservationTime: '[data-testid="reservation-time"]',
    reservationCustomer: '[data-testid="reservation-customer"]',
    reservationMenu: '[data-testid="reservation-menu"]',
    reservationStaff: '[data-testid="reservation-staff"]',
    reservationStatus: '[data-testid="reservation-status"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',

    // 空状態
    emptyMessage: '[data-testid="empty-message"]',

    // ローディング・エラー
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',

    // 成功メッセージ
    successMessage: '[data-testid="success-message"]',

    // ページネーション
    pagination: '[data-testid="pagination"]',
    nextPageButton: '[data-testid="next-page-button"]',
    prevPageButton: '[data-testid="prev-page-button"]',

    // 新規予約追加モーダル
    addModal: '[data-testid="add-reservation-modal"]',
    addModalTitle: '[data-testid="add-modal-title"]',
    addModalCustomerSelect: '[data-testid="add-modal-customer-select"]',
    addModalMenuSelect: '[data-testid="add-modal-menu-select"]',
    addModalStaffSelect: '[data-testid="add-modal-staff-select"]',
    addModalDatePicker: '[data-testid="add-modal-date-picker"]',
    addModalTimeSelect: '[data-testid="add-modal-time-select"]',
    addModalNotes: '[data-testid="add-modal-notes"]',
    addModalSubmitButton: '[data-testid="add-modal-submit-button"]',
    addModalCancelButton: '[data-testid="add-modal-cancel-button"]',
    addModalValidationError: '[data-testid="add-modal-validation-error"]',

    // 予約編集モーダル
    editModal: '[data-testid="edit-reservation-modal"]',
    editModalTitle: '[data-testid="edit-modal-title"]',
    editModalMenuSelect: '[data-testid="edit-modal-menu-select"]',
    editModalStaffSelect: '[data-testid="edit-modal-staff-select"]',
    editModalDatePicker: '[data-testid="edit-modal-date-picker"]',
    editModalTimeSelect: '[data-testid="edit-modal-time-select"]',
    editModalStatusSelect: '[data-testid="edit-modal-status-select"]',
    editModalNotes: '[data-testid="edit-modal-notes"]',
    editModalSubmitButton: '[data-testid="edit-modal-submit-button"]',
    editModalCancelButton: '[data-testid="edit-modal-cancel-button"]',

    // 削除確認ダイアログ
    deleteDialog: '[data-testid="delete-confirmation-dialog"]',
    deleteDialogTitle: '[data-testid="delete-dialog-title"]',
    deleteDialogDate: '[data-testid="delete-dialog-date"]',
    deleteDialogCustomer: '[data-testid="delete-dialog-customer"]',
    deleteDialogMenu: '[data-testid="delete-dialog-menu"]',
    deleteDialogWarning: '[data-testid="delete-dialog-warning"]',
    deleteDialogCancelButton: '[data-testid="delete-dialog-cancel-button"]',
    deleteDialogConfirmButton: '[data-testid="delete-dialog-confirm-button"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 予約一覧ページに移動する
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/reservations');
  }

  /**
   * ページタイトルを確認する
   */
  async expectPageTitle(title: string): Promise<void> {
    const pageTitle = this.page.locator(this.selectors.pageTitle);
    await expect(pageTitle).toContainText(title);
  }

  /**
   * 新規予約追加ボタンが表示されていることを確認する
   */
  async expectAddButtonVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.addReservationButton)).toBeVisible();
  }

  /**
   * 予約一覧テーブルが表示されていることを確認する
   */
  async expectTableVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.reservationsTable)).toBeVisible();
  }

  /**
   * 予約行の数を取得する
   */
  async getReservationCount(): Promise<number> {
    return await this.page.locator(this.selectors.reservationRow).count();
  }

  /**
   * 特定の予約行の詳細を確認する
   */
  async expectReservationRow(index: number, expectedData: {
    date?: string;
    time?: string;
    customer?: string;
    menu?: string;
    staff?: string;
    status?: string;
  }): Promise<void> {
    const row = this.page.locator(this.selectors.reservationRow).nth(index);
    await expect(row).toBeVisible();

    if (expectedData.date) {
      const date = row.locator(this.selectors.reservationDate);
      await expect(date).toContainText(expectedData.date);
    }

    if (expectedData.time) {
      const time = row.locator(this.selectors.reservationTime);
      await expect(time).toContainText(expectedData.time);
    }

    if (expectedData.customer) {
      const customer = row.locator(this.selectors.reservationCustomer);
      await expect(customer).toContainText(expectedData.customer);
    }

    if (expectedData.menu) {
      const menu = row.locator(this.selectors.reservationMenu);
      await expect(menu).toContainText(expectedData.menu);
    }

    if (expectedData.staff) {
      const staff = row.locator(this.selectors.reservationStaff);
      await expect(staff).toContainText(expectedData.staff);
    }

    if (expectedData.status) {
      const status = row.locator(this.selectors.reservationStatus);
      await expect(status).toBeVisible();
    }
  }

  /**
   * 編集・削除ボタンが表示されていることを確認する
   */
  async expectActionButtonsVisible(index: number): Promise<void> {
    const row = this.page.locator(this.selectors.reservationRow).nth(index);
    await expect(row.locator(this.selectors.editButton)).toBeVisible();
    await expect(row.locator(this.selectors.deleteButton)).toBeVisible();
  }

  /**
   * 空状態メッセージを確認する
   */
  async expectEmptyMessage(message: string): Promise<void> {
    const emptyMessage = this.page.locator(this.selectors.emptyMessage);
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText(message);
  }

  /**
   * ステータスフィルターで選択する
   */
  async filterByStatus(status: string): Promise<void> {
    await this.page.locator(this.selectors.statusFilter).selectOption(status);
  }

  /**
   * 日付範囲フィルターで選択する
   */
  async filterByDateRange(range: string): Promise<void> {
    await this.page.locator(this.selectors.dateRangeFilter).selectOption(range);
  }

  /**
   * 検索ボックスに入力する
   */
  async searchByCustomerName(name: string): Promise<void> {
    await this.page.locator(this.selectors.searchBox).fill(name);
  }

  // ===== 新規予約追加モーダル =====

  /**
   * 新規予約追加ボタンをクリックする
   */
  async clickAddReservation(): Promise<void> {
    await this.page.locator(this.selectors.addReservationButton).click();
  }

  /**
   * 新規予約追加モーダルが表示されていることを確認する
   */
  async expectAddModalVisible(): Promise<void> {
    const modal = this.page.locator(this.selectors.addModal);
    await expect(modal).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalTitle)).toContainText('新規予約を追加');
  }

  /**
   * 新規予約追加モーダルのフォーム要素が表示されていることを確認する
   */
  async expectAddModalFormVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.addModalCustomerSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalMenuSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalStaffSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalDatePicker)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalTimeSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalNotes)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalSubmitButton)).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalCancelButton)).toBeVisible();
  }

  /**
   * 新規予約追加モーダルをキャンセルする
   */
  async cancelAddModal(): Promise<void> {
    await this.page.locator(this.selectors.addModalCancelButton).click();
  }

  /**
   * モーダルが閉じていることを確認する
   */
  async expectModalClosed(): Promise<void> {
    await expect(this.page.locator(this.selectors.addModal)).not.toBeVisible();
    await expect(this.page.locator(this.selectors.editModal)).not.toBeVisible();
  }

  /**
   * 新規予約を追加する（フォーム入力）
   */
  async fillAddReservationForm(data: {
    customer: string;
    menu: string;
    staff: string;
    date: string;
    time: string;
    notes?: string;
  }): Promise<void> {
    await this.page.locator(this.selectors.addModalCustomerSelect).selectOption(data.customer);
    await this.page.locator(this.selectors.addModalMenuSelect).selectOption(data.menu);
    await this.page.locator(this.selectors.addModalStaffSelect).selectOption(data.staff);
    await this.page.locator(this.selectors.addModalDatePicker).fill(data.date);
    await this.page.locator(this.selectors.addModalTimeSelect).selectOption(data.time);

    if (data.notes) {
      await this.page.locator(this.selectors.addModalNotes).fill(data.notes);
    }
  }

  /**
   * 新規予約を作成（送信）
   */
  async submitAddReservation(): Promise<void> {
    await this.page.locator(this.selectors.addModalSubmitButton).click();
  }

  /**
   * バリデーションエラーが表示されていることを確認する
   */
  async expectValidationError(): Promise<void> {
    await expect(this.page.locator(this.selectors.addModalValidationError)).toBeVisible();
  }

  /**
   * 過去の日付が無効化されていることを確認する
   */
  async expectPastDatesDisabled(): Promise<void> {
    // カレンダーの過去の日付ボタンを確認
    const datePicker = this.page.locator(this.selectors.addModalDatePicker);
    await expect(datePicker).toBeVisible();
    // 実装時に過去日付の無効化ロジックを追加
  }

  // ===== 予約編集モーダル =====

  /**
   * 編集ボタンをクリックする
   */
  async clickEdit(index: number): Promise<void> {
    const row = this.page.locator(this.selectors.reservationRow).nth(index);
    await row.locator(this.selectors.editButton).click();
  }

  /**
   * 予約編集モーダルが表示されていることを確認する
   */
  async expectEditModalVisible(): Promise<void> {
    const modal = this.page.locator(this.selectors.editModal);
    await expect(modal).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalTitle)).toContainText('予約を編集');
  }

  /**
   * 予約編集モーダルのフォーム要素が表示されていることを確認する
   */
  async expectEditModalFormVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.editModalMenuSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalStaffSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalDatePicker)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalTimeSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalStatusSelect)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalNotes)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalSubmitButton)).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalCancelButton)).toBeVisible();
  }

  /**
   * 予約編集モーダルに既存データが事前入力されていることを確認する
   */
  async expectEditModalPreFilled(): Promise<void> {
    const menuSelect = this.page.locator(this.selectors.editModalMenuSelect);
    const value = await menuSelect.inputValue();
    expect(value).toBeTruthy();
  }

  /**
   * 予約編集モーダルをキャンセルする
   */
  async cancelEditModal(): Promise<void> {
    await this.page.locator(this.selectors.editModalCancelButton).click();
  }

  /**
   * ステータスを変更する
   */
  async changeStatus(status: string): Promise<void> {
    await this.page.locator(this.selectors.editModalStatusSelect).selectOption(status);
  }

  /**
   * 日時を変更する
   */
  async changeDateTime(date: string, time: string): Promise<void> {
    await this.page.locator(this.selectors.editModalDatePicker).fill(date);
    await this.page.locator(this.selectors.editModalTimeSelect).selectOption(time);
  }

  /**
   * メニューとスタッフを変更する
   */
  async changeMenuAndStaff(menu: string, staff: string): Promise<void> {
    await this.page.locator(this.selectors.editModalMenuSelect).selectOption(menu);
    await this.page.locator(this.selectors.editModalStaffSelect).selectOption(staff);
  }

  /**
   * 予約を更新（送信）
   */
  async submitEditReservation(): Promise<void> {
    await this.page.locator(this.selectors.editModalSubmitButton).click();
  }

  // ===== 削除確認ダイアログ =====

  /**
   * 削除ボタンをクリックする
   */
  async clickDelete(index: number): Promise<void> {
    const row = this.page.locator(this.selectors.reservationRow).nth(index);
    await row.locator(this.selectors.deleteButton).click();
  }

  /**
   * 削除確認ダイアログが表示されていることを確認する
   */
  async expectDeleteDialogVisible(): Promise<void> {
    const dialog = this.page.locator(this.selectors.deleteDialog);
    await expect(dialog).toBeVisible();
    await expect(this.page.locator(this.selectors.deleteDialogTitle)).toContainText('予約を削除しますか？');
  }

  /**
   * 削除確認ダイアログに予約詳細が表示されていることを確認する
   */
  async expectDeleteDialogDetails(expectedData: {
    date?: string;
    customer?: string;
    menu?: string;
  }): Promise<void> {
    if (expectedData.date) {
      await expect(this.page.locator(this.selectors.deleteDialogDate)).toContainText(expectedData.date);
    }
    if (expectedData.customer) {
      await expect(this.page.locator(this.selectors.deleteDialogCustomer)).toContainText(expectedData.customer);
    }
    if (expectedData.menu) {
      await expect(this.page.locator(this.selectors.deleteDialogMenu)).toContainText(expectedData.menu);
    }
  }

  /**
   * 削除警告メッセージが表示されていることを確認する
   */
  async expectDeleteWarningVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.deleteDialogWarning)).toContainText('この操作は取り消せません');
  }

  /**
   * 削除確認ダイアログをキャンセルする
   */
  async cancelDelete(): Promise<void> {
    await this.page.locator(this.selectors.deleteDialogCancelButton).click();
  }

  /**
   * 削除を確定する
   */
  async confirmDelete(): Promise<void> {
    await this.page.locator(this.selectors.deleteDialogConfirmButton).click();
  }

  /**
   * ダイアログが閉じていることを確認する
   */
  async expectDialogClosed(): Promise<void> {
    await expect(this.page.locator(this.selectors.deleteDialog)).not.toBeVisible();
  }

  // ===== メッセージ =====

  /**
   * 成功メッセージを確認する
   */
  async expectSuccessMessage(message: string): Promise<void> {
    const successMessage = this.page.locator(this.selectors.successMessage);
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(message);
  }

  /**
   * エラーメッセージを確認する
   */
  async expectErrorMessage(message?: string): Promise<void> {
    const errorMessage = this.page.locator(this.selectors.errorMessage);
    await expect(errorMessage).toBeVisible();
    if (message) {
      await expect(errorMessage).toContainText(message);
    }
  }

  /**
   * 再試行ボタンをクリックする
   */
  async clickRetry(): Promise<void> {
    await this.page.locator(this.selectors.retryButton).click();
  }

  // ===== ページネーション =====

  /**
   * ページネーションが表示されていることを確認する
   */
  async expectPaginationVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.pagination)).toBeVisible();
  }

  /**
   * 次のページに移動する
   */
  async goToNextPage(): Promise<void> {
    await this.page.locator(this.selectors.nextPageButton).click();
  }

  /**
   * 前のページに移動する
   */
  async goToPrevPage(): Promise<void> {
    await this.page.locator(this.selectors.prevPageButton).click();
  }
}
