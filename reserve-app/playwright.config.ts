import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// .env.localファイルを読み込む
dotenv.config({ path: '.env.local' });

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI環境ではシャーディングで並列化するため、各シャード内は1ワーカー
  workers: process.env.CI ? 1 : undefined,
  // CI環境ではblobレポーターを使用（シャードマージ用）
  reporter: process.env.CI
    ? [['blob', { outputDir: 'blob-report' }]]
    : [['html']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: process.env.CI
    ? [
        // CI環境では高速化のためChromiumのみで実行
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        // ローカル開発では複数ブラウザでテスト
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
      ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // CI環境でのタイムアウトを延長
    env: {
      // CI環境では親プロセスから継承、ローカルではダミー値
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
      NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking',
      SKIP_AUTH_IN_TEST: 'true', // E2Eテスト時に認証をスキップ
      // Sentryを無効化（テスト環境）
      NEXT_PUBLIC_SENTRY_DSN: '',
    },
  },
});
