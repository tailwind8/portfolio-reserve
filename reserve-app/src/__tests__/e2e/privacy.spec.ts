import { test, expect } from '@playwright/test';

/**
 * プライバシーポリシーページのE2Eテスト
 *
 * 目的:
 * - プライバシーポリシーページが正常に表示されることを確認
 * - 法的に必須なセクションが存在することを確認
 * - レスポンシブ対応を確認
 */

test.describe('プライバシーポリシーページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/privacy');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/プライバシーポリシー/);

    // H1タイトルの確認
    const title = page.getByTestId('privacy-policy-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('プライバシーポリシー');
  });

  test('プライバシーポリシーのコンテンツが表示される', async ({
    page,
  }) => {
    const content = page.getByTestId('privacy-content');
    await expect(content).toBeVisible();
  });

  test('法的に必須なセクションが存在する', async ({ page }) => {
    // 1. 基本方針
    await expect(
      page.getByRole('heading', { level: 2, name: /基本方針/ })
    ).toBeVisible();

    // 2. 事業者情報
    await expect(
      page.getByRole('heading', { level: 2, name: /事業者情報/ })
    ).toBeVisible();

    // 3. 収集する個人情報
    await expect(
      page.getByRole('heading', { level: 2, name: /収集する個人情報/ })
    ).toBeVisible();

    // 4. 利用目的
    await expect(
      page.getByRole('heading', { level: 2, name: /個人情報の利用目的/ })
    ).toBeVisible();

    // 5. 第三者への提供
    await expect(
      page.getByRole('heading', { level: 2, name: /第三者への提供/ })
    ).toBeVisible();

    // 6. Cookie
    await expect(
      page.getByRole('heading', { level: 2, name: /Cookieとトラッキング技術/ })
    ).toBeVisible();

    // 7. セキュリティ対策
    await expect(
      page.getByRole('heading', { level: 2, name: /セキュリティ対策/ })
    ).toBeVisible();

    // 8. 保存期間
    await expect(
      page.getByRole('heading', { level: 2, name: /個人情報の保存期間/ })
    ).toBeVisible();

    // 9. ユーザーの権利
    await expect(
      page.getByRole('heading', { level: 2, name: /ユーザーの権利/ })
    ).toBeVisible();

    // 10. お問い合わせ
    await expect(
      page.getByRole('heading', { level: 2, name: /お問い合わせ/ })
    ).toBeVisible();

    // 11. 改定
    await expect(
      page.getByRole('heading', { level: 2, name: /プライバシーポリシーの改定/ })
    ).toBeVisible();

    // 12. 準拠法・管轄裁判所
    await expect(
      page.getByRole('heading', { level: 2, name: /準拠法・管轄裁判所/ })
    ).toBeVisible();
  });

  test('制定日・最終改定日が表示される', async ({ page }) => {
    // 最初の制定日・最終改定日（ページ上部）
    await expect(
      page.getByText(/制定日：2026年1月4日/).first()
    ).toBeVisible();
    await expect(
      page.getByText(/最終改定日：2026年1月4日/).first()
    ).toBeVisible();
  });

  test('お問い合わせメールアドレスが表示される', async ({ page }) => {
    // 事業者情報セクションのメールアドレス
    const emailLink = page
      .getByRole('link', {
        name: 'privacy@example.com',
      })
      .first();
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute(
      'href',
      'mailto:privacy@example.com'
    );
  });

  test('Cookie設定の外部リンクが機能する', async ({ page }) => {
    // Chromeのリンク
    const chromeLink = page.getByRole('link', {
      name: /Cookieの設定を変更する/,
    });
    await expect(chromeLink).toBeVisible();
    await expect(chromeLink).toHaveAttribute(
      'href',
      'https://support.google.com/chrome/answer/95647'
    );
    await expect(chromeLink).toHaveAttribute('target', '_blank');
    await expect(chromeLink).toHaveAttribute('rel', 'noopener noreferrer');

    // Firefoxのリンク
    const firefoxLink = page.getByRole('link', {
      name: /強化型トラッキング防止機能/,
    });
    await expect(firefoxLink).toBeVisible();
    await expect(firefoxLink).toHaveAttribute(
      'href',
      'https://support.mozilla.org/ja/kb/enhanced-tracking-protection-firefox-desktop'
    );

    // Safariのリンク
    const safariLink = page.getByRole('link', {
      name: /Cookieとウェブサイトデータを管理する/,
    });
    await expect(safariLink).toBeVisible();
    await expect(safariLink).toHaveAttribute(
      'href',
      'https://support.apple.com/ja-jp/guide/safari/sfri11471/mac'
    );
  });

  test('レスポンシブデザインが機能する（モバイル）', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // タイトルが表示される
    const title = page.getByTestId('privacy-policy-title');
    await expect(title).toBeVisible();

    // コンテンツが表示される
    const content = page.getByTestId('privacy-content');
    await expect(content).toBeVisible();

    // 横スクロールが発生しないことを確認
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('レスポンシブデザインが機能する（タブレット）', async ({ page }) => {
    // タブレットサイズに変更
    await page.setViewportSize({ width: 768, height: 1024 });

    // タイトルが表示される
    const title = page.getByTestId('privacy-policy-title');
    await expect(title).toBeVisible();

    // コンテンツが表示される
    const content = page.getByTestId('privacy-content');
    await expect(content).toBeVisible();
  });

  test('アクセシビリティ: セマンティックHTML構造', async ({ page }) => {
    // main要素が存在する
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // h1が1つだけ存在する
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // h2見出しが12個存在する（各セクション）
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(12);
  });
});
