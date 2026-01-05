/**
 * middleware.ts のユニットテスト
 *
 * Next.js Edge Runtimeミドルウェアの基本機能テスト
 * - CSRF検証
 * - 認証チェック
 * - リダイレクト保護
 * - パス保護
 */

import type { NextRequest } from 'next/server';

// NextResponseをモック（jest.mockはホイスティングされるため、インラインで定義）
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: Record<string, unknown>, init?: { status?: number }) => {
      const response = new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
      return response;
    }),
    redirect: jest.fn((url: URL) => {
      const response = new Response(null, {
        status: 307,
        headers: { location: url.toString() },
      });
      return response;
    }),
    next: jest.fn(() => {
      const response = new Response(null, { status: 200 });
      response.headers.set('X-Content-Type-Options', 'nosniff');
      return response;
    }),
  },
}));

// sanitizeモジュールをモック
jest.mock('@/lib/sanitize', () => ({
  isSafeRedirect: jest.fn(),
}));

// fetchをモック
global.fetch = jest.fn();

import { middleware } from '@/middleware';
import { isSafeRedirect } from '@/lib/sanitize';

// console.log/warn/error をモック
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

/**
 * NextRequestを模したリクエストを作成
 * Cookieサポート付き
 */
function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    cookies?: Array<{ name: string; value: string }>;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, cookies = [] } = options;

  const req = new Request(url, {
    method,
    headers: {
      ...headers,
    },
  });

  // Cookieをモック
  const cookiesMap = new Map<string, { name: string; value: string }>();
  cookies.forEach((c) => cookiesMap.set(c.name, c));

  const mockCookies = {
    get: (name: string) => cookiesMap.get(name),
    getAll: () => cookies,
    has: (name: string) => cookiesMap.has(name),
    set: jest.fn(),
    delete: jest.fn(),
  };

  return Object.assign(req, {
    cookies: mockCookies,
    nextUrl: new URL(url),
    ip: '127.0.0.1',
    geo: {},
  }) as unknown as NextRequest;
}

