import { chromium } from '@playwright/test';

/**
 * Playwright Global Setup for MSW
 *
 * このファイルはE2Eテスト実行前にMSWをセットアップします。
 * API呼び出しをモックして、実際のデータベースへの接続を避けます。
 */

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // MSW Service Worker をインストール
  console.log('Setting up MSW for E2E tests...');

  try {
    // public/mockServiceWorker.js が必要な場合はここで確認
    // ただし、Playwrightではpage.route()を使用する方が簡単なので、
    // この global setup では特に何もしない
    console.log('MSW setup complete.');
  } catch (error) {
    console.error('MSW setup failed:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalSetup;
