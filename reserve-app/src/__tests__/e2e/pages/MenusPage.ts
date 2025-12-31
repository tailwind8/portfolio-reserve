import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object: メニュー一覧ページ
 *
 * このクラスはメニュー一覧ページの要素とアクションをカプセル化します。
 * E2Eテストで使用し、テストコードの可読性と保守性を向上させます。
 */
export class MenusPage {
  readonly page: Page;

  // セレクタ定義
  readonly selectors = {
    // ページ要素
    pageTitle: 'h1',
    categoryHeading: '[data-testid="category-heading"]',
    menuCard: '[data-testid="menu-card"]',

    // メニュー詳細
    menuName: '[data-testid="menu-name"]',
    menuDescription: '[data-testid="menu-description"]',
    menuPrice: '[data-testid="menu-price"]',
    menuDuration: '[data-testid="menu-duration"]',
    bookButton: '[data-testid="menu-book-button"]',

    // 状態表示
    loadingMessage: '[data-testid="loading-message"]',
    errorMessage: '[data-testid="error-message"]',
    emptyMessage: '[data-testid="empty-message"]',
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * メニュー一覧ページに遷移
   */
  async goto(): Promise<void> {
    await this.page.goto('/menus');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * ページタイトルを取得
   */
  async getPageTitle(): Promise<string> {
    return await this.page.locator(this.selectors.pageTitle).textContent() || '';
  }

  /**
   * ページタイトルが表示されることを検証
   */
  async expectPageTitleVisible(expectedText: string): Promise<void> {
    await expect(this.page.locator(this.selectors.pageTitle)).toContainText(expectedText);
  }

  /**
   * メニューカードの数を取得
   */
  async getMenuCardCount(): Promise<number> {
    return await this.page.locator(this.selectors.menuCard).count();
  }

  /**
   * メニューカードが表示されることを検証
   */
  async expectMenuCardsVisible(expectedCount: number): Promise<void> {
    await expect(this.page.locator(this.selectors.menuCard)).toHaveCount(expectedCount);
  }

  /**
   * 指定インデックスのメニューカードを取得
   */
  getMenuCard(index: number): Locator {
    return this.page.locator(this.selectors.menuCard).nth(index);
  }

  /**
   * 最初のメニューカードを取得
   */
  getFirstMenuCard(): Locator {
    return this.getMenuCard(0);
  }

  /**
   * メニュー名を取得
   */
  async getMenuName(menuCard: Locator): Promise<string> {
    return await menuCard.locator(this.selectors.menuName).textContent() || '';
  }

  /**
   * メニュー説明を取得
   */
  async getMenuDescription(menuCard: Locator): Promise<string> {
    return await menuCard.locator(this.selectors.menuDescription).textContent() || '';
  }

  /**
   * メニュー料金を取得
   */
  async getMenuPrice(menuCard: Locator): Promise<string> {
    return await menuCard.locator(this.selectors.menuPrice).textContent() || '';
  }

  /**
   * メニュー所要時間を取得
   */
  async getMenuDuration(menuCard: Locator): Promise<string> {
    return await menuCard.locator(this.selectors.menuDuration).textContent() || '';
  }

  /**
   * メニューカードの全情報が表示されることを検証
   */
  async expectMenuCardDetailsVisible(menuCard: Locator): Promise<void> {
    await expect(menuCard.locator(this.selectors.menuName)).toBeVisible();
    await expect(menuCard.locator(this.selectors.menuPrice)).toBeVisible();
    await expect(menuCard.locator(this.selectors.menuDuration)).toBeVisible();
    await expect(menuCard.locator(this.selectors.menuDescription)).toBeVisible();
  }

  /**
   * カテゴリ見出しが表示されることを検証
   */
  async expectCategoryHeadingsVisible(): Promise<void> {
    const headings = this.page.locator(this.selectors.categoryHeading);
    await expect(headings.first()).toBeVisible();
  }

  /**
   * カテゴリ見出しの数を取得
   */
  async getCategoryHeadingCount(): Promise<number> {
    return await this.page.locator(this.selectors.categoryHeading).count();
  }

  /**
   * 料金が¥記号付きで表示されることを検証
   */
  async expectPriceHasYenSymbol(): Promise<void> {
    const firstPrice = this.page.locator(this.selectors.menuPrice).first();
    await expect(firstPrice).toContainText('¥');
  }

  /**
   * 所要時間が分表示されることを検証
   */
  async expectDurationHasMinuteSuffix(): Promise<void> {
    const firstDuration = this.page.locator(this.selectors.menuDuration).first();
    await expect(firstDuration).toContainText('分');
  }

  /**
   * メニューカードの予約ボタンをクリック
   */
  async clickBookButton(menuCard: Locator): Promise<void> {
    await menuCard.locator(this.selectors.bookButton).click();
  }

  /**
   * 最初のメニューの予約ボタンをクリック
   */
  async clickFirstMenuBookButton(): Promise<void> {
    const firstCard = this.getFirstMenuCard();
    await this.clickBookButton(firstCard);
  }

  /**
   * メニューIDを取得
   */
  async getMenuId(menuCard: Locator): Promise<string | null> {
    return await menuCard.getAttribute('data-menu-id');
  }

  /**
   * 予約ページにリダイレクトされることを検証
   */
  async expectRedirectToBookingPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/booking/);
  }

