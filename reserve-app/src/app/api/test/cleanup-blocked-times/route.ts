import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * DELETE /api/test/cleanup-blocked-times
 * テスト用: 予約ブロックをすべて削除
 * 注意: テスト環境でのみ使用すること
 */
export async function DELETE() {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        success: false,
        error: 'This endpoint is only available in development',
      },
      { status: 403 }
    );
  }

  try {
    await prisma.bookingBlockedTimeSlot.deleteMany({
      where: {
        tenantId: TENANT_ID,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All blocked times have been deleted',
    });
  } catch (error) {
    console.error('Failed to cleanup blocked times:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cleanup blocked times',
      },
      { status: 500 }
    );
  }
}
