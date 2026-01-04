import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * GET /api/admin/blocked-times
 * 予約ブロック一覧を取得
 * クエリパラメータ:
 * - from: 開始日（YYYY-MM-DD形式）
 * - to: 終了日（YYYY-MM-DD形式）
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) return admin;

  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // 日付範囲フィルター
    const where: {
      tenantId: string;
      startDateTime?: { gte: Date };
      endDateTime?: { lte: Date };
    } = {
      tenantId: TENANT_ID,
    };

    if (fromDate) {
      where.startDateTime = { gte: new Date(fromDate) };
    }

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.endDateTime = { lte: endOfDay };
    }

    const blockedTimes = await prisma.bookingBlockedTimeSlot.findMany({
      where,
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: blockedTimes,
    });
  } catch (error) {
    console.error('Failed to fetch blocked times:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blocked times',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blocked-times
 * 新しい予約ブロックを追加
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) return admin;

  try {
    const body = await request.json();
    const { startDateTime, endDateTime, reason, description } = body;

    // バリデーション
    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        {
          success: false,
          error: '開始日時と終了日時は必須です',
        },
        { status: 400 }
      );
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      return NextResponse.json(
        {
          success: false,
          error: '終了日時は開始日時より後にしてください',
        },
        { status: 400 }
      );
    }

    // 予約ブロックを作成
    const blockedTime = await prisma.bookingBlockedTimeSlot.create({
      data: {
        tenantId: TENANT_ID,
        startDateTime: start,
        endDateTime: end,
        reason: reason || null,
        description: description || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: blockedTime,
      message: '予約ブロックを追加しました',
    });
  } catch (error) {
    console.error('Failed to create blocked time:', error);
    return NextResponse.json(
      {
        success: false,
        error: '予約ブロックの追加に失敗しました',
      },
      { status: 500 }
    );
  }
}
