import { Page, expect } from '@playwright/test';

/**
 * Page Object: 管理者メニュー管理ページ
 * Path: /admin/menus
 * Issue: #23
 */
export class AdminMenuPage {
  constructor(public readonly page: Page) {}

  /**
   * メニュー管理ページに遷移
   */
  async goto() {
    await this.page.goto('/admin/menus');
    await this.page.waitForLoadState('networkidle');
  }

  // ========================================
  // 基本要素の確認
  // ========================================

  /**
   * ページタイトルが表示されることを確認
   */
  async expectPageTitle(title: string) {
    await expect(this.page.locator('[data-testid="page-title"]')).toHaveText(title);
  }

  /**
   * メニュー追加ボタンが表示されることを確認
   */
  async expectAddButtonVisible() {
    await expect(this.page.locator('[data-testid="add-menu-button"]')).toBeVisible();
  }

  /**
   * メニュー一覧が表示されることを確認
   */
  async expectMenuListVisible() {
    await expect(this.page.locator('[data-testid="menu-list"]')).toBeVisible();
  }

  // ========================================
  // メニュー一覧の操作
  // ========================================

  /**
   * メニュー件数を取得
   */
  async getMenuCount(): Promise<number> {
    return await this.page.locator('[data-testid^="menu-item-"]').count();
  }

  /**
   * メニューアイテムの内容を確認
   */
  async expectMenuItem(
    index: number,
    expected: {
      name?: string;
      price?: number;
      duration?: number;
      category?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    const menuItem = this.page.locator(`[data-testid="menu-item-${index}"]`);

    if (expected.name !== undefined) {
      await expect(menuItem.locator('[data-testid="menu-name"]')).toContainText(expected.name);
    }

    if (expected.price !== undefined) {
      await expect(menuItem.locator('[data-testid="menu-price"]')).toContainText(
        `¥${expected.price.toLocaleString()}`
      );
    }

    if (expected.duration !== undefined) {
      await expect(menuItem.locator('[data-testid="menu-duration"]')).toContainText(
        `${expected.duration}分`
      );
    }

    if (expected.category !== undefined) {
      await expect(menuItem.locator('[data-testid="menu-category"]')).toContainText(
        expected.category
      );
    }

    if (expected.description !== undefined) {
      await expect(menuItem.locator('[data-testid="menu-description"]')).toContainText(
        expected.description
      );
    }

    if (expected.isActive !== undefined) {
      const statusText = expected.isActive ? '有効' : '無効';
      await expect(menuItem.locator('[data-testid="menu-status"]')).toContainText(statusText);
    }
  }

  // ========================================
  // メニュー追加
  // ========================================

  /**
   * メニュー追加ボタンをクリック
   */
  async clickAddMenu() {
    await this.page.locator('[data-testid="add-menu-button"]').click();
  }

  /**
   * メニュー追加モーダルが表示されることを確認
   */
  async expectAddModalVisible() {
    await expect(this.page.locator('[data-testid="add-menu-modal"]')).toBeVisible();
  }

  /**
   * メニュー追加フォームに入力
   */
  async fillAddMenuForm(data: {
    name?: string;
    price?: string;
    duration?: string;
    category?: string;
    description?: string;
  }) {
    if (data.name !== undefined) {
      await this.page.locator('[data-testid="menu-name-input"]').fill(data.name);
    }

    if (data.price !== undefined) {
      await this.page.locator('[data-testid="menu-price-input"]').fill(data.price);
    }

    if (data.duration !== undefined) {
      await this.page.locator('[data-testid="menu-duration-input"]').fill(data.duration);
    }

    if (data.category !== undefined) {
      await this.page.locator('[data-testid="menu-category-input"]').fill(data.category);
    }

    if (data.description !== undefined) {
      await this.page.locator('[data-testid="menu-description-input"]').fill(data.description);
    }
  }

  /**
   * メニュー追加ボタンをクリック
   */
  async submitAddMenu() {
    await this.page.locator('[data-testid="submit-add-menu"]').click();
  }

  // ========================================
  // メニュー編集
  // ========================================

  /**
   * 編集ボタンをクリック
   */
  async clickEdit(index: number) {
    await this.page.locator(`[data-testid="edit-menu-${index}"]`).click();
  }

  /**
   * メニュー編集モーダルが表示されることを確認
   */
  async expectEditModalVisible() {
    await expect(this.page.locator('[data-testid="edit-menu-modal"]')).toBeVisible();
  }

  /**
   * 価格を変更
   */
  async changePrice(price: string) {
    await this.page.locator('[data-testid="menu-price-input"]').fill(price);
  }

  /**
   * メニュー編集を保存
   */
  async submitEditMenu() {
    await this.page.locator('[data-testid="submit-edit-menu"]').click();
  }

  // ========================================
  // メニュー削除
  // ========================================

  /**
   * 削除ボタンをクリック
   */
  async clickDelete(index: number) {
    await this.page.locator(`[data-testid="delete-menu-${index}"]`).click();
  }

  /**
   * 削除確認ダイアログが表示されることを確認
   */
  async expectDeleteDialogVisible() {
    await expect(this.page.locator('[data-testid="delete-menu-dialog"]')).toBeVisible();
  }

  /**
   * 削除を確定
   */
  async confirmDelete() {
    await this.page.locator('[data-testid="confirm-delete-menu"]').click();
  }

  /**
   * ダイアログが閉じたことを確認
   */
  async expectDialogClosed() {
    await expect(this.page.locator('[data-testid="delete-menu-dialog"]')).not.toBeVisible();
  }

  /**
   * 削除ボタンが無効化されていることを確認
   */
  async expectDeleteButtonDisabled(index: number) {
    await expect(this.page.locator(`[data-testid="delete-menu-${index}"]`)).toBeDisabled();
  }

  // ========================================
  // モーダル
  // ========================================

  /**
   * モーダルが閉じたことを確認
   */
  async expectModalClosed() {
    await expect(this.page.locator('[data-testid="add-menu-modal"]')).not.toBeVisible();
    await expect(this.page.locator('[data-testid="edit-menu-modal"]')).not.toBeVisible();
  }

  // ========================================
  // メッセージ
  // ========================================

  /**
   * 成功メッセージが表示されることを確認
   */
  async expectSuccessMessage(message: string) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(message);
  }

