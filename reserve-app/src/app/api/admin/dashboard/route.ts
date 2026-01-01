import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuthHeader } from '@/lib/auth';

/**
 * GET /api/admin/dashboard
 * 管理者ダッシュボードの基本情報を取得
 *
 * このエンドポイントは管理者権限が必要です。
 * 一般ユーザーがアクセスすると403エラーを返します。
 */
export async function GET(request: NextRequest) {
  // 管理者権限チェック
  const authResult = checkAdminAuthHeader(request);
  if (typeof authResult !== 'string') {
    return authResult; // 401または403エラー
  }

  // 管理者ダッシュボードの基本情報を返す
  return NextResponse.json({
    success: true,
    data: {
      message: '管理者ダッシュボードへようこそ',
      adminUserId: authResult,
    },
  });
}
