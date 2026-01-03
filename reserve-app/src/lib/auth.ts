import { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { prisma } from './prisma';
import type { User } from '@supabase/supabase-js';
import { errorResponse } from './api-response';
import { logSecurityEvent, getClientIp, getUserAgent } from './security-logger';

/**
 * 認証ヘルパー関数
 */

/**
 * 現在のログインユーザー情報を取得
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * ログイン中かどうかを確認
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * サーバーサイドでセッションを取得
 * API routeやServer Actionsで使用
 */
export async function getServerSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Supabase AuthのユーザーIDからPrismaのBookingUserを取得
 */
export async function getBookingUserByAuthId(authId: string) {
  return await prisma.bookingUser.findUnique({
    where: { authId },
  });
}

/**
 * Supabase AuthのユーザーIDから、または新規作成してBookingUserを取得
 * ログイン時に自動的にPrismaレコードを作成する場合に使用
 */
export async function getOrCreateBookingUser(
  authId: string,
  email: string,
  name?: string,
  phone?: string
) {
  // 既存ユーザーを検索
  let user = await prisma.bookingUser.findUnique({
    where: { authId },
  });

  // 存在しない場合は作成
  if (!user) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
    user = await prisma.bookingUser.create({
      data: {
        authId,
        email,
        name,
        phone,
        tenantId,
      },
    });
  }

  return user;
}

/**
 * 管理者権限チェック
 * 実装例: メールアドレスのドメインや特定のロールで判定
 */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  // 例: 特定のメールアドレスを管理者とする
  const adminEmails = [
    'admin@demo-booking.com',
    'admin@store.com',
    // 環境変数から取得することも可能
    process.env.ADMIN_EMAIL,
  ].filter(Boolean);

  return adminEmails.includes(user.email || '');
}

/**
 * APIルートで認証チェックを行うヘルパー
 * 認証されていない場合は401エラーを返す
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * APIルートで管理者権限チェックを行うヘルパー
 * 管理者でない場合は403エラーを返す
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const adminCheck = await isAdmin(user);
  if (!adminCheck) {
    throw new Error('Forbidden');
  }
  return user;
}

/**
 * リクエストヘッダーから認証チェック（ヘッダーベース）
 *
 * E2Eテスト環境やAPIリクエストで使用します。
 * リクエストヘッダーから `x-user-id` を取得し、認証状態を確認します。
 * 未認証の場合は401エラーレスポンスを返します。
 *
 * @param request - NextRequest オブジェクト
 * @returns ユーザーIDまたは401エラーレスポンス
 */
export function checkAuthHeader(
  request: NextRequest
): string | ReturnType<typeof errorResponse> {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return errorResponse('認証が必要です', 401, 'UNAUTHORIZED');
  }

  return userId;
}

/**
 * リクエストヘッダーから管理者権限チェック（ヘッダーベース）
 *
 * E2Eテスト環境やAPIリクエストで使用します。
 * リクエストヘッダーから `x-user-role` を取得し、管理者権限を確認します。
 * 管理者でない場合は403エラーレスポンスを返します。
 *
 * @param request - NextRequest オブジェクト
 * @returns 管理者のユーザーIDまたは401/403エラーレスポンス
 */
export function checkAdminAuthHeader(
  request: NextRequest
): string | ReturnType<typeof errorResponse> {
  // E2Eテスト環境では認証をスキップ
  const skipAuthInTest = process.env.SKIP_AUTH_IN_TEST === 'true';
  if (skipAuthInTest) {
    return 'test-admin-user'; // テスト用のダミーユーザーIDを返す
  }

  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!userId) {
    return errorResponse('認証が必要です', 401, 'UNAUTHORIZED');
  }

  if (userRole !== 'admin' && userRole !== 'ADMIN') {
    // 権限エラーをログに記録
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);
    const path = new URL(request.url).pathname;

    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      userId,
      ipAddress,
      userAgent,
      metadata: { path, method: request.method, reason: 'Admin role required' },
    }).catch((error) => {
      console.error('Failed to log security event:', error);
    });

    return errorResponse('管理者権限が必要です', 403, 'FORBIDDEN');
  }

  return userId;
}

/**
 * ユーザーがリソースにアクセスする権限があるかチェック（ヘッダーベース）
 *
 * @param request - NextRequest オブジェクト
 * @param resourceUserId - リソースの所有者のユーザーID
 * @returns 権限がある場合はtrue、ない場合は403エラーレスポンス
 */
export function checkResourceAccessHeader(
  request: NextRequest,
  resourceUserId: string
): true | ReturnType<typeof errorResponse> {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!userId) {
    return errorResponse('認証が必要です', 401, 'UNAUTHORIZED');
  }

  // 管理者は全てのリソースにアクセス可能
  if (userRole === 'admin' || userRole === 'ADMIN') {
    return true;
  }

  // 一般ユーザーは自分のリソースのみアクセス可能
  if (userId === resourceUserId) {
    return true;
  }

  // 権限エラーをログに記録
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const path = new URL(request.url).pathname;

  logSecurityEvent({
    eventType: 'UNAUTHORIZED_ACCESS',
    userId,
    ipAddress,
    userAgent,
    metadata: {
      path,
      method: request.method,
      reason: 'Resource access denied',
      resourceUserId,
    },
  }).catch((error) => {
    console.error('Failed to log security event:', error);
  });

  return errorResponse('このリソースにアクセスする権限がありません', 403, 'FORBIDDEN');
}
