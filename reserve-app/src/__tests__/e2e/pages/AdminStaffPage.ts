import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者向けスタッフ管理ページ
 *
 * このクラスは管理者向けスタッフ管理ページのすべての要素とインタラクションを管理します。
 * テストコードから実装詳細を隠蔽し、data-testid属性を使用して要素を特定します。
 */
export class AdminStaffPage {
  readonly page: Page;

  // セレクタ定義（すべてdata-testid属性を使用）
  private readonly selectors = {
    // ページ要素
    pageTitle: '[data-testid="page-title"]',
    addStaffButton: '[data-testid="add-staff-button"]',
    searchBox: '[data-testid="search-box"]',

    // スタッフ一覧
    staffList: '[data-testid="staff-list"]',
    staffItem: '[data-testid="staff-item"]',
    staffName: '[data-testid="staff-name"]',
    staffEmail: '[data-testid="staff-email"]',
    staffPhone: '[data-testid="staff-phone"]',
    staffStatus: '[data-testid="staff-status"]',
    staffStatusIndicator: '[data-testid="staff-status-indicator"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]',
    shiftButton: '[data-testid="shift-button"]',

    // 空状態
    emptyMessage: '[data-testid="empty-message"]',

    // ローディング・エラー
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',

    // 成功メッセージ
    successMessage: '[data-testid="success-message"]',

    // スタッフ追加モーダル
    addModal: '[data-testid="add-staff-modal"]',
    addModalTitle: '[data-testid="add-modal-title"]',
    addModalNameInput: '[data-testid="add-modal-name-input"]',
    addModalEmailInput: '[data-testid="add-modal-email-input"]',
    addModalPhoneInput: '[data-testid="add-modal-phone-input"]',
    addModalSubmitButton: '[data-testid="add-modal-submit-button"]',
    addModalCancelButton: '[data-testid="add-modal-cancel-button"]',
    addModalValidationError: '[data-testid="add-modal-validation-error"]',

    // スタッフ編集モーダル
    editModal: '[data-testid="edit-staff-modal"]',
    editModalTitle: '[data-testid="edit-modal-title"]',
    editModalNameInput: '[data-testid="edit-modal-name-input"]',
    editModalEmailInput: '[data-testid="edit-modal-email-input"]',
    editModalPhoneInput: '[data-testid="edit-modal-phone-input"]',
    editModalSubmitButton: '[data-testid="edit-modal-submit-button"]',
    editModalCancelButton: '[data-testid="edit-modal-cancel-button"]',

    // 削除確認ダイアログ
    deleteDialog: '[data-testid="delete-confirmation-dialog"]',
    deleteDialogTitle: '[data-testid="delete-dialog-title"]',
    deleteDialogMessage: '[data-testid="delete-dialog-message"]',
    deleteDialogCancelButton: '[data-testid="delete-dialog-cancel-button"]',
    deleteDialogConfirmButton: '[data-testid="delete-dialog-confirm-button"]',

    // シフト設定モーダル
    shiftModal: '[data-testid="shift-setting-modal"]',
    shiftModalTitle: '[data-testid="shift-modal-title"]',
    shiftModalDayCheckbox: '[data-testid="shift-day-checkbox"]', // 曜日チェックボックス
    shiftModalStartTime: '[data-testid="shift-start-time"]',
    shiftModalEndTime: '[data-testid="shift-end-time"]',
    shiftModalSubmitButton: '[data-testid="shift-modal-submit-button"]',
    shiftModalCancelButton: '[data-testid="shift-modal-cancel-button"]',
    shiftModalValidationError: '[data-testid="shift-modal-validation-error"]',

    // 休暇設定タブ
    vacationTab: '[data-testid="vacation-tab"]',
    vacationStartDate: '[data-testid="vacation-start-date"]',
    vacationEndDate: '[data-testid="vacation-end-date"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * スタッフ管理ページに移動する
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/staff');
  }

  /**
   * ページタイトルを確認する
   */
  async expectPageTitle(title: string): Promise<void> {
    const pageTitle = this.page.locator(this.selectors.pageTitle);
    await expect(pageTitle).toContainText(title);
  }

