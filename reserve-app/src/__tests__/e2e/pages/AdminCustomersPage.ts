import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者向け顧客管理ページ
 *
 * このクラスは管理者向け顧客管理ページのすべての要素とインタラクションを管理します。
 * テストコードから実装詳細を隠蔽し、data-testid属性を使用して要素を特定します。
 */
export class AdminCustomersPage {
  readonly page: Page;

  // セレクタ定義（すべてdata-testid属性を使用）
  private readonly selectors = {
    // ページ要素
    pageTitle: '[data-testid="page-title"]',
    searchBox: '[data-testid="search-box"]',
    sortButtonVisitCount: '[data-testid="sort-button-visit-count"]',
    sortButtonLastVisit: '[data-testid="sort-button-last-visit"]',

    // 顧客一覧
    customerList: '[data-testid="customer-list"]',
    customerItem: '[data-testid="customer-item"]',
    customerName: '[data-testid="customer-name"]',
    customerEmail: '[data-testid="customer-email"]',
    customerPhone: '[data-testid="customer-phone"]',
    customerVisitCount: '[data-testid="customer-visit-count"]',
    customerLastVisitDate: '[data-testid="customer-last-visit-date"]',

    // 空状態
    emptyMessage: '[data-testid="empty-message"]',

    // ローディング・エラー
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',

    // 顧客詳細ページ
    customerDetailName: '[data-testid="customer-detail-name"]',
    customerDetailEmail: '[data-testid="customer-detail-email"]',
    customerDetailPhone: '[data-testid="customer-detail-phone"]',
    customerMemo: '[data-testid="customer-memo"]',
    customerMemoEditButton: '[data-testid="customer-memo-edit-button"]',
    customerMemoSaveButton: '[data-testid="customer-memo-save-button"]',
    customerMemoCancelButton: '[data-testid="customer-memo-cancel-button"]',
    customerMemoDeleteButton: '[data-testid="customer-memo-delete-button"]',
    customerMemoInput: '[data-testid="customer-memo-input"]',
    customerInfoEditButton: '[data-testid="customer-info-edit-button"]',
    visitHistoryList: '[data-testid="visit-history-list"]',
    visitHistoryItem: '[data-testid="visit-history-item"]',
    reservationHistoryList: '[data-testid="reservation-history-list"]',
    reservationHistoryItem: '[data-testid="reservation-history-item"]',
    reservationHistoryTab: '[data-testid="reservation-history-tab"]',

    // 顧客情報編集モーダル
    customerEditModal: '[data-testid="customer-edit-modal"]',
    editModalNameInput: '[data-testid="edit-modal-name-input"]',
    editModalPhoneInput: '[data-testid="edit-modal-phone-input"]',
    editModalSubmitButton: '[data-testid="edit-modal-submit-button"]',
    editModalCancelButton: '[data-testid="edit-modal-cancel-button"]',

    // 成功メッセージ
    successMessage: '[data-testid="success-message"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * 顧客一覧ページに移動する
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/customers');
  }

  /**
   * 顧客詳細ページに移動する
   */
  async gotoDetail(customerId: string): Promise<void> {
    await this.page.goto(`/admin/customers/${customerId}`);
  }

  /**
   * ページタイトルを確認する
   */
  async expectPageTitle(title: string): Promise<void> {
    const pageTitle = this.page.locator(this.selectors.pageTitle);
    await expect(pageTitle).toContainText(title);
  }

