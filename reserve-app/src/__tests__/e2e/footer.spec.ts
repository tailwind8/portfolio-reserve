import { test, expect } from '@playwright/test';

/**
 * FooterコンポーネントのE2Eテスト
 *
 * 目的:
 * - Footerが全ページで表示されることを確認
 * - プライバシーポリシー・利用規約へのリンクが機能することを確認
 * - レスポンシブ対応を確認
 */

test.describe('Footerコンポーネント', () => {
  test('トップページでFooterが表示される', async ({ page }) => {
    await page.goto('/');

    // Footerが表示されることを確認
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // 各セクションが表示されることを確認
    await expect(
      page.getByRole('heading', { level: 3, name: '予約システム' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 4, name: 'サービス' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 4, name: '管理者' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 4, name: 'お問い合わせ' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 4, name: '法的情報' })
    ).toBeVisible();
  });

  test('プライバシーポリシーへのリンクが機能する', async ({ page }) => {
    // Cookie同意をLocalStorageに事前設定（バナーを表示させない）
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
    });
    await page.reload();

    // プライバシーポリシーリンクをクリック
    const privacyLink = page.getByTestId('footer-privacy-link');
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveText('プライバシーポリシー');

    await privacyLink.click();

    // プライバシーポリシーページに遷移することを確認
    await expect(page).toHaveURL('/privacy');
    await expect(page.getByTestId('privacy-policy-title')).toBeVisible();
  });

  test('利用規約へのリンクが機能する', async ({ page }) => {
    // Cookie同意をLocalStorageに事前設定（バナーを表示させない）
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
    });
    await page.reload();

    // 利用規約リンクをクリック
    const termsLink = page.getByTestId('footer-terms-link');
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveText('利用規約');

    await termsLink.click();

    // 利用規約ページに遷移することを確認
    await expect(page).toHaveURL('/terms');
    await expect(page.getByTestId('terms-title')).toBeVisible();
  });

  test('Footerリンクがhover時にスタイル変更される', async ({ page }) => {
    // Cookie同意をLocalStorageに事前設定（バナーを表示させない）
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('cookieConsent', 'accepted');
    });
    await page.reload();

    const privacyLink = page.getByTestId('footer-privacy-link');

    // transition-colorsクラスが存在することを確認
    await expect(privacyLink).toHaveClass(/transition-colors/);

    // hover-text-blue-500クラスが存在することを確認
    await expect(privacyLink).toHaveClass(/hover:text-blue-500/);
  });

  test('レスポンシブデザインが機能する（モバイル）', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Footerが表示される
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // 法的情報セクションが表示される
    await expect(
      page.getByRole('heading', { level: 4, name: '法的情報' })
    ).toBeVisible();

    // リンクが表示される
    await expect(page.getByTestId('footer-privacy-link')).toBeVisible();
    await expect(page.getByTestId('footer-terms-link')).toBeVisible();

    // 横スクロールが発生しないことを確認
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('レスポンシブデザインが機能する（タブレット）', async ({ page }) => {
    // タブレットサイズに変更
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    // Footerが表示される
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // 法的情報セクションが表示される
    await expect(
      page.getByRole('heading', { level: 4, name: '法的情報' })
    ).toBeVisible();
  });

  test('他のページでもFooterが表示される', async ({ page }) => {
    // トップページ
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByTestId('footer-privacy-link')).toBeVisible();

    // プライバシーポリシーページ
    await page.goto('/privacy');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('footer-privacy-link')).toBeVisible();

    // 利用規約ページ
    await page.goto('/terms');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('footer-terms-link')).toBeVisible();
  });

  test('アクセシビリティ: セマンティックHTML構造', async ({ page }) => {
    await page.goto('/');

    // footer要素が存在する
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // リンクがa要素として実装されている
    const privacyLink = page.getByTestId('footer-privacy-link');
    const termsLink = page.getByTestId('footer-terms-link');

    await expect(privacyLink).toHaveAttribute('href', '/privacy');
    await expect(termsLink).toHaveAttribute('href', '/terms');
  });

  test('著作権表示が正しく表示される', async ({ page }) => {
    await page.goto('/');

    // 著作権表示を確認
    await expect(
      page.getByText('© 2025 予約システム. All rights reserved.')
    ).toBeVisible();
  });
});
