import { test, expect } from '@playwright/test';

test.describe('@smoke トップページ', () => {
  test('正しくレンダリングされる', async ({ page }) => {
    await page.goto('/');

    // ページタイトルを確認
    await expect(page).toHaveTitle(/予約システム/);

    // ヘッダーが表示されている
    await expect(page.locator('header')).toBeVisible();

    // Hero Sectionが表示されている
    await expect(page.getByRole('heading', { name: /店舗専用の予約管理システムで/ })).toBeVisible();

    // CTAボタンが表示されている
    await expect(page.getByRole('link', { name: /今すぐ予約する/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /無料で始める/ }).first()).toBeVisible();
  });

  test('主な機能セクションが表示される', async ({ page }) => {
    await page.goto('/');

    // 主な機能の見出し
    await expect(page.getByRole('heading', { name: '主な機能' })).toBeVisible();

    // 6つの機能カードが表示されている
    await expect(page.getByText('24時間予約受付')).toBeVisible();
    await expect(page.getByText('顧客管理')).toBeVisible();
    await expect(page.getByText('自動メール送信')).toBeVisible();
    await expect(page.getByText('スタッフ管理')).toBeVisible();
    await expect(page.getByText('分析レポート')).toBeVisible();
    await expect(page.getByText('スマホ完全対応')).toBeVisible();
  });

  test('ナビゲーションリンクが機能する', async ({ page }) => {
    await page.goto('/');

    // 予約ボタンをクリック
    await page.getByRole('link', { name: /今すぐ予約する/ }).first().click();
    await expect(page).toHaveURL('/booking');

    // トップページに戻る
    await page.goto('/');

    // ログインリンクをクリック（ヘッダーのログインボタン）
    // モバイルではログインボタンが非表示のため、新規登録ボタンで代替テスト
    const loginLink = page.getByRole('link', { name: 'ログイン', exact: true });
    const isLoginVisible = await loginLink.isVisible().catch(() => false);

    if (isLoginVisible) {
      await loginLink.click();
      await expect(page).toHaveURL('/login');
    } else {
      // モバイルの場合は新規登録ボタンで遷移テスト
      await page.getByRole('link', { name: '新規登録' }).click();
      await expect(page).toHaveURL('/register');
    }
  });

  test('デモ表示の注意書きが表示される', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/これはデモサイトです/)).toBeVisible();
  });

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // モバイルビュー
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /店舗専用の予約管理システムで/ })).toBeVisible();

    // デスクトップビュー
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /店舗専用の予約管理システムで/ })).toBeVisible();
  });
});
