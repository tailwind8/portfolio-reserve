import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

/**
 * GET /api/admin/dashboard
 * 管理者ダッシュボードの基本情報を取得
 *
 * このエンドポイントは管理者権限が必要です。
 * 一般ユーザーがアクセスすると403エラーを返します。
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  // 管理者ダッシュボードの基本情報を返す
  return NextResponse.json({
    success: true,
    data: {
      message: '管理者ダッシュボードへようこそ',
      adminUserId: admin.userId,
    },
  });
}
