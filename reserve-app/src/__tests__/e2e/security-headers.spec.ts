import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';

/**
 * E2E: セキュリティヘッダー
 * Feature: features/security/security-headers.feature
 *
 * 全てのページ・APIエンドポイントに適切なセキュリティヘッダーが設定されていることを確認する
 */
test.describe('セキュリティヘッダー', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test('X-Frame-Optionsヘッダーが設定される（クリックジャッキング対策）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Optionsヘッダーが設定される（MIMEスニッフィング防止）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policyヘッダーが設定される（リファラー情報の制限）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('Permissions-Policyヘッダーが設定される（不要な機能の無効化）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    const permissionsPolicy = headers['permissions-policy'];

    expect(permissionsPolicy).toBeDefined();
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('geolocation=()');
  });

  test('Strict-Transport-Securityヘッダーが設定される（HTTPS強制）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    const hsts = headers['strict-transport-security'];

    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age');
  });

  test('Content-Security-Policyヘッダーが設定される（XSS対策）', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    const csp = headers['content-security-policy'];

    expect(csp).toBeDefined();
    expect(csp).toContain('default-src');
  });

  test('管理者ページにもセキュリティヘッダーが設定される', async ({ page }) => {
    const response = await page.goto('/admin/dashboard');
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toBeDefined();
  });

  test('複数ページで一貫してセキュリティヘッダーが設定される', async ({ page }) => {
    const pages = ['/', '/login', '/register', '/menus', '/booking'];

    for (const pagePath of pages) {
      const response = await page.goto(pagePath);
      expect(response).not.toBeNull();

      const headers = response!.headers();

      // 全ページで基本的なセキュリティヘッダーが設定されていることを確認
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    }
  });
});