  /**
   * スタッフ追加ボタンが表示されていることを確認する
   */
  async expectAddButtonVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.addStaffButton)).toBeVisible();
  }

  /**
   * スタッフ一覧が表示されていることを確認する
   */
  async expectStaffListVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.staffList)).toBeVisible();
  }

  /**
   * スタッフの数を取得する
   */
  async getStaffCount(): Promise<number> {
    return await this.page.locator(this.selectors.staffItem).count();
  }

  /**
   * 特定のスタッフの詳細を確認する
   */
  async expectStaffItem(index: number, expectedData: {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
  }): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    await expect(item).toBeVisible();

    if (expectedData.name) {
      const name = item.locator(this.selectors.staffName);
      await expect(name).toContainText(expectedData.name);
    }

    if (expectedData.email) {
      const email = item.locator(this.selectors.staffEmail);
      await expect(email).toContainText(expectedData.email);
    }

    if (expectedData.phone) {
      const phone = item.locator(this.selectors.staffPhone);
      await expect(phone).toContainText(expectedData.phone);
    }

    if (expectedData.status) {
      const status = item.locator(this.selectors.staffStatus);
      await expect(status).toContainText(expectedData.status);
    }
  }

  /**
   * 出勤状況インジケータを確認する
   */
  async expectStatusIndicator(index: number, color: 'green' | 'yellow' | 'gray'): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    const indicator = item.locator(this.selectors.staffStatusIndicator);
    await expect(indicator).toBeVisible();

    // 色に応じたクラスを確認
    const colorMap = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      gray: 'bg-gray-500'
    };
    await expect(indicator).toHaveClass(new RegExp(colorMap[color]));
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
   * 検索ボックスに入力する
   */
  async searchByName(name: string): Promise<void> {
    await this.page.locator(this.selectors.searchBox).fill(name);
  }

  // ===== スタッフ追加モーダル =====

  /**
   * スタッフ追加ボタンをクリックする
   */
  async clickAddStaff(): Promise<void> {
    await this.page.locator(this.selectors.addStaffButton).click();
  }

  /**
   * スタッフ追加モーダルが表示されていることを確認する
   */
  async expectAddModalVisible(): Promise<void> {
    const modal = this.page.locator(this.selectors.addModal);
    await expect(modal).toBeVisible();
    await expect(this.page.locator(this.selectors.addModalTitle)).toContainText('スタッフを追加');
  }

  /**
   * スタッフ追加フォームに入力する
   */
  async fillAddStaffForm(data: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<void> {
    await this.page.locator(this.selectors.addModalNameInput).fill(data.name);
    await this.page.locator(this.selectors.addModalEmailInput).fill(data.email);

    if (data.phone) {
      await this.page.locator(this.selectors.addModalPhoneInput).fill(data.phone);
    }
  }

  /**
   * スタッフ追加を送信する
   */
  async submitAddStaff(): Promise<void> {
    await this.page.locator(this.selectors.addModalSubmitButton).click();
  }

  /**
   * スタッフ追加モーダルをキャンセルする
   */
  async cancelAddModal(): Promise<void> {
    await this.page.locator(this.selectors.addModalCancelButton).click();
  }

  /**
   * バリデーションエラーを確認する
   */
  async expectValidationError(message: string): Promise<void> {
    const errorElement = this.page.locator(this.selectors.addModalValidationError);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(message);
  }

  /**
   * モーダルが閉じていることを確認する
   */
  async expectModalClosed(): Promise<void> {
    await expect(this.page.locator(this.selectors.addModal)).not.toBeVisible();
    await expect(this.page.locator(this.selectors.editModal)).not.toBeVisible();
    await expect(this.page.locator(this.selectors.shiftModal)).not.toBeVisible();
  }

  // ===== スタッフ編集モーダル =====

  /**
   * 編集ボタンをクリックする
   */
  async clickEdit(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    await item.locator(this.selectors.editButton).click();
  }

  /**
   * スタッフ編集モーダルが表示されていることを確認する
   */
  async expectEditModalVisible(): Promise<void> {
    const modal = this.page.locator(this.selectors.editModal);
    await expect(modal).toBeVisible();
    await expect(this.page.locator(this.selectors.editModalTitle)).toContainText('スタッフを編集');
  }

  /**
   * 電話番号を変更する
   */
  async changePhone(phone: string): Promise<void> {
    await this.page.locator(this.selectors.editModalPhoneInput).clear();
    await this.page.locator(this.selectors.editModalPhoneInput).fill(phone);
  }

  /**
   * スタッフ編集を送信する
   */
  async submitEditStaff(): Promise<void> {
    await this.page.locator(this.selectors.editModalSubmitButton).click();
  }

  /**
   * スタッフ編集モーダルをキャンセルする
   */
  async cancelEditModal(): Promise<void> {
    await this.page.locator(this.selectors.editModalCancelButton).click();
  }

  // ===== 削除確認ダイアログ =====

  /**
   * 削除ボタンをクリックする
   */
  async clickDelete(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    await item.locator(this.selectors.deleteButton).click();
  }

  /**
   * 削除確認ダイアログが表示されていることを確認する
   */
  async expectDeleteDialogVisible(): Promise<void> {
    const dialog = this.page.locator(this.selectors.deleteDialog);
    await expect(dialog).toBeVisible();
    await expect(this.page.locator(this.selectors.deleteDialogTitle)).toContainText('スタッフを削除しますか？');
  }

  /**
   * 削除をキャンセルする
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

  /**
   * 削除ボタンが無効化されていることを確認する
   */
  async expectDeleteButtonDisabled(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    const deleteBtn = item.locator(this.selectors.deleteButton);
    await expect(deleteBtn).toBeDisabled();
  }

  // ===== シフト設定モーダル（Issue #22対応） =====

  /**
   * シフト設定ボタンをクリックする
   */
  async clickShiftSetting(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.staffItem).nth(index);
    await item.locator(this.selectors.shiftButton).click();
  }

  /**
   * シフト設定モーダルが表示されていることを確認する
   */
  async expectShiftModalVisible(): Promise<void> {
    const modal = this.page.locator(this.selectors.shiftModal);
    await expect(modal).toBeVisible();
    await expect(this.page.locator(this.selectors.shiftModalTitle)).toContainText('シフト設定');
  }

  /**
   * 曜日のチェックボックスをチェックする
   */
  async checkDayOfWeek(day: string): Promise<void> {
    const checkbox = this.page.locator(`${this.selectors.shiftModalDayCheckbox}[data-day="${day}"]`);
    await checkbox.check();
  }

  /**
   * 出勤時間を設定する
   */
  async setStartTime(day: string, time: string): Promise<void> {
    const input = this.page.locator(`${this.selectors.shiftModalStartTime}[data-day="${day}"]`);
    await input.fill(time);
  }

  /**
   * 退勤時間を設定する
   */
  async setEndTime(day: string, time: string): Promise<void> {
    const input = this.page.locator(`${this.selectors.shiftModalEndTime}[data-day="${day}"]`);
    await input.fill(time);
  }

  /**
   * シフト設定を送信する
   */
  async submitShiftSetting(): Promise<void> {
    await this.page.locator(this.selectors.shiftModalSubmitButton).click();
  }

  /**
   * シフト設定モーダルをキャンセルする
   */
  async cancelShiftModal(): Promise<void> {
    await this.page.locator(this.selectors.shiftModalCancelButton).click();
  }

  /**
   * シフト設定のバリデーションエラーを確認する
   */
  async expectShiftValidationError(message: string): Promise<void> {
    const errorElement = this.page.locator(this.selectors.shiftModalValidationError);
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(message);
  }

  /**
   * 休暇設定タブをクリックする
   */
  async clickVacationTab(): Promise<void> {
    await this.page.locator(this.selectors.vacationTab).click();
  }

  /**
   * 休暇期間を設定する
   */
  async setVacationPeriod(startDate: string, endDate: string): Promise<void> {
    await this.page.locator(this.selectors.vacationStartDate).fill(startDate);
    await this.page.locator(this.selectors.vacationEndDate).fill(endDate);
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
  async expectErrorMessage(message: string): Promise<void> {
    const errorMessage = this.page.locator(this.selectors.errorMessage);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(message);
  }
}
