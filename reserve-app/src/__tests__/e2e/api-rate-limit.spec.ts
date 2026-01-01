import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: APIレート制限
 *
 * 対応するGherkinシナリオ: api-rate-limit.feature
 *
 * 注意: このテストは実際のRedisインスタンスに依存します。
 * CI環境では、モックRedisまたはテスト用のRedisインスタンスを使用してください。
 */

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('APIレート制限', () => {
  test.beforeEach(async () => {
    // 各テスト前にクリーンアップ
    // 注: 実際の実装では、テスト用のRedisインスタンスをクリアする必要があります
  });

  test('ログインAPIのレート制限（10リクエスト/分/IP）', async ({ request }) => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const responses = [];

    // 10回リクエストを送信（すべて成功すべき - 認証は失敗するが、レート制限には達しない）
    for (let i = 0; i < 10; i++) {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: loginData,
      });
      responses.push(response);
    }

    // 最初の10回はレート制限エラーではない（ただし、認証エラーの可能性はある）
    for (let i = 0; i < 10; i++) {
      expect(responses[i].status()).not.toBe(429);
    }

    // 11回目はレート制限エラー
    const response11 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: loginData,
    });
    expect(response11.status()).toBe(429);

    const errorBody = await response11.json();
    expect(errorBody.error).toContain('Too many requests');

    // レート制限ヘッダーを確認
    expect(response11.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response11.headers()['x-ratelimit-remaining']).toBeDefined();
    expect(response11.headers()['x-ratelimit-reset']).toBeDefined();
  });

  test('登録APIのレート制限（5リクエスト/時間/IP）', async ({ request }) => {
    const responses = [];

    // 5回リクエストを送信
    for (let i = 0; i < 5; i++) {
      const registerData = {
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'Test1234',
      };

      const response = await request.post(`${BASE_URL}/api/auth/register`, {
        data: registerData,
      });
      responses.push(response);
    }

    // 最初の5回はレート制限エラーではない
    for (let i = 0; i < 5; i++) {
      expect(responses[i].status()).not.toBe(429);
    }

    // 6回目はレート制限エラー
    const registerData6 = {
      name: 'Test User 6',
      email: 'test6@example.com',
      password: 'Test1234',
    };

    const response6 = await request.post(`${BASE_URL}/api/auth/register`, {
      data: registerData6,
    });
    expect(response6.status()).toBe(429);

    const errorBody = await response6.json();
    expect(errorBody.error).toContain('Too many requests');

    // Retry-Afterヘッダーを確認
    expect(response6.headers()['retry-after']).toBeDefined();
  });

  test('ログアウトAPIのレート制限（20リクエスト/分/IP）', async ({ request }) => {
    const responses = [];

    // 20回リクエストを送信
    for (let i = 0; i < 20; i++) {
      const response = await request.post(`${BASE_URL}/api/auth/logout`);
      responses.push(response);
    }

    // 最初の20回はレート制限エラーではない
    for (let i = 0; i < 20; i++) {
      expect(responses[i].status()).not.toBe(429);
    }

    // 21回目はレート制限エラー
    const response21 = await request.post(`${BASE_URL}/api/auth/logout`);
    expect(response21.status()).toBe(429);

    const errorBody = await response21.json();
    expect(errorBody.error).toContain('Too many requests');
  });

  test('レート制限エラーレスポンスの形式', async ({ request }) => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    // レート制限まで送信
    for (let i = 0; i < 10; i++) {
      await request.post(`${BASE_URL}/api/auth/login`, {
        data: loginData,
      });
    }

    // レート制限超過
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: loginData,
    });

    // ステータスコード確認
    expect(response.status()).toBe(429);

    // エラーメッセージ確認
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Too many requests');

    // レート制限ヘッダー確認
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBe('0');
    expect(headers['x-ratelimit-reset']).toBeDefined();

    // X-RateLimit-Resetは未来のタイムスタンプであるべき
    const resetTime = parseInt(headers['x-ratelimit-reset'], 10);
    const now = Math.floor(Date.now() / 1000);
    expect(resetTime).toBeGreaterThan(now);
  });

  // 注: 以下のテストは時間がかかるため、通常はスキップすることを推奨
  test.skip('レート制限のリセット', async ({ request }) => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    // レート制限まで送信
    for (let i = 0; i < 10; i++) {
      await request.post(`${BASE_URL}/api/auth/login`, {
        data: loginData,
      });
    }

    // レート制限超過を確認
    const response1 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: loginData,
    });
    expect(response1.status()).toBe(429);

    // 1分間待機
    await new Promise((resolve) => setTimeout(resolve, 61000));

    // 再度リクエスト
    const response2 = await request.post(`${BASE_URL}/api/auth/login`, {
      data: loginData,
    });
    expect(response2.status()).not.toBe(429);
  });
});