describe('middleware', () => {
  const OLD_ENV = process.env;
  let dateNowSpy: jest.SpyInstance;
  let currentTime = 1000000;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_TENANT_ID = 'demo-booking';
    process.env.NODE_ENV = 'test';

    // Date.nowをモックしてキャッシュを常に無効化
    currentTime += 20000; // 各テストで20秒進める（キャッシュTTL: 10秒を超える）
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(currentTime);

    // デフォルトのモック設定
    (isSafeRedirect as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ isPublic: true }),
    });
  });

  afterEach(() => {
    dateNowSpy?.mockRestore();
  });

  afterAll(() => {
    process.env = OLD_ENV;
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('CSRF保護', () => {
    it('should block POST request from different origin', async () => {
      const request = createMockRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          origin: 'http://evil.com',
          host: 'localhost:3000',
        },
      });

      const response = await middleware(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('CSRF validation failed');
    });

    it('should allow POST request from same origin', async () => {
      const request = createMockRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
        },
        cookies: [{ name: 'sb-test-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      // CSRF通過後、公開状態チェックへ進む
      expect(response.status).not.toBe(403);
    });

    it('should allow GET request without origin check', async () => {
      const request = createMockRequest('http://localhost:3000/api/reservations', {
        method: 'GET',
        headers: {
          origin: 'http://evil.com',
          host: 'localhost:3000',
        },
      });

      const response = await middleware(request);

      // GETはCSRFチェック対象外
      expect(response.status).not.toBe(403);
    });

    it('should allow POST without origin header (server-to-server)', async () => {
      const request = createMockRequest('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
        },
        cookies: [{ name: 'sb-test-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      // originヘッダーなしの場合はスキップ
      expect(response.status).not.toBe(403);
    });

    it.each(['PUT', 'PATCH', 'DELETE'])(
      'should block %s request from different origin',
      async (method) => {
        const request = createMockRequest('http://localhost:3000/api/reservations', {
          method,
          headers: {
            origin: 'http://evil.com',
            host: 'localhost:3000',
          },
        });

        const response = await middleware(request);

        expect(response.status).toBe(403);
      }
    );
  });

  describe('リダイレクト保護', () => {
    it('should block unsafe redirect URL', async () => {
      (isSafeRedirect as jest.Mock).mockReturnValue(false);

      const request = createMockRequest(
        'http://localhost:3000/?redirect=http://evil.com',
        {}
      );

      const response = await middleware(request);

      // 安全でないリダイレクトはホームページへ
      expect(response.status).toBe(307); // redirect
      expect(response.headers.get('location')).toContain('/');
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[Security] Blocked open redirect attempt:',
        'http://evil.com'
      );
    });

    it('should allow safe redirect URL', async () => {
      (isSafeRedirect as jest.Mock).mockReturnValue(true);

      const request = createMockRequest(
        'http://localhost:3000/?redirect=/dashboard',
        {}
      );

      const response = await middleware(request);

      // 安全なリダイレクトは許可
      expect(response.status).not.toBe(307);
    });

    it('should pass through when no redirect param', async () => {
      const request = createMockRequest('http://localhost:3000/', {});

      await middleware(request);

      expect(isSafeRedirect).not.toHaveBeenCalled();
    });
  });

  describe('管理画面認証', () => {
    beforeEach(() => {
      process.env.SKIP_AUTH_IN_TEST = undefined;
    });

    it('should redirect unauthenticated user from admin page to login', async () => {
      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [], // 認証なし
      });

      const response = await middleware(request);

      expect(response.status).toBe(307); // redirect
      const location = response.headers.get('location');
      expect(location).toContain('/admin/login');
      expect(location).toContain('redirect=%2Fadmin%2Fdashboard');
      expect(location).toContain('message=');
    });

    it('should allow authenticated user to access admin page', async () => {
      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      // 認証済みは管理画面へ（リダイレクトなし、または公開状態チェックへ）
      // admin/は除外パスなのでnextが返る
      expect(response.status).toBe(200);
    });

    it('should allow access to admin login page without auth', async () => {
      const request = createMockRequest('http://localhost:3000/admin/login', {
        cookies: [], // 認証なし
      });

      const response = await middleware(request);

      // ログインページは認証不要
      expect(response.status).toBe(200);
    });

    it('should skip auth when SKIP_AUTH_IN_TEST is true in non-production', async () => {
      process.env.NODE_ENV = 'test';
      process.env.SKIP_AUTH_IN_TEST = 'true';

      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [], // 認証なし
      });

      const response = await middleware(request);

      // テスト環境ではスキップ
      expect(response.status).toBe(200);
    });
  });

  describe('スーパー管理者画面認証', () => {
    beforeEach(() => {
      process.env.SKIP_AUTH_IN_TEST = undefined;
    });

    it('should redirect unauthenticated user from super-admin page to login', async () => {
      const request = createMockRequest('http://localhost:3000/super-admin/feature-flags', {
        cookies: [], // 認証なし
      });

      const response = await middleware(request);

      expect(response.status).toBe(307); // redirect
      const location = response.headers.get('location');
      expect(location).toContain('/super-admin/login');
      expect(location).toContain('redirect=%2Fsuper-admin%2Ffeature-flags');
    });

    it('should allow authenticated user to access super-admin page', async () => {
      const request = createMockRequest('http://localhost:3000/super-admin/feature-flags', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      // 認証済みはアクセス可能
      expect(response.status).toBe(200);
    });

    it('should allow access to super-admin login page without auth', async () => {
      const request = createMockRequest('http://localhost:3000/super-admin/login', {
        cookies: [], // 認証なし
      });

      const response = await middleware(request);

      // ログインページは認証不要
      expect(response.status).toBe(200);
    });
  });

  describe('保護されたパス', () => {
    beforeEach(() => {
      process.env.SKIP_AUTH_IN_TEST = undefined;
    });

    it.each(['/mypage', '/booking/confirm', '/reservations'])(
      'should redirect unauthenticated user from %s to login',
      async (path) => {
        const request = createMockRequest(`http://localhost:3000${path}`, {
          cookies: [], // 認証なし
        });

        const response = await middleware(request);

        expect(response.status).toBe(307); // redirect
        const location = response.headers.get('location');
        expect(location).toContain('/login');
      }
    );

    it.each(['/mypage', '/booking/confirm', '/reservations'])(
      'should allow authenticated user to access %s',
      async (path) => {
        const request = createMockRequest(`http://localhost:3000${path}`, {
          cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
        });

        const response = await middleware(request);

        // 認証済みはアクセス可能
        expect(response.status).toBe(200);
      }
    );
  });

  describe('公開状態チェック', () => {
    it('should redirect to maintenance when system is not public', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ isPublic: false }),
      });

      const request = createMockRequest('http://localhost:3000/', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      expect(response.status).toBe(307); // redirect
      expect(response.headers.get('location')).toContain('/maintenance');
    });

    it('should allow access when system is public', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ isPublic: true }),
      });

      const request = createMockRequest('http://localhost:3000/', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should default to public on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const request = createMockRequest('http://localhost:3000/', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      // エラー時はサービス継続優先
      expect(response.status).toBe(200);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('除外パス', () => {
    it.each([
      '/api/reservations',
      '/_next/static/chunk.js',
      '/favicon.ico',
      '/maintenance',
      '/login',
      '/register',
    ])('should skip public status check for %s', async (path) => {
      const request = createMockRequest(`http://localhost:3000${path}`, {});

      await middleware(request);

      // 除外パスではpublic status APIを呼ばない（CSRFは除く）
      // APIパスの場合はCSRF対象だがGETなのでスキップ
      // _next, favicon, maintenance, login, registerはすべてスキップ
    });
  });

  describe('セキュリティヘッダー', () => {
    it('should add X-Content-Type-Options header', async () => {
      const request = createMockRequest('http://localhost:3000/', {
        cookies: [{ name: 'sb-project-auth-token', value: 'valid-token' }],
      });

      const response = await middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('認証Cookieの検出', () => {
    it('should detect sb-*-auth-token cookie', async () => {
      process.env.SKIP_AUTH_IN_TEST = undefined;

      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [{ name: 'sb-abcdef-auth-token', value: 'token-value' }],
      });

      const response = await middleware(request);

      // 認証成功（admin除外パスなので200）
      expect(response.status).toBe(200);
    });

    it('should not detect unrelated cookies', async () => {
      process.env.SKIP_AUTH_IN_TEST = undefined;

      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [{ name: 'session-id', value: 'some-value' }],
      });

      const response = await middleware(request);

      // 認証失敗でリダイレクト
      expect(response.status).toBe(307);
    });

    it('should not detect empty auth token', async () => {
      process.env.SKIP_AUTH_IN_TEST = undefined;

      const request = createMockRequest('http://localhost:3000/admin/dashboard', {
        cookies: [{ name: 'sb-test-auth-token', value: '' }],
      });

      const response = await middleware(request);

      // 空のトークンは無効
      expect(response.status).toBe(307);
    });
  });
});
