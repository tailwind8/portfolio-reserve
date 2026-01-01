import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';
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

  // 2. 管理画面への認証チェック
  if (pathname.startsWith('/admin/')) {
    const isAuthenticated = checkAuthentication(request);
    if (!isAuthenticated) {
      // 未ログイン時は/loginへリダイレクト（元のURLをクエリパラメータに保存）
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log('[Auth] Unauthorized access to admin page, redirecting to login');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 除外パス（これらのパスは公開状態チェックをスキップ）
  const excludedPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/admin/', // 管理画面（認証済み）
    '/maintenance', // メンテナンスページ自体
    '/login', // 管理者再ログイン用
    '/register', // 登録ページ
  ];

  const isExcluded = excludedPaths.some((path) => pathname.startsWith(path));
  if (isExcluded) {
    return NextResponse.next();
  }

  // 3. 公開状態チェック
  const isPublic = await getPublicStatus(request);

  if (!isPublic) {
    // 非公開時はメンテナンスページへリダイレクト
    const maintenanceUrl = new URL('/maintenance', request.url);
    return NextResponse.redirect(maintenanceUrl);
  }

  return NextResponse.next();
}

/**
 * matcher: どのパスでミドルウェアを実行するか
 * 静的ファイルやNext.js内部ファイルは除外
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
