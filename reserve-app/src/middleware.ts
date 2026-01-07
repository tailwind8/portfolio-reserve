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
 * E2Eテスト環境で認証をスキップするかどうか
 */
function shouldSkipAuthInTest(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.SKIP_AUTH_IN_TEST === 'true';
}

/**
 * システムの公開状態を取得
 * キャッシュヒット時は即座に返却、ミス時はAPIから取得
 */
async function getPublicStatus(request: NextRequest): Promise<boolean> {
  const now = Date.now();

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
      signal: AbortSignal.timeout(3000),
    });

    const data = await response.json();
    const isPublic = data.isPublic ?? true;

    publicStatusCache.value = isPublic;
    publicStatusCache.expiresAt = now + CACHE_TTL_MS;

    return isPublic;
  } catch (error) {
    console.error('[Middleware] Failed to fetch public status:', error);
    return true;
  }
}

/**
 * CSRF保護（変更を伴うリクエストのorigin検証）
 */
function validateCSRF(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) {
    return null;
  }

  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(request.method)) {
    return null;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) {
    return null;
  }

  const originHost = new URL(origin).host;
  if (originHost !== host) {
    console.warn('[CSRF] Blocked request from different origin:', { origin: originHost, host });
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  return null;
}

/**
 * 認証チェック（Supabaseセッションcookieを確認）
 */
function checkAuthentication(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token') && cookie.value
  );
}

/**
 * 認証が必要なパスへのアクセスを検証し、未認証時はリダイレクト
 */
function handleProtectedRoute(
  request: NextRequest,
  loginPath: string
): NextResponse | null {
  if (shouldSkipAuthInTest()) {
    return null;
  }

  if (checkAuthentication(request)) {
    return null;
  }

  const { pathname } = request.nextUrl;
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('redirect', pathname);
  loginUrl.searchParams.set('message', 'ログインが必要です');
  console.log(`[Auth] Unauthorized access to ${pathname}, redirecting to ${loginPath}`);
  return NextResponse.redirect(loginUrl);
}

/** 公開状態チェックから除外するパス */
const PUBLIC_STATUS_EXCLUDED_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/super-admin/',
  '/admin/',
  '/maintenance',
  '/login',
  '/admin/login',
  '/super-admin/login',
  '/register',
];

/** 一般ユーザー向け保護パス */
const USER_PROTECTED_PATHS = ['/mypage', '/booking/confirm', '/reservations'];

/**
 * ミドルウェア
 * 1. CSRF保護（POSTリクエスト時のorigin検証）
 * 2. オープンリダイレクト防止
 * 3. 各種認証チェック
 * 4. システム非公開時はメンテナンス画面にリダイレクト
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CSRF保護チェック
  const csrfResponse = validateCSRF(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  // 2. オープンリダイレクト防止
  const redirectParam = request.nextUrl.searchParams.get('redirect');
  if (redirectParam && !isSafeRedirect(redirectParam, [request.nextUrl.origin])) {
    console.warn('[Security] Blocked open redirect attempt:', redirectParam);
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. スーパー管理者画面への認証チェック
  if (pathname.startsWith('/super-admin/') && !pathname.startsWith('/super-admin/login')) {
    const authResponse = handleProtectedRoute(request, '/super-admin/login');
    if (authResponse) {return authResponse;}
    // NOTE: SUPER_ADMINロールの検証はEdge RuntimeでPrismaが使えないため、
    // 各ページコンポーネントまたはAPIルートで実装する必要があります。
  }

  // 4. 管理画面への認証チェック
  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    const authResponse = handleProtectedRoute(request, '/admin/login');
    if (authResponse) {return authResponse;}
  }

  // 5. 一般ユーザー向け保護ページへの認証チェック
  const isUserProtectedPath = USER_PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isUserProtectedPath) {
    const authResponse = handleProtectedRoute(request, '/login');
    if (authResponse) {return authResponse;}
  }

  // 6. 公開状態チェック（除外パスはスキップ）
  const isExcluded = PUBLIC_STATUS_EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
  if (!isExcluded) {
    const isPublic = await getPublicStatus(request);
    if (!isPublic) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // 7. セキュリティヘッダーの追加
  const response = NextResponse.next();
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
