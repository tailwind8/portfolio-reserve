import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/internal/public-status
 * ミドルウェア用の軽量API
 *
 * システムの公開状態（isPublic）を取得する内部API
 * 認証不要（ミドルウェアから認証前に呼び出される）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId =
      searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    const settings = await prisma.bookingSettings.findUnique({
      where: { tenantId },
      select: { isPublic: true }, // 必要最小限のフィールドのみ取得
    });

    const isPublic = settings?.isPublic ?? true; // デフォルト: 公開中

    return NextResponse.json(
      { isPublic, tenantId },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/internal/public-status error:', error);
    // エラー時はデフォルトで公開中（サービス継続優先）
    return NextResponse.json({ isPublic: true }, { status: 200 });
  }
}
