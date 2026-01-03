import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * E2E: Sentryエラー監視
 * Feature: features/monitoring/sentry-error-tracking.feature
 *
 * Sentryが正しくインストール・設定されていることを確認する
 * 注: 実際のエラー送信テストは、本番環境のSentry DSNが必要なため、
 *     ここでは設定ファイルとビルド統合の確認のみを行う
 */
test.describe('Sentryエラー監視', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
  });

  test('Sentry設定ファイルが正しく配置されている', async () => {
    // sentry.client.config.ts の存在確認
    const clientConfigExists = await test.step('クライアント設定ファイルの確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
        return content.includes('Sentry.init');
      } catch {
        return false;
      }
    });

    expect(clientConfigExists).toBe(true);

    // sentry.server.config.ts の存在確認
    const serverConfigExists = await test.step('サーバー設定ファイルの確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');
        return content.includes('Sentry.init');
      } catch {
        return false;
      }
    });

    expect(serverConfigExists).toBe(true);

    // instrumentation.ts の存在確認
    const instrumentationExists = await test.step('Instrumentation設定ファイルの確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'instrumentation.ts'), 'utf-8');
        return content.includes('register');
      } catch {
        return false;
      }
    });

    expect(instrumentationExists).toBe(true);
  });

  test('next.config.tsにSentryが統合されている', async () => {
    const nextConfigIntegrated = await test.step('Next.js設定の確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf-8');
        return content.includes('withSentryConfig') && content.includes('@sentry/nextjs');
      } catch {
        return false;
      }
    });

    expect(nextConfigIntegrated).toBe(true);
  });

  test('Sentryパッケージが正しくインストールされている', async () => {
    const packageJsonValid = await test.step('package.jsonの確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'package.json'), 'utf-8');
        const packageJson = JSON.parse(content);
        return packageJson.dependencies && '@sentry/nextjs' in packageJson.dependencies;
      } catch {
        return false;
      }
    });

    expect(packageJsonValid).toBe(true);
  });

  test('アプリケーションが正常に起動する（Sentry統合後）', async ({ page }) => {
    // Sentry統合後もアプリケーションが正常に動作することを確認
    const response = await page.goto('/');

    // ページが正常にロードされること
    expect(response?.status()).toBe(200);

    // ホームページのコンテンツが表示されること
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('エラーページでもアプリケーションが動作する', async ({ page }) => {
    // 存在しないページにアクセス（404エラー）
    const response = await page.goto('/non-existent-page');

    // 404ページが表示されること
    expect(response?.status()).toBe(404);

    // エラーが発生してもページがクラッシュしないこと
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBe(true);
  });

  test('センシティブ情報のフィルタリング設定が存在する', async () => {
    const clientConfigHasFiltering = await test.step('クライアント側フィルタリング確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
        return content.includes('beforeSend') && content.includes('password');
      } catch {
        return false;
      }
    });

    expect(clientConfigHasFiltering).toBe(true);

    const serverConfigHasFiltering = await test.step('サーバー側フィルタリング確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');
        return content.includes('beforeSend') && content.includes('password');
      } catch {
        return false;
      }
    });

    expect(serverConfigHasFiltering).toBe(true);
  });

  test('環境変数のドキュメントが存在する', async () => {
    const envDocsExist = await test.step('環境変数ドキュメントの確認', () => {
      try {
        const content = readFileSync(join(process.cwd(), 'SENTRY_ENV_VARS.md'), 'utf-8');
        return content.includes('NEXT_PUBLIC_SENTRY_DSN');
      } catch {
        return false;
      }
    });

    expect(envDocsExist).toBe(true);
  });
});