  /**
   * エラーメッセージが表示されることを確認
   */
  async expectErrorMessage(message: string) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message);
  }

  /**
   * バリデーションエラーが表示されることを確認
   */
  async expectValidationError(message: string) {
    await expect(this.page.locator('[data-testid="validation-error"]')).toContainText(message);
  }

  /**
   * 空状態メッセージが表示されることを確認
   */
  async expectEmptyMessage(message: string) {
    await expect(this.page.locator('[data-testid="empty-message"]')).toContainText(message);
  }

  // ========================================
  // カテゴリフィルター
  // ========================================

  /**
   * カテゴリフィルターを選択
   */
  async selectCategoryFilter(category: string) {
    await this.page.locator('[data-testid="category-filter"]').selectOption(category);
  }

  // ========================================
  // 検索
  // ========================================

  /**
   * 名前で検索
   */
  async searchByName(name: string) {
    await this.page.locator('[data-testid="search-input"]').fill(name);
  }

  // ========================================
  // 有効/無効切り替え
  // ========================================

  /**
   * 無効にするボタンをクリック
   */
  async clickDeactivate(index: number) {
    await this.page.locator(`[data-testid="deactivate-menu-${index}"]`).click();
  }

  /**
   * 有効にするボタンをクリック
   */
  async clickActivate(index: number) {
    await this.page.locator(`[data-testid="activate-menu-${index}"]`).click();
  }
}
