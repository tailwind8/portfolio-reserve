import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  adminUpdateReservationSchema,
  validateStatusTransition,
  canEditReservation,
  canDeleteReservation,
} from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkAdminAuthHeader } from '@/lib/auth';

/**
 * GET /api/admin/reservations/:id
 * 管理者用の予約詳細を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者権限チェック
  const authResult = checkAdminAuthHeader(request);
  if (typeof authResult !== 'string') {
    return authResult; // 401または403エラー
  }

  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    const reservation = await prisma.bookingReservation.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        menu: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!reservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // レスポンス整形
    const formattedReservation = {
      id: reservation.id,
      reservedDate: reservation.reservedDate.toISOString().split('T')[0],
      reservedTime: reservation.reservedTime,
      customerName: reservation.user?.name || '名前未設定',
      customerEmail: reservation.user?.email || '',
      customerPhone: reservation.user?.phone || '',
      menuName: reservation.menu?.name || 'メニュー未設定',
      menuPrice: reservation.menu?.price || 0,
      menuDuration: reservation.menu?.duration || 0,
      staffName: reservation.staff?.name || 'スタッフ未設定',
      staffRole: reservation.staff?.role || '',
      status: reservation.status,
      notes: reservation.notes || '',
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

    return successResponse(formattedReservation);
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
 * PATCH /api/admin/reservations/:id
 * 管理者が既存予約を更新
 *
 * リクエストボディ:
 * - menuId: メニューID (UUID) (オプション)
 * - staffId: スタッフID (UUID) (オプション)
 * - reservedDate: 予約日 (YYYY-MM-DD) (オプション)
 * - reservedTime: 予約時間 (HH:mm) (オプション)
 * - status: 予約ステータス (オプション)
 * - notes: 備考 (オプション)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者権限チェック
  const authResult = checkAdminAuthHeader(request);
  if (typeof authResult !== 'string') {
    return authResult; // 401または403エラー
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validation = adminUpdateReservationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { menuId, staffId, reservedDate, reservedTime, status, notes } = validation.data;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // 既存予約の確認
    const existingReservation = await prisma.bookingReservation.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // ステータス遷移のバリデーション（statusが指定されている場合）
    if (status !== undefined && status !== existingReservation.status) {
      const transitionValidation = validateStatusTransition(
        existingReservation.status,
        status
      );

      if (!transitionValidation.valid) {
        return errorResponse(
          transitionValidation.error || '不正な状態遷移です',
          400,
          'INVALID_STATUS_TRANSITION'
        );
      }
    }

    // ステータスに応じた編集制限（statusの変更以外の編集を試みている場合）
    if (
      (menuId !== undefined ||
        staffId !== undefined ||
        reservedDate !== undefined ||
        reservedTime !== undefined ||
        notes !== undefined) &&
      status === undefined // statusの変更ではない場合
    ) {
      const editValidation = canEditReservation(existingReservation.status);

      if (!editValidation.canEdit) {
        return errorResponse(
          editValidation.error || '予約の編集ができません',
          400,
          'CANNOT_EDIT_RESERVATION'
        );
      }
    }

    // メニューが指定されている場合、存在確認
    if (menuId) {
      const menu = await prisma.bookingMenu.findFirst({
        where: {
          id: menuId,
          tenantId,
          isActive: true,
        },
      });

      if (!menu) {
        return errorResponse('Menu not found or inactive', 404, 'MENU_NOT_FOUND');
      }
    }

    // スタッフが指定されている場合、存在確認
    if (staffId) {
      const staff = await prisma.bookingStaff.findFirst({
        where: {
          id: staffId,
          tenantId,
          isActive: true,
        },
      });

      if (!staff) {
        return errorResponse('Staff not found or inactive', 404, 'STAFF_NOT_FOUND');
      }
    }

    // 予約日時の重複チェック（スタッフまたは日時が変更される場合）
    if (staffId || reservedDate || reservedTime) {
      const checkStaffId = staffId || existingReservation.staffId;
      const checkDate = reservedDate ? new Date(reservedDate) : existingReservation.reservedDate;
      const checkTime = reservedTime || existingReservation.reservedTime;

      const conflictingReservation = await prisma.bookingReservation.findFirst({
        where: {
          id: { not: id }, // 自分自身を除く
          tenantId,
          staffId: checkStaffId,
          reservedDate: checkDate,
          reservedTime: checkTime,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (conflictingReservation) {
        return errorResponse(
          'This time slot is already booked for the selected staff',
          409,
          'TIME_SLOT_CONFLICT'
        );
      }
    }

    // 更新データの準備
    const updateData: Record<string, unknown> = {};
    if (menuId !== undefined) updateData.menuId = menuId;
    if (staffId !== undefined) updateData.staffId = staffId;
    if (reservedDate !== undefined) updateData.reservedDate = new Date(reservedDate);
    if (reservedTime !== undefined) updateData.reservedTime = reservedTime;
    if (notes !== undefined) updateData.notes = notes;

    // ステータス変更の場合、成功メッセージを準備
    let successMessage = '予約を更新しました';
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CONFIRMED') {
        successMessage = '予約を確定しました';
      } else if (status === 'COMPLETED') {
        successMessage = '予約を完了しました';
      } else if (status === 'CANCELLED') {
        successMessage = '予約をキャンセルしました';
      } else if (status === 'NO_SHOW') {
        successMessage = '無断キャンセルとして記録しました';
      }
    }

    // 予約を更新
    const updatedReservation = await prisma.bookingReservation.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        menu: {
          select: {
            name: true,
            price: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // レスポンス整形
    const formattedReservation = {
      id: updatedReservation.id,
      reservedDate: updatedReservation.reservedDate.toISOString().split('T')[0],
      reservedTime: updatedReservation.reservedTime,
      customerName: updatedReservation.user?.name || '名前未設定',
      customerEmail: updatedReservation.user?.email || '',
      customerPhone: updatedReservation.user?.phone || '',
      menuName: updatedReservation.menu?.name || 'メニュー未設定',
      menuPrice: updatedReservation.menu?.price || 0,
      staffName: updatedReservation.staff?.name || 'スタッフ未設定',
      status: updatedReservation.status,
      notes: updatedReservation.notes || '',
      createdAt: updatedReservation.createdAt.toISOString(),
      updatedAt: updatedReservation.updatedAt.toISOString(),
      message: successMessage,
    };

    return successResponse(formattedReservation);
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
 * DELETE /api/admin/reservations/:id
 * 管理者が予約を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 管理者権限チェック
  const authResult = checkAdminAuthHeader(request);
  if (typeof authResult !== 'string') {
    return authResult; // 401または403エラー
  }

  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // 既存予約の確認
    const existingReservation = await prisma.bookingReservation.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // 削除可否チェック
    const deleteValidation = canDeleteReservation(existingReservation.status);

    if (!deleteValidation.canDelete) {
      return errorResponse(
        deleteValidation.error || '予約を削除できません',
        400,
        'CANNOT_DELETE_RESERVATION'
      );
    }

    // PENDING または CONFIRMED の予約は削除ではなくCANCELLEDに変更
    if (
      existingReservation.status === 'PENDING' ||
      existingReservation.status === 'CONFIRMED'
    ) {
      await prisma.bookingReservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      return successResponse({ message: '予約をキャンセルしました' });
    }

    // CANCELLED や NO_SHOW の予約は実際に削除
    await prisma.bookingReservation.delete({
      where: {
        id,
      },
    });

    return successResponse({ message: 'Reservation deleted successfully' });
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
