import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getTenantId } from '@/lib/api-utils';

/**
 * PATCH /api/admin/blocked-times/[id]
 * 予約ブロックを更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;
    const body = await request.json();
    const { startDateTime, endDateTime, reason, description } = body;

    // バリデーション
    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (end <= start) {
        return errorResponse('終了日時は開始日時より後にしてください', 400, 'VALIDATION_ERROR');
      }
    }

    // 予約ブロックを更新
    const blockedTime = await prisma.bookingBlockedTimeSlot.update({
      where: { id, tenantId: getTenantId() },
      data: {
        ...(startDateTime && { startDateTime: new Date(startDateTime) }),
        ...(endDateTime && { endDateTime: new Date(endDateTime) }),
        ...(reason !== undefined && { reason }),
        ...(description !== undefined && { description }),
      },
    });

    return successResponse({ data: blockedTime, message: '予約ブロックを更新しました' });
  } catch (error) {
    console.error('Failed to update blocked time:', error);
    return errorResponse('予約ブロックの更新に失敗しました', 500, 'INTERNAL_ERROR');
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
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;

    await prisma.bookingBlockedTimeSlot.delete({
      where: { id, tenantId: getTenantId() },
    });

    return successResponse({ message: '予約ブロックを削除しました' });
  } catch (error) {
    console.error('Failed to delete blocked time:', error);
    return errorResponse('予約ブロックの削除に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
