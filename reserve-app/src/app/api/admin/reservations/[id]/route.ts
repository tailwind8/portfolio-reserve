import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  adminUpdateReservationSchema,
  validateStatusTransition,
  canEditReservation,
  canDeleteReservation,
} from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';
import {
  formatReservationForAdmin,
  getStatusChangeMessage,
  reservationIncludeForAdmin,
  buildReservationUpdateData,
} from '@/lib/reservation-helpers';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * GET /api/admin/reservations/:id
 * 管理者用の予約詳細を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;

    const reservation = await prisma.bookingReservation.findFirst({
      where: { id, tenantId: TENANT_ID },
      include: reservationIncludeForAdmin,
    });

    if (!reservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    return successResponse(formatReservationForAdmin(reservation));
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return errorResponse(
      'Failed to fetch reservation',
      500,
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * ステータス変更以外の編集フィールドが含まれているかチェック
 */
function hasNonStatusEdits(params: {
  menuId?: string;
  staffId?: string;
  reservedDate?: string;
  reservedTime?: string;
  notes?: string;
  status?: string;
}): boolean {
  return (
    params.menuId !== undefined ||
    params.staffId !== undefined ||
    params.reservedDate !== undefined ||
    params.reservedTime !== undefined ||
    params.notes !== undefined
  ) && params.status === undefined;
}

/**
 * トランザクションエラーを適切なHTTPエラーに変換
 */
function mapTransactionError(error: unknown): { statusCode: number; message: string; code: string } {
  const message = error instanceof Error ? error.message : '';
  const errorMap: Record<string, { statusCode: number; message: string; code: string }> = {
    MENU_NOT_FOUND: { statusCode: 404, message: 'Menu not found or inactive', code: 'MENU_NOT_FOUND' },
    STAFF_NOT_FOUND: { statusCode: 404, message: 'Staff not found or inactive', code: 'STAFF_NOT_FOUND' },
    TIME_SLOT_CONFLICT: { statusCode: 409, message: 'This time slot is already booked for the selected staff', code: 'TIME_SLOT_CONFLICT' },
  };
  return errorMap[message] || { statusCode: 500, message: 'Unknown error', code: 'UNKNOWN_ERROR' };
}

/**
 * PATCH /api/admin/reservations/:id
 * 管理者が既存予約を更新
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

    const validation = adminUpdateReservationSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { menuId, staffId, reservedDate, reservedTime, status, notes } = validation.data;

    const existingReservation = await prisma.bookingReservation.findFirst({
      where: { id, tenantId: TENANT_ID },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // ステータス遷移のバリデーション
    if (status !== undefined && status !== existingReservation.status) {
      const transitionValidation = validateStatusTransition(existingReservation.status, status);
      if (!transitionValidation.valid) {
        return errorResponse(transitionValidation.error || '不正な状態遷移です', 400, 'INVALID_STATUS_TRANSITION');
      }
    }

    // ステータスに応じた編集制限
    if (hasNonStatusEdits({ menuId, staffId, reservedDate, reservedTime, notes, status })) {
      const editValidation = canEditReservation(existingReservation.status);
      if (!editValidation.canEdit) {
        return errorResponse(editValidation.error || '予約の編集ができません', 400, 'CANNOT_EDIT_RESERVATION');
      }
    }

    const updatedReservation = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // メニュー存在確認
      if (menuId) {
        const menu = await tx.bookingMenu.findFirst({
          where: { id: menuId, tenantId: TENANT_ID, isActive: true },
        });
        if (!menu) {throw new Error('MENU_NOT_FOUND');}
      }

      // スタッフ存在確認
      if (staffId) {
        const staff = await tx.bookingStaff.findFirst({
          where: { id: staffId, tenantId: TENANT_ID, isActive: true },
        });
        if (!staff) {throw new Error('STAFF_NOT_FOUND');}
      }

      // 予約日時の重複チェック
      if (staffId || reservedDate || reservedTime) {
        const checkStaffId = staffId || existingReservation.staffId;
        const checkDate = reservedDate ? new Date(reservedDate) : existingReservation.reservedDate;
        const checkTime = reservedTime || existingReservation.reservedTime;

        const conflictingReservation = await tx.bookingReservation.findFirst({
          where: {
            id: { not: id },
            tenantId: TENANT_ID,
            staffId: checkStaffId,
            reservedDate: checkDate,
            reservedTime: checkTime,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        });
        if (conflictingReservation) {throw new Error('TIME_SLOT_CONFLICT');}
      }

      const updateData = buildReservationUpdateData({ menuId, staffId, reservedDate, reservedTime, notes, status });

      return await tx.bookingReservation.update({
        where: { id },
        data: updateData,
        include: reservationIncludeForAdmin,
      });
    }).catch((error: unknown) => {
      const mapped = mapTransactionError(error);
      if (mapped.code !== 'UNKNOWN_ERROR') {
        throw mapped;
      }
      throw error;
    });

    const successMessage = getStatusChangeMessage(status);
    return successResponse(formatReservationForAdmin(updatedReservation, successMessage));
  } catch (error) {
    console.error('Error updating reservation:', error);
    return errorResponse(
      'Failed to update reservation',
      500,
      'UPDATE_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * 予約のキャンセルまたは削除を実行
 */
async function executeReservationDelete(
  tx: Prisma.TransactionClient,
  id: string
): Promise<{ deleted: boolean; message: string }> {
  const currentReservation = await tx.bookingReservation.findFirst({
    where: { id, tenantId: TENANT_ID },
  });

  if (!currentReservation) {
    throw new Error('RESERVATION_NOT_FOUND');
  }

  // PENDING または CONFIRMED の予約はキャンセルに変更
  if (currentReservation.status === 'PENDING' || currentReservation.status === 'CONFIRMED') {
    await tx.bookingReservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return { deleted: false, message: '予約をキャンセルしました' };
  }

  // CANCELLED や NO_SHOW の予約は実際に削除
  await tx.bookingReservation.delete({ where: { id } });
  return { deleted: true, message: 'Reservation deleted successfully' };
}

/**
 * DELETE /api/admin/reservations/:id
 * 管理者が予約を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;

    const existingReservation = await prisma.bookingReservation.findFirst({
      where: { id, tenantId: TENANT_ID },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    const deleteValidation = canDeleteReservation(existingReservation.status);
    if (!deleteValidation.canDelete) {
      return errorResponse(deleteValidation.error || '予約を削除できません', 400, 'CANNOT_DELETE_RESERVATION');
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      return executeReservationDelete(tx, id);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : '';
      if (message === 'RESERVATION_NOT_FOUND') {
        throw { statusCode: 404, message: 'Reservation not found', code: 'RESERVATION_NOT_FOUND' };
      }
      throw error;
    });

    return successResponse({ message: result.message });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return errorResponse(
      'Failed to delete reservation',
      500,
      'DELETE_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
