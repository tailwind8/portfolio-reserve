import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isSafeRedirect } from '@/lib/sanitize';

/**
 * メモリキャッシュ（Edge Runtime互換）
 * システムの公開状態を10秒間キャッシュ
 */
const publicStatusCache = {
  value: null as boolean | null,
  expiresAt: 0,
};

const CACHE_TTL_MS = 10 * 1000; // 10秒

/**
 * システムの公開状態を取得
 * キャッシュヒット時は即座に返却、ミス時はAPIから取得
 */
async function getPublicStatus(request: NextRequest): Promise<boolean> {
  const now = Date.now();

  // キャッシュヒット
  if (publicStatusCache.value !== null && publicStatusCache.expiresAt > now) {
    return publicStatusCache.value;
  }

  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
    const baseUrl = request.nextUrl.origin;
    const apiUrl = `${baseUrl}/api/internal/public-status?tenantId=${tenantId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3秒タイムアウト
    });

    const data = await response.json();
    const isPublic = data.isPublic ?? true;

    // キャッシュ保存
    publicStatusCache.value = isPublic;
    publicStatusCache.expiresAt = now + CACHE_TTL_MS;

    return isPublic;
  } catch (error) {
    console.error('[Middleware] Failed to fetch public status:', error);
    // エラー時はデフォルトで公開中（サービス継続優先）
    return true;
  }
}

/**
 * CSRF保護
 * POSTリクエストのoriginとhostを検証
 */
function validateCSRF(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // API routes以外はスキップ
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // GETリクエストはスキップ
  if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'PATCH' && request.method !== 'DELETE') {
    return null;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // originヘッダーが存在しない場合（例：サーバー間通信）はスキップ
  if (!origin) {
    return null;
  }

  // originとhostが一致するかチェック
  // 例: origin = "https://example.com", host = "example.com"
  const originHost = new URL(origin).host;
  if (originHost !== host) {
    console.warn('[CSRF] Blocked request from different origin:', { origin: originHost, host });
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // 検証成功
  return null;
}

/**
 * 認証チェック
 * Supabaseのセッションcookieを確認
 */
function checkAuthentication(request: NextRequest): boolean {
  // Supabaseのセッションcookie名パターン
  // sb-<project-ref>-auth-token または sb-<project-ref>-auth-token-code-verifier
  const cookies = request.cookies;

  // Supabaseのアクセストークンcookieを探す
  // 一般的なパターン: sb-*-auth-token
  let hasAuthToken = false;
  cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token') && cookie.value) {
      hasAuthToken = true;
    }
  });

  return hasAuthToken;
}

/**
 * ミドルウェア
 * 1. CSRF保護（POSTリクエスト時のorigin検証）
 * 2. 管理画面への認証チェック
 * 3. システム非公開時は一般ユーザーをメンテナンス画面にリダイレクト
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF保護チェック（最優先）
  const csrfResponse = validateCSRF(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  // 2. リダイレクトURLのバリデーション（オープンリダイレクト防止）
  const redirectParam = request.nextUrl.searchParams.get('redirect');
  if (redirectParam) {
    // 内部URLのみ許可（相対パスまたは同一オリジン）
    if (!isSafeRedirect(redirectParam, [request.nextUrl.origin])) {
      console.warn('[Security] Blocked open redirect attempt:', redirectParam);
      // 危険なリダイレクトURLは無視してホームページへ
      const safeUrl = new URL('/', request.url);
      return NextResponse.redirect(safeUrl);
    }
  }

  // 3. スーパー管理者画面への認証チェック
  if (pathname.startsWith('/super-admin/')) {
    // ログインページは除外
    if (!pathname.startsWith('/super-admin/login')) {
      // E2Eテスト環境では認証をスキップ
      const skipAuthInTest = process.env.SKIP_AUTH_IN_TEST === 'true';
      if (!skipAuthInTest) {
        const isAuthenticated = checkAuthentication(request);
        if (!isAuthenticated) {
          // 未ログイン時は/super-admin/loginへリダイレクト
          const loginUrl = new URL('/super-admin/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          loginUrl.searchParams.set('message', 'ログインが必要です');
          console.log('[Auth] Unauthorized access to super admin page, redirecting to login');
          return NextResponse.redirect(loginUrl);
        }
        // NOTE: SUPER_ADMINロールの検証はEdge RuntimeでPrismaが使えないため、
        // 各ページコンポーネントまたはAPIルートで実装する必要があります。
      }
    }
  }

  // 4. 管理画面への認証チェック
  if (pathname.startsWith('/admin/')) {
    // ログインページは除外
    if (!pathname.startsWith('/admin/login')) {
      // E2Eテスト環境では認証をスキップ
      const skipAuthInTest = process.env.SKIP_AUTH_IN_TEST === 'true';
      if (!skipAuthInTest) {
        const isAuthenticated = checkAuthentication(request);
        if (!isAuthenticated) {
          // 未ログイン時は/admin/loginへリダイレクト（元のURLをクエリパラメータに保存）
          const loginUrl = new URL('/admin/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          loginUrl.searchParams.set('message', 'ログインが必要です');
          console.log('[Auth] Unauthorized access to admin page, redirecting to login');
          return NextResponse.redirect(loginUrl);
        }
      }
    }
  }

  // 5. 一般ユーザー向け保護ページへの認証チェック
  const protectedPaths = ['/mypage', '/booking/confirm', '/reservations'];
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    // E2Eテスト環境では認証をスキップ
    const skipAuthInTest = process.env.SKIP_AUTH_IN_TEST === 'true';
    if (!skipAuthInTest) {
      const isAuthenticated = checkAuthentication(request);
      if (!isAuthenticated) {
        // 未ログイン時は/loginへリダイレクト（元のURLをクエリパラメータに保存）
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('message', 'ログインが必要です');
        console.log('[Auth] Unauthorized access to protected page, redirecting to login');
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 除外パス（これらのパスは公開状態チェックをスキップ）
  const excludedPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/super-admin/', // スーパー管理者画面（認証済み）
    '/admin/', // 管理画面（認証済み）
    '/maintenance', // メンテナンスページ自体
    '/login', // ログインページ
    '/admin/login', // 管理者ログインページ
    '/super-admin/login', // スーパー管理者ログインページ
    '/register', // 登録ページ
  ];

  const isExcluded = excludedPaths.some((path) => pathname.startsWith(path));
  if (isExcluded) {
    return NextResponse.next();
  }

  // 6. 公開状態チェック
  const isPublic = await getPublicStatus(request);

  if (!isPublic) {
    // 非公開時はメンテナンスページへリダイレクト
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  // 7. セキュリティヘッダーの追加（SameSite Cookie設定）
  const response = NextResponse.next();

  // SameSite=Lax属性をCookieに設定（CSRF対策）
  // ※ Next.jsのCookieは自動的にSameSite=Laxが設定されるため、
  // ここでは明示的に設定する必要はありませんが、念のため記載
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

/**
 * matcher: どのパスでミドルウェアを実行するか
 * 静的ファイルやNext.js内部ファイルは除外
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
