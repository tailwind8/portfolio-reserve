import { test, expect } from '@playwright/test';
import { CookieConsentBanner } from './pages/CookieConsentBanner';

test.describe('Cookie同意バナー', () => {
  let cookieBanner: CookieConsentBanner;

  test.beforeEach(async ({ page, context }) => {
    cookieBanner = new CookieConsentBanner(page);

    // LocalStorageをクリア（毎回初回アクセス状態にする）
    await context.clearCookies();
    await page.goto('/');
    await cookieBanner.clearConsentFromLocalStorage();
  });

  test('初回アクセス時にCookie同意バナーが表示される', async ({ page }) => {
    await page.goto('/');

    // Cookie同意バナーが表示される
    await expect(cookieBanner.banner).toBeVisible();

    // バナーに"Cookie"という文言が含まれる
    expect(await cookieBanner.hasCookieText()).toBe(true);

    // "同意する"ボタンが表示される
    expect(await cookieBanner.hasAcceptButton()).toBe(true);

    // "プライバシーポリシー"リンクが表示される
    expect(await cookieBanner.hasPrivacyPolicyLink()).toBe(true);
  });

  test('同意ボタンをクリックするとバナーが消える', async ({ page }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // "同意する"ボタンをクリック
    await cookieBanner.clickAccept();

    // Cookie同意バナーが非表示になる
    await expect(cookieBanner.banner).not.toBeVisible();

    // LocalStorageに同意情報が保存される
    expect(await cookieBanner.hasConsentInLocalStorage()).toBe(true);
  });

  test('同意情報がLocalStorageに正しく保存される', async ({ page }) => {
    await page.goto('/');

    // "同意する"ボタンをクリック
    await cookieBanner.clickAccept();

    // LocalStorageに"cookieConsent"キーが保存される
    const consent = await page.evaluate(() => {
      return localStorage.getItem('cookieConsent');
    });

    expect(consent).not.toBeNull();

    // 保存された値が"accepted"である
    expect(consent).toBe('accepted');
  });

  test('同意済みのユーザーには再表示されない', async ({ page }) => {
    // LocalStorageに同意情報を設定
    await page.goto('/');
    await cookieBanner.setConsentInLocalStorage();

    // ページをリロード
    await page.reload();

    // Cookie同意バナーが表示されない
    await expect(cookieBanner.banner).not.toBeVisible();
  });

  test('同意後に別のページに移動してもバナーは表示されない', async ({
    page,
  }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // "同意する"ボタンをクリック
    await cookieBanner.clickAccept();

    // "/menus"ページに移動
    await page.goto('/menus');

    // Cookie同意バナーが表示されない
    await expect(cookieBanner.banner).not.toBeVisible();
  });

  test('同意後にページをリロードしてもバナーは表示されない', async ({
    page,
  }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // "同意する"ボタンをクリック
    await cookieBanner.clickAccept();

    // ページをリロード
    await page.reload();

    // Cookie同意バナーが表示されない
    await expect(cookieBanner.banner).not.toBeVisible();
  });

  test('プライバシーポリシーリンクが機能する', async ({ page }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // "プライバシーポリシー"リンクをクリック
    await cookieBanner.clickPrivacyPolicyLink();

    // "/privacy"ページに遷移する
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('Cookie同意バナーに必要な情報が含まれる', async ({ page }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // バナーに"Cookie"という文言が含まれる
    expect(await cookieBanner.hasCookieText()).toBe(true);

    // バナーがページの下部に固定表示される
    expect(await cookieBanner.isFixedAtBottom()).toBe(true);
  });

  test('Cookie同意バナーがキーボードで操作できる', async ({ page }) => {
    await page.goto('/');

    // Cookie同意バナーが表示されている
    await expect(cookieBanner.banner).toBeVisible();

    // 「同意する」ボタンにフォーカスを移動してEnterキーを押す
    await cookieBanner.consentButton.focus();
    await cookieBanner.pressEnter();

    // Cookie同意バナーが非表示になる
    await expect(cookieBanner.banner).not.toBeVisible();

    // LocalStorageに同意情報が保存される
    expect(await cookieBanner.hasConsentInLocalStorage()).toBe(true);
  });

  test('LocalStorageをクリアすると再度バナーが表示される', async ({
    page,
  }) => {
    await page.goto('/');

    // 同意する
    await cookieBanner.clickAccept();
    await expect(cookieBanner.banner).not.toBeVisible();

    // LocalStorageをクリア
    await cookieBanner.clearConsentFromLocalStorage();

    // ページをリロード
    await page.reload();

    // Cookie同意バナーが表示される
    await expect(cookieBanner.banner).toBeVisible();
  });

  test.describe('レスポンシブデザイン', () => {
    test('モバイル画面でもCookie同意バナーが適切に表示される', async ({
      page,
    }) => {
      // モバイルビューポートに設定
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Cookie同意バナーが表示される
      await expect(cookieBanner.banner).toBeVisible();

      // バナーがモバイル画面に収まっている
      expect(await cookieBanner.fitsInMobileViewport()).toBe(true);

      // "同意する"ボタンがタップしやすいサイズである（44x44px以上）
      expect(await cookieBanner.hasAccessibleButtonSize()).toBe(true);
    });
  });
});
