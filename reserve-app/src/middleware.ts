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
 * ミドルウェア
 * システム非公開時は一般ユーザーをメンテナンス画面にリダイレクト
 * 管理画面（/admin/*）は常にアクセス可能
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 除外パス（これらのパスはチェックをスキップ）
  const excludedPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/admin/', // 管理画面は常にアクセス可能
    '/maintenance', // メンテナンスページ自体
    '/login', // 管理者再ログイン用
    '/register', // 登録ページ
  ];

  const isExcluded = excludedPaths.some((path) => pathname.startsWith(path));
  if (isExcluded) {
    return NextResponse.next();
  }

  // 公開状態チェック
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
