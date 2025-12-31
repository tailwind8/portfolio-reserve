import { test } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { HomePage } from './pages/HomePage';

test.describe('@smoke トップページ', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test('正しくレンダリングされる', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // ページタイトルを確認
    await homePage.expectTitle('予約システム');

    // ヘッダーが表示されている
    await homePage.expectHeaderVisible();

    // Hero Sectionが表示されている
    await homePage.expectHeroHeadingVisible();

    // CTAボタンが表示されている
    await homePage.expectBookNowButtonVisible();
    await homePage.expectStartFreeButtonVisible();
  });

  test('主な機能セクションが表示される', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // 主な機能の見出し
    await homePage.expectMainFeaturesHeadingVisible();

    // 6つの機能カードが表示されている
    await homePage.expectAllFeatureCardsVisible();
  });

  test('ナビゲーションリンクが機能する', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // 予約ボタンをクリック
    await homePage.clickBookNowButton();
    await homePage.expectRedirectTo('/booking');

    // トップページに戻る
    await homePage.goto();

    // ログインリンクをクリック（ヘッダーのログインボタン）
    // モバイルではログインボタンが非表示のため、新規登録ボタンで代替テスト
    const isLoginVisible = await homePage.isLoginLinkVisible();

    if (isLoginVisible) {
      await homePage.clickLoginLink();
      await homePage.expectRedirectTo('/login');
    } else {
      // モバイルの場合は新規登録ボタンで遷移テスト
      await homePage.clickRegisterLink();
      await homePage.expectRedirectTo('/register');
    }
  });

  test('デモ表示の注意書きが表示される', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.expectDemoNoticeVisible();
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    const homePage = new HomePage(page);

    // モバイルビュー
    await homePage.setMobileViewport();
    await homePage.goto();
    await homePage.expectHeroHeadingVisible();

    // デスクトップビュー
    await homePage.setDesktopViewport();
    await homePage.goto();
    await homePage.expectHeroHeadingVisible();
  });
});
