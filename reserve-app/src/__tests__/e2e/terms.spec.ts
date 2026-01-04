import { test, expect } from '@playwright/test';

/**
 * 利用規約ページのE2Eテスト
 *
 * 目的:
 * - 利用規約ページが正常に表示されることを確認
 * - 法的に必須なセクションが存在することを確認
 * - レスポンシブ対応を確認
 * - プライバシーポリシーへのリンクが機能することを確認
 */

test.describe('利用規約ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/terms');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    // ページタイトルの確認
    await expect(page).toHaveTitle(/利用規約/);

    // H1タイトルの確認
    const title = page.getByTestId('terms-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('利用規約');
  });

  test('利用規約のコンテンツが表示される', async ({ page }) => {
    const content = page.getByTestId('terms-content');
    await expect(content).toBeVisible();
  });

  test('法的に必須なセクションが存在する', async ({ page }) => {
    // 1. 定義
    await expect(
      page.getByRole('heading', { level: 2, name: /^1\. 定義/ })
    ).toBeVisible();

    // 2. 適用範囲
    await expect(
      page.getByRole('heading', { level: 2, name: /^2\. 適用範囲/ })
    ).toBeVisible();

    // 3. アカウント登録
    await expect(
      page.getByRole('heading', { level: 2, name: /^3\. アカウント登録/ })
    ).toBeVisible();

    // 4. パスワードおよびアカウント情報の管理
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^4\. パスワードおよびアカウント情報の管理/,
      })
    ).toBeVisible();

    // 5. サービス内容
    await expect(
      page.getByRole('heading', { level: 2, name: /^5\. サービス内容/ })
    ).toBeVisible();

    // 6. 予約・キャンセルポリシー
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^6\. 予約・キャンセルポリシー/,
      })
    ).toBeVisible();

    // 7. 利用料金
    await expect(
      page.getByRole('heading', { level: 2, name: /^7\. 利用料金/ })
    ).toBeVisible();

    // 8. 禁止事項
    await expect(
      page.getByRole('heading', { level: 2, name: /^8\. 禁止事項/ })
    ).toBeVisible();

    // 9. 利用制限および登録抹消
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^9\. 利用制限および登録抹消/,
      })
    ).toBeVisible();

    // 10. 知的財産権
    await expect(
      page.getByRole('heading', { level: 2, name: /^10\. 知的財産権/ })
    ).toBeVisible();

    // 11. 免責事項
    await expect(
      page.getByRole('heading', { level: 2, name: /^11\. 免責事項/ })
    ).toBeVisible();

    // 12. サービスの変更・中断・終了
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: /^12\. サービスの変更・中断・終了/,
      })
    ).toBeVisible();

    // 13. 損害賠償
    await expect(
      page.getByRole('heading', { level: 2, name: /^13\. 損害賠償/ })
    ).toBeVisible();

    // 14. 秘密保持
    await expect(
      page.getByRole('heading', { level: 2, name: /^14\. 秘密保持/ })
    ).toBeVisible();

    // 15. 個人情報の取扱い
    await expect(
      page.getByRole('heading', { level: 2, name: /^15\. 個人情報の取扱い/ })
    ).toBeVisible();

    // 16. 利用規約の変更
    await expect(
      page.getByRole('heading', { level: 2, name: /^16\. 利用規約の変更/ })
    ).toBeVisible();

    // 17. 連絡・通知
    await expect(
      page.getByRole('heading', { level: 2, name: /^17\. 連絡・通知/ })
    ).toBeVisible();

    // 18. 権利義務の譲渡禁止
    await expect(
      page.getByRole('heading', { level: 2, name: /^18\. 権利義務の譲渡禁止/ })
    ).toBeVisible();

    // 19. 分離可能性
    await expect(
      page.getByRole('heading', { level: 2, name: /^19\. 分離可能性/ })
    ).toBeVisible();

    // 20. 準拠法・管轄裁判所
    await expect(
      page.getByRole('heading', { level: 2, name: /^20\. 準拠法・管轄裁判所/ })
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

  test('プライバシーポリシーへのリンクが機能する', async ({ page }) => {
    // 本文中のリンク
    const privacyLinkInContent = page
      .getByTestId('terms-content')
      .getByRole('link', { name: /プライバシーポリシー/ })
      .first();
    await expect(privacyLinkInContent).toBeVisible();
    await expect(privacyLinkInContent).toHaveAttribute('href', '/privacy');

    // リンクをクリックしてプライバシーポリシーページに移動
    await privacyLinkInContent.click();
    await expect(page).toHaveURL('/privacy');
    await expect(
      page.getByRole('heading', { level: 1, name: /プライバシーポリシー/ })
    ).toBeVisible();
  });

  test('キャンセルポリシーが明記されている', async ({ page }) => {
    // 24時間前までのキャンセル可能ルール
    await expect(
      page.getByText(/予約日時の24時間前までであれば/)
    ).toBeVisible();
  });

  test('無料サービスであることが明記されている', async ({ page }) => {
    // 利用料金が無料であることの確認
    await expect(
      page.getByText(/当サービスの利用（予約の登録・変更・キャンセル）は無料/)
    ).toBeVisible();
  });

  test('禁止事項が具体的に列挙されている', async ({ page }) => {
    // 禁止事項セクションまでスクロール
    const prohibitedSection = page.getByRole('heading', {
      level: 2,
      name: /^8\. 禁止事項/,
    });
    await prohibitedSection.scrollIntoViewIfNeeded();

    // いくつかの重要な禁止事項を確認
    await expect(page.getByText(/虚偽の予約/).first()).toBeVisible();
    await expect(page.getByText(/無断キャンセル/).first()).toBeVisible();
    await expect(page.getByText(/不正アクセス/).first()).toBeVisible();
  });

  test('レスポンシブデザインが機能する（モバイル）', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // タイトルが表示される
    const title = page.getByTestId('terms-title');
    await expect(title).toBeVisible();

    // コンテンツが表示される
    const content = page.getByTestId('terms-content');
    await expect(content).toBeVisible();

    // 横スクロールが発生しないことを確認
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
  });

  test('レスポンシブデザインが機能する（タブレット）', async ({ page }) => {
    // タブレットサイズに変更
    await page.setViewportSize({ width: 768, height: 1024 });

    // タイトルが表示される
    const title = page.getByTestId('terms-title');
    await expect(title).toBeVisible();

    // コンテンツが表示される
    const content = page.getByTestId('terms-content');
    await expect(content).toBeVisible();
  });

  test('アクセシビリティ: セマンティックHTML構造', async ({ page }) => {
    // main要素が存在する
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // h1が1つだけ存在する
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // h2見出しが20個存在する（各セクション）
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(20);
  });

  test('スクロールして最後のセクションまで表示できる', async ({ page }) => {
    // 最後のセクション（準拠法・管轄裁判所）までスクロール
    const lastSection = page.getByRole('heading', {
      level: 2,
      name: /^20\. 準拠法・管轄裁判所/,
    });
    await lastSection.scrollIntoViewIfNeeded();
    await expect(lastSection).toBeVisible();

    // フッターが表示される
    await expect(
      page.getByText(/プライバシーポリシーもあわせてご確認ください/)
    ).toBeVisible();
  });
});
