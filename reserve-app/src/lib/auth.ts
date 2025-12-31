import { supabase } from './supabase';
import { prisma } from './prisma';
import type { User } from '@supabase/supabase-js';

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
 * Supabase AuthのユーザーIDからPrismaのRestaurantUserを取得
 */
export async function getRestaurantUserByAuthId(authId: string) {
  return await prisma.restaurantUser.findUnique({
    where: { authId },
  });
}

/**
 * Supabase AuthのユーザーIDから、または新規作成してRestaurantUserを取得
 * ログイン時に自動的にPrismaレコードを作成する場合に使用
 */
export async function getOrCreateRestaurantUser(
  authId: string,
  email: string,
  name?: string,
  phone?: string
) {
  // 既存ユーザーを検索
  let user = await prisma.restaurantUser.findUnique({
    where: { authId },
  });

  // 存在しない場合は作成
  if (!user) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';
    user = await prisma.restaurantUser.create({
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
    'admin@demo-restaurant.com',
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
