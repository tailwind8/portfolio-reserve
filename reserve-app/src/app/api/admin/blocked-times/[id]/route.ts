import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * PATCH /api/admin/blocked-times/[id]
 * 予約ブロックを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { startDateTime, endDateTime, reason, description } = body;

    // バリデーション
    if (startDateTime && endDateTime) {
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
    }

    // 予約ブロックを更新
    const blockedTime = await prisma.bookingBlockedTimeSlot.update({
      where: {
        id,
        tenantId: TENANT_ID,
      },
      data: {
        ...(startDateTime && { startDateTime: new Date(startDateTime) }),
        ...(endDateTime && { endDateTime: new Date(endDateTime) }),
        ...(reason !== undefined && { reason }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json({
      success: true,
      data: blockedTime,
      message: '予約ブロックを更新しました',
    });
  } catch (error) {
    console.error('Failed to update blocked time:', error);
    return NextResponse.json(
      {
        success: false,
        error: '予約ブロックの更新に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blocked-times/[id]
 * 予約ブロックを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.bookingBlockedTimeSlot.delete({
      where: {
        id,
        tenantId: TENANT_ID,
      },
    });

    return NextResponse.json({
      success: true,
      message: '予約ブロックを削除しました',
    });
  } catch (error) {
    console.error('Failed to delete blocked time:', error);
    return NextResponse.json(
      {
        success: false,
        error: '予約ブロックの削除に失敗しました',
      },
      { status: 500 }
    );
  }
}