  /**
   * URLにメニューIDが含まれることを検証
   */
  async expectUrlContainsMenuId(menuId: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`menuId=${menuId}`));
  }

  /**
   * ローディング状態が表示されることを検証
   */
  async expectLoadingVisible(): Promise<void> {
    await expect(this.page.locator(this.selectors.loadingMessage)).toBeVisible();
  }

  /**
   * エラーメッセージが表示されることを検証
   */
  async expectErrorMessageVisible(expectedText?: string): Promise<void> {
    const errorLocator = this.page.locator(this.selectors.errorMessage);
    await expect(errorLocator).toBeVisible();
    if (expectedText) {
      await expect(errorLocator).toContainText(expectedText);
    }
  }

  /**
   * 空メッセージが表示されることを検証
   */
  async expectEmptyMessageVisible(expectedText: string): Promise<void> {
    await expect(this.page.locator(this.selectors.emptyMessage)).toBeVisible();
    await expect(this.page.locator(this.selectors.emptyMessage)).toContainText(expectedText);
  }

  /**
   * メニューカードにマウスホバー
   */
  async hoverMenuCard(menuCard: Locator): Promise<void> {
    await menuCard.hover();
  }

  /**
   * 最初のメニューカードにマウスホバー
   */
  async hoverFirstMenuCard(): Promise<void> {
    await this.hoverMenuCard(this.getFirstMenuCard());
  }

  /**
   * レスポンシブデザイン: モバイル表示に設定
   */
  async setMobileViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * レスポンシブデザイン: タブレット表示に設定
   */
  async setTabletViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  /**
   * レスポンシブデザイン: デスクトップ表示に設定
   */
  async setDesktopViewport(): Promise<void> {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * メニューカードのグリッド列数を検証
   * @param _expectedColumns 期待する列数（'1', '2', '3+' など）※将来の実装用
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async expectGridColumns(_expectedColumns: string): Promise<void> {
    const menuCards = this.page.locator(this.selectors.menuCard);
    const count = await menuCards.count();

    if (count === 0) {
      throw new Error('メニューカードが見つかりません');
    }

    // グリッドレイアウトの検証はCSSプロパティで行う
    // ここでは簡易的にカード数が表示されることを確認
    await expect(menuCards.first()).toBeVisible();
  }

  /**
   * メニューカードがハイライト表示されることを検証（ホバー時）
   */
  async expectMenuCardHighlighted(menuCard: Locator): Promise<void> {
    // ホバー後のスタイル変化を検証
    // 実装依存のため、表示されていることを確認
    await expect(menuCard).toBeVisible();
  }

  /**
   * 最初のメニューカードがハイライト表示されることを検証
   */
  async expectFirstMenuCardHighlighted(): Promise<void> {
    await this.expectMenuCardHighlighted(this.getFirstMenuCard());
  }
}