  /**
   * 顧客一覧が表示されていることを確認する
   */
  async expectCustomerListVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.customerList)).toBeVisible();
  }

  /**
   * 顧客の数を取得する
   */
  async getCustomerCount(): Promise<number> {
    return await this.page.locator(this.selectors.customerItem).count();
  }

  /**
   * 特定の顧客の詳細を確認する
   */
  async expectCustomerItem(index: number, expectedData: {
    name?: string;
    email?: string;
    phone?: string;
    visitCount?: number;
    lastVisitDate?: string | null;
  }): Promise<void> {
    const item = this.page.locator(this.selectors.customerItem).nth(index);
    await expect(item).toBeVisible();

    if (expectedData.name) {
      const name = item.locator(this.selectors.customerName);
      await expect(name).toContainText(expectedData.name);
    }

    if (expectedData.email) {
      const email = item.locator(this.selectors.customerEmail);
      await expect(email).toContainText(expectedData.email);
    }

    if (expectedData.phone) {
      const phone = item.locator(this.selectors.customerPhone);
      await expect(phone).toContainText(expectedData.phone);
    }

    if (expectedData.visitCount !== undefined) {
      const visitCount = item.locator(this.selectors.customerVisitCount);
      await expect(visitCount).toContainText(`${expectedData.visitCount}回`);
    }

    if (expectedData.lastVisitDate !== undefined) {
      const lastVisitDate = item.locator(this.selectors.customerLastVisitDate);
      if (expectedData.lastVisitDate) {
        await expect(lastVisitDate).toContainText(expectedData.lastVisitDate);
      } else {
        await expect(lastVisitDate).toContainText('なし');
      }
    }
  }

  /**
   * 顧客をクリックして詳細ページに遷移する
   */
  async clickCustomer(index: number): Promise<void> {
    const item = this.page.locator(this.selectors.customerItem).nth(index);
    await item.click();
  }

  /**
   * 検索ボックスに入力する
   */
  async search(query: string): Promise<void> {
    await this.page.locator(this.selectors.searchBox).fill(query);
    // 検索は自動実行されるため、少し待つ
    await this.page.waitForTimeout(500);
  }

  /**
   * 来店回数でソートする
   */
  async sortByVisitCount(): Promise<void> {
    await this.page.locator(this.selectors.sortButtonVisitCount).click();
  }

  /**
   * 最終来店日でソートする
   */
  async sortByLastVisitDate(): Promise<void> {
    await this.page.locator(this.selectors.sortButtonLastVisit).click();
  }

  /**
   * 空状態メッセージを確認する
   */
  async expectEmptyMessage(message: string): Promise<void> {
    const emptyMessage = this.page.locator(this.selectors.emptyMessage);
    await expect(emptyMessage).toBeVisible();
    await expect(emptyMessage).toContainText(message);
  }

  // ===== 顧客詳細ページ =====

  /**
   * 顧客の基本情報を確認する
   */
  async expectCustomerDetail(expectedData: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<void> {
    if (expectedData.name) {
      const name = this.page.locator(this.selectors.customerDetailName);
      await expect(name).toContainText(expectedData.name);
    }

    if (expectedData.email) {
      const email = this.page.locator(this.selectors.customerDetailEmail);
      await expect(email).toContainText(expectedData.email);
    }

    if (expectedData.phone) {
      const phone = this.page.locator(this.selectors.customerDetailPhone);
      await expect(phone).toContainText(expectedData.phone);
    }
  }

  /**
   * メモ編集ボタンをクリックする
   */
  async clickEditMemo(): Promise<void> {
    await this.page.locator(this.selectors.customerMemoEditButton).click();
  }

  /**
   * メモ入力欄に入力する
   */
  async fillMemo(memo: string): Promise<void> {
    await this.page.locator(this.selectors.customerMemoInput).fill(memo);
  }

  /**
   * メモ保存ボタンをクリックする
   */
  async saveMemo(): Promise<void> {
    await this.page.locator(this.selectors.customerMemoSaveButton).click();
  }

  /**
   * メモキャンセルボタンをクリックする
   */
  async cancelMemoEdit(): Promise<void> {
    await this.page.locator(this.selectors.customerMemoCancelButton).click();
  }

  /**
   * メモ削除ボタンをクリックする
   */
  async clickDeleteMemo(): Promise<void> {
    await this.page.locator(this.selectors.customerMemoDeleteButton).click();
  }

  /**
   * メモが表示されていることを確認する
   */
  async expectMemo(memo: string): Promise<void> {
    const memoElement = this.page.locator(this.selectors.customerMemo);
    await expect(memoElement).toBeVisible();
    await expect(memoElement).toContainText(memo);
  }

  /**
   * メモ入力欄が表示されていることを確認する
   */
  async expectMemoInputVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.customerMemoInput)).toBeVisible();
  }

  /**
   * メモ入力欄の文字数を確認する
   */
  async expectMemoCharCount(current: number, max: number): Promise<void> {
    // 文字カウンターのパターンを複数試す（実装によって形式が異なる可能性がある）
    const patterns = [
      `${current}/${max}文字`,
      `${current} / ${max} 文字`,
      `${current}/${max}`,
    ];
    
    let found = false;
    for (const pattern of patterns) {
      const charCount = this.page.locator(`text=/${pattern.replace(/[()]/g, '\\$&')}/`);
      if (await charCount.count() > 0) {
        await expect(charCount.first()).toBeVisible();
        found = true;
        break;
      }
    }
    
    if (!found) {
      // フォールバック: メモ入力欄の近くに文字数が表示されているか確認
      const memoInput = this.page.locator(this.selectors.customerMemoInput);
      const parent = memoInput.locator('..');
      const charCountText = await parent.textContent();
      expect(charCountText).toContain(`${current}`);
      expect(charCountText).toContain(`${max}`);
    }
  }

  /**
   * 顧客情報編集ボタンをクリックする
   */
  async clickEditInfo(): Promise<void> {
    await this.page.locator(this.selectors.customerInfoEditButton).click();
  }

  /**
   * 顧客情報編集モーダルが表示されていることを確認する
   */
  async expectEditModalVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.customerEditModal)).toBeVisible();
  }

  /**
   * 顧客情報編集フォームに入力する
   */
  async fillEditForm(data: {
    name?: string;
    phone?: string;
  }): Promise<void> {
    if (data.name !== undefined) {
      await this.page.locator(this.selectors.editModalNameInput).fill(data.name);
    }
    if (data.phone !== undefined) {
      await this.page.locator(this.selectors.editModalPhoneInput).fill(data.phone);
    }
  }

  /**
   * 顧客情報編集を送信する
   */
  async submitEditInfo(): Promise<void> {
    await this.page.locator(this.selectors.editModalSubmitButton).click();
  }

  /**
   * 顧客情報編集モーダルをキャンセルする
   */
  async cancelEditModal(): Promise<void> {
    await this.page.locator(this.selectors.editModalCancelButton).click();
  }

  /**
   * 来店履歴一覧が表示されていることを確認する
   */
  async expectVisitHistoryVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.visitHistoryList)).toBeVisible();
  }

  /**
   * 来店履歴の数を取得する
   */
  async getVisitHistoryCount(): Promise<number> {
    return await this.page.locator(this.selectors.visitHistoryItem).count();
  }

  /**
   * 予約履歴タブをクリックする
   */
  async clickReservationHistoryTab(): Promise<void> {
    await this.page.locator(this.selectors.reservationHistoryTab).click();
  }

  /**
   * 予約履歴一覧が表示されていることを確認する
   */
  async expectReservationHistoryVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.reservationHistoryList)).toBeVisible();
  }

  /**
   * 予約履歴の数を取得する
   */
  async getReservationHistoryCount(): Promise<number> {
    return await this.page.locator(this.selectors.reservationHistoryItem).count();
  }

  /**
   * 成功メッセージを確認する
   */
  async expectSuccessMessage(message: string): Promise<void> {
    const successMsg = this.page.locator(this.selectors.successMessage);
    await expect(successMsg).toBeVisible();
    await expect(successMsg).toContainText(message);
  }

  /**
   * エラーメッセージを確認する
   */
  async expectErrorMessage(message: string): Promise<void> {
    const errorMsg = this.page.locator(this.selectors.errorMessage);
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(message);
  }

  /**
   * ローディングメッセージを確認する
   */
  async expectLoadingMessage(): Promise<void> {
    await expect(this.page.locator(this.selectors.loadingMessage)).toBeVisible();
  }
}

