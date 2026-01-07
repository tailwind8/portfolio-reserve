import { prisma } from './prisma';
import type { Prisma } from '@prisma/client';

/**
 * セキュリティイベントの種類
 */
type SecurityEventType =
  | 'LOGIN_SUCCESS' // ログイン成功
  | 'LOGIN_FAILED' // ログイン失敗
  | 'USER_REGISTER' // ユーザー登録
  | 'LOGOUT' // ログアウト
  | 'UNAUTHORIZED_ACCESS' // 権限のないアクセス試行
  | 'RATE_LIMIT_EXCEEDED' // レート制限超過
  | 'CSRF_VALIDATION_FAILED'; // CSRF検証失敗

/**
 * セキュリティログデータの型定義
 */
export interface SecurityLogData {
  eventType: SecurityEventType;
  userId?: string; // ログインユーザーID（存在する場合）
  ipAddress?: string; // リクエスト元IPアドレス
  userAgent?: string; // User-Agent文字列
  metadata?: Prisma.InputJsonValue; // その他の情報（email、reason、pathなど）
}

/**
 * セキュリティイベントをデータベースに記録する
 *
 * @param data セキュリティログデータ
 *
 * @example
 * ```typescript
 * // ログイン成功
 * await logSecurityEvent({
 *   eventType: 'LOGIN_SUCCESS',
 *   userId: user.id,
 *   ipAddress: request.ip,
 *   userAgent: request.headers.get('user-agent'),
 *   metadata: { email: user.email },
 * });
 *
 * // ログイン失敗
 * await logSecurityEvent({
 *   eventType: 'LOGIN_FAILED',
 *   ipAddress: request.ip,
 *   userAgent: request.headers.get('user-agent'),
 *   metadata: { email: 'test@example.com', reason: 'Invalid password' },
 * });
 *
 * // 権限エラー
 * await logSecurityEvent({
 *   eventType: 'UNAUTHORIZED_ACCESS',
 *   userId: user.id,
 *   ipAddress: request.ip,
 *   userAgent: request.headers.get('user-agent'),
 *   metadata: { path: '/admin/dashboard', method: 'GET' },
 * });
 * ```
 */
export async function logSecurityEvent(data: SecurityLogData): Promise<void> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    await prisma.securityLog.create({
      data: {
        tenantId,
        eventType: data.eventType,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    // ログ記録失敗は本処理に影響させない
    // コンソールにエラーを出力するのみ
    console.error('Failed to log security event:', error);
  }
}

/**
 * NextRequestからIPアドレスを取得する
 *
 * @param request NextRequest
 * @returns IPアドレス
 */
export function getClientIp(request: Request): string {
  // Vercelの場合、x-real-ipヘッダーにIPアドレスが含まれる
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    // x-forwarded-forは複数のIPアドレスを含む場合があるため、最初のものを取得
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // フォールバック
  return '127.0.0.1';
}

/**
 * NextRequestからUser-Agentを取得する
 *
 * @param request NextRequest
 * @returns User-Agent文字列
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') ?? undefined;
}
