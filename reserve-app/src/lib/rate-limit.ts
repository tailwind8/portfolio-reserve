import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent, getUserAgent } from './security-logger';

/**
 * Upstash Redisクライアント
 * 環境変数からRedis接続情報を取得
 */
let redis: Redis | null = null;

/**
 * Redisクライアントを取得（遅延初期化）
 *
 * 環境変数が設定されていない場合はnullを返す
 * （開発環境やCI環境での柔軟性のため）
 */
function getRedis(): Redis | null {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // 環境変数が設定されていない場合は警告を出してnullを返す
    if (!url || !token) {
      console.warn(
        '[Rate Limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Rate limiting will be disabled.'
      );
      return null;
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

/**
 * Ratelimitインスタンスを作成（Redisがnullの場合はnullを返す）
 */
function createRateLimit(
  limit: number,
  window: Duration,
  prefix: string
): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) {
    return null;
  }

  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix,
  });
}

/**
 * ログインAPI用のレート制限
 * 10リクエスト/分/IP
 */
export const loginRateLimit = createRateLimit(10, '1 m', 'ratelimit:login');

/**
 * 登録API用のレート制限
 * 5リクエスト/時間/IP
 */
export const registerRateLimit = createRateLimit(5, '1 h', 'ratelimit:register');

/**
 * ログアウトAPI用のレート制限
 * 20リクエスト/分/IP
 */
export const logoutRateLimit = createRateLimit(20, '1 m', 'ratelimit:logout');

/**
 * 一般API用のレート制限
 * 100リクエスト/分/IP
 */
export const generalRateLimit = createRateLimit(100, '1 m', 'ratelimit:general');

/**
 * レート制限チェックのヘルパー関数
 *
 * @param request - Next.jsリクエストオブジェクト
 * @param ratelimit - Ratelimitインスタンス（nullの場合はレート制限なし）
 * @returns レート制限エラーレスポンス、または null（制限内の場合）
 */
export async function checkRateLimit(
  request: NextRequest,
  ratelimit: Ratelimit | null
): Promise<NextResponse | null> {
  // Ratelimitインスタンスがnullの場合はレート制限をスキップ
  if (!ratelimit) {
    return null;
  }

  try {
    // IPアドレスを取得（Edge Runtime対応）
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // レート制限チェック
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    // レート制限に達していない場合
    if (success) {
      return null;
    }

    // レート制限に達した場合、429エラーを返す
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    // レート制限超過をログに記録
    const userAgent = getUserAgent(request);
    const endpoint = new URL(request.url).pathname;
    await logSecurityEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      ipAddress: ip,
      userAgent,
      metadata: {
        endpoint,
        limit: limit.toString(),
        remaining: remaining.toString(),
        reset: new Date(reset).toISOString(),
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  } catch (error) {
    // レート制限チェックでエラーが発生した場合、ログに記録してリクエストを許可
    // （サービス継続性を優先）
    console.error('[Rate Limit] Error checking rate limit:', error);
    return null;
  }
}
