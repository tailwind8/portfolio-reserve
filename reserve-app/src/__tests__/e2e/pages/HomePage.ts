import { Page, expect } from '@playwright/test';

/**
 * ホームページ（トップページ）のPage Object
 * テストから実装詳細を隠蔽し、保守性を向上させる
 */
export class HomePage {
  constructor(private page: Page) {}

  // セレクタを一箇所で管理
  private selectors = {
    // ページ要素
    header: 'header',
    heroHeading: 'role=heading[name=/店舗専用の予約管理システムで/]',
    mainFeaturesHeading: 'role=heading[name="主な機能"]',

    // CTAボタン
    bookNowButton: 'role=link[name=/今すぐ予約する/]',
    startFreeButton: 'role=link[name=/無料で始める/]',

    // ナビゲーションリンク
    loginLink: 'role=link[name="ログイン"]',
    registerLink: 'role=link[name="新規登録"]',

    // 機能カード（テキストベース）
    featureCard24Hour: 'text=24時間予約受付',
    featureCardCustomer: 'text=顧客管理',
    featureCardAutoEmail: 'text=自動メール送信',
    featureCardStaff: 'text=スタッフ管理',
    featureCardAnalytics: 'text=分析レポート',
    featureCardMobile: 'text=スマホ完全対応',

    // デモ表示
    demoNotice: 'text=/これはデモサイトです/',
  };

  /**
   * ホームページに移動
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * ページタイトルを検証
   */
  async expectTitle(titlePattern: string | RegExp) {
    await expect(this.page).toHaveTitle(new RegExp(titlePattern));
  }

  /**
   * ヘッダーが表示されることを検証
   */
  async expectHeaderVisible() {
    await expect(this.page.locator(this.selectors.header)).toBeVisible();
  }

  /**
   * ヒーローセクションの見出しが表示されることを検証
   */
  async expectHeroHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: /店舗専用の予約管理システムで/ })).toBeVisible();
  }

  /**
   * 「今すぐ予約する」CTAボタンが表示されることを検証
   */
  async expectBookNowButtonVisible() {
    await expect(this.page.getByRole('link', { name: /今すぐ予約する/ }).first()).toBeVisible();
  }

  /**
   * 「無料で始める」CTAボタンが表示されることを検証
   */
  async expectStartFreeButtonVisible() {
    await expect(this.page.getByRole('link', { name: /無料で始める/ }).first()).toBeVisible();
  }

  /**
   * 「今すぐ予約する」ボタンをクリック
   */
  async clickBookNowButton() {
    await this.page.getByRole('link', { name: /今すぐ予約する/ }).first().click();
  }

  /**
   * 主な機能セクションの見出しが表示されることを検証
   */
  async expectMainFeaturesHeadingVisible() {
    await expect(this.page.getByRole('heading', { name: '主な機能' })).toBeVisible();
  }

  /**
   * 機能カードが表示されることを検証
   */
  async expectFeatureCardVisible(featureName: string) {
    await expect(this.page.getByText(featureName)).toBeVisible();
  }

  /**
   * すべての機能カードが表示されることを検証
   */
  async expectAllFeatureCardsVisible() {
    await this.expectFeatureCardVisible('24時間予約受付');
    await this.expectFeatureCardVisible('顧客管理');
    await this.expectFeatureCardVisible('自動メール送信');
    await this.expectFeatureCardVisible('スタッフ管理');
    await this.expectFeatureCardVisible('分析レポート');
    await this.expectFeatureCardVisible('スマホ完全対応');
  }

  /**
   * ログインリンクをクリック
   */
  async clickLoginLink() {
    const loginLink = this.page.getByRole('link', { name: 'ログイン', exact: true });
    const isLoginVisible = await loginLink.isVisible().catch(() => false);

    if (isLoginVisible) {
      await loginLink.click();
    }
  }

  /**
   * 新規登録リンクをクリック
   */
  async clickRegisterLink() {
    await this.page.getByRole('link', { name: '新規登録' }).click();
  }

  /**
   * デモ表示の注意書きが表示されることを検証
   */
  async expectDemoNoticeVisible() {
    await expect(this.page.getByText(/これはデモサイトです/)).toBeVisible();
  }

  /**
   * 指定したURLにリダイレクトされることを検証
   */
  async expectRedirectTo(url: string) {
    await expect(this.page).toHaveURL(url);
  }

  /**
   * モバイル表示に設定
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * デスクトップ表示に設定
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * ログインリンクが表示されているかチェック
   */
  async isLoginLinkVisible(): Promise<boolean> {
    const loginLink = this.page.getByRole('link', { name: 'ログイン', exact: true });
    return await loginLink.isVisible().catch(() => false);
  }
}
