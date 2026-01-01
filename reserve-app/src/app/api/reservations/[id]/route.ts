import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandling } from '@/lib/api-response';
import { updateReservationSchema, cancelReservationSchema } from '@/lib/validations';
import { sendReservationUpdateEmail, sendReservationCancellationEmail } from '@/lib/email';
import type { Reservation } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

/**
 * Get reservation by ID
 * GET /api/reservations/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const reservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        userId, // 自分の予約のみ取得可能
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true } },
        menu: { select: { id: true, name: true, price: true, duration: true } },
      },
    });

    if (!reservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    const formattedReservation: Reservation = {
      id: reservation.id,
      userId: reservation.userId,
      staffId: reservation.staffId,
      menuId: reservation.menuId,
      reservedDate: reservation.reservedDate.toISOString().split('T')[0],
      reservedTime: reservation.reservedTime,
      status: reservation.status,
      notes: reservation.notes,
      user: reservation.user,
      staff: reservation.staff,
      menu: reservation.menu,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

    return successResponse<Reservation>(formattedReservation);
  });
}

/**
 * Update reservation
 * PATCH /api/reservations/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const validation = updateReservationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    // 既存予約取得
    const existingReservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        userId,
      },
      include: {
        menu: { select: { id: true, name: true, duration: true, price: true } },
        staff: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // ビジネスルール検証
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(existingReservation.status)) {
      return errorResponse(
        'Cannot update cancelled or completed reservation',
        400,
        'INVALID_STATUS'
      );
    }

    // 過去の予約は変更不可
    const reservedDateTime = new Date(existingReservation.reservedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservedDateTime < today) {
      return errorResponse('Cannot update past reservation', 400, 'PAST_RESERVATION');
    }

    const { menuId, staffId, reservedDate, reservedTime, notes } = validation.data;

    // 変更後のmenuとstaffの存在確認
    let newMenu = existingReservation.menu;

    if (menuId && menuId !== existingReservation.menuId) {
      const menu = await prisma.restaurantMenu.findUnique({
        where: { id: menuId },
        select: { id: true, name: true, duration: true, price: true, isActive: true },
      });

      if (!menu || !menu.isActive) {
        return errorResponse('Menu not found or inactive', 404, 'MENU_NOT_FOUND');
      }
      newMenu = menu;
    }

    if (staffId && staffId !== existingReservation.staffId) {
      const staff = await prisma.restaurantStaff.findUnique({
        where: { id: staffId },
        select: { id: true, name: true, isActive: true },
      });

      if (!staff || !staff.isActive) {
        return errorResponse('Staff not found or inactive', 404, 'STAFF_NOT_FOUND');
      }
    }

    // 時間スロット競合チェック（日時またはスタッフが変更される場合）
    const finalStaffId = staffId || existingReservation.staffId;
    const finalDate = reservedDate || existingReservation.reservedDate.toISOString().split('T')[0];
    const finalTime = reservedTime || existingReservation.reservedTime;

    if (
      reservedDate !== undefined ||
      reservedTime !== undefined ||
      staffId !== undefined
    ) {
      const overlappingReservations = await prisma.restaurantReservation.findMany({
        where: {
          tenantId: TENANT_ID,
          staffId: finalStaffId,
          reservedDate: new Date(finalDate),
          status: { in: ['PENDING', 'CONFIRMED'] },
          id: { not: id }, // 自分自身を除外
        },
        include: {
          menu: { select: { duration: true } },
        },
      });

      const [newHour, newMinute] = finalTime.split(':').map(Number);
      const newStartMinutes = newHour * 60 + newMinute;
      const newEndMinutes = newStartMinutes + newMenu.duration;

      for (const reservation of overlappingReservations) {
        const [resHour, resMinute] = reservation.reservedTime.split(':').map(Number);
        const resStartMinutes = resHour * 60 + resMinute;
        const resEndMinutes = resStartMinutes + reservation.menu.duration;

        if (
          (newStartMinutes >= resStartMinutes && newStartMinutes < resEndMinutes) ||
          (newEndMinutes > resStartMinutes && newEndMinutes <= resEndMinutes) ||
          (newStartMinutes <= resStartMinutes && newEndMinutes >= resEndMinutes)
        ) {
          return errorResponse(
            'Time slot is already reserved',
            409,
            'TIME_SLOT_CONFLICT'
          );
        }
      }
    }

    // 予約更新（変更前の情報を保存しておく）
    const oldReservation = {
      date: existingReservation.reservedDate.toISOString().split('T')[0],
      time: existingReservation.reservedTime,
      menuName: existingReservation.menu.name,
      staffName: existingReservation.staff?.name || '指名なし',
    };

    const updatedReservation = await prisma.restaurantReservation.update({
      where: { id },
      data: {
        ...(menuId && { menuId }),
        ...(staffId && { staffId }),
        ...(reservedDate && { reservedDate: new Date(reservedDate) }),
        ...(reservedTime && { reservedTime }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true } },
        menu: { select: { id: true, name: true, price: true, duration: true } },
      },
    });

    const formattedReservation: Reservation = {
      id: updatedReservation.id,
      userId: updatedReservation.userId,
      staffId: updatedReservation.staffId,
      menuId: updatedReservation.menuId,
      reservedDate: updatedReservation.reservedDate.toISOString().split('T')[0],
      reservedTime: updatedReservation.reservedTime,
      status: updatedReservation.status,
      notes: updatedReservation.notes,
      user: updatedReservation.user,
      staff: updatedReservation.staff,
      menu: updatedReservation.menu,
      createdAt: updatedReservation.createdAt.toISOString(),
      updatedAt: updatedReservation.updatedAt.toISOString(),
    };

    // 変更確認メール送信（非同期）
    sendReservationUpdateEmail({
      to: updatedReservation.user.email,
      userName: updatedReservation.user.name || 'お客様',
      oldDate: oldReservation.date,
      oldTime: oldReservation.time,
      oldMenuName: oldReservation.menuName,
      oldStaffName: oldReservation.staffName,
      newDate: formattedReservation.reservedDate,
      newTime: formattedReservation.reservedTime,
      newMenuName: formattedReservation.menu.name,
      newStaffName: formattedReservation.staff?.name || '指名なし',
    }).catch((error) => {
      console.error('Failed to send update email:', error);
    });

    return successResponse<Reservation>(formattedReservation);
  });
}

/**
 * Cancel reservation (soft delete)
 * DELETE /api/reservations/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // 既存予約取得
    const existingReservation = await prisma.restaurantReservation.findFirst({
      where: {
        id,
        tenantId: TENANT_ID,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true } },
        menu: { select: { id: true, name: true, price: true, duration: true } },
      },
    });

    if (!existingReservation) {
      return errorResponse('Reservation not found', 404, 'NOT_FOUND');
    }

    // ビジネスルール検証
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(existingReservation.status)) {
      return errorResponse(
        'Reservation is already cancelled or completed',
        400,
        'INVALID_STATUS'
      );
    }

    // 過去の予約はキャンセル不可
    const reservedDateTime = new Date(existingReservation.reservedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservedDateTime < today) {
      return errorResponse('Cannot cancel past reservation', 400, 'PAST_RESERVATION');
    }

    // キャンセル期限チェック
    const settings = await prisma.restaurantSettings.findUnique({
      where: { tenantId: TENANT_ID },
      select: { cancellationDeadlineHours: true },
    });

    const cancellationDeadlineHours = settings?.cancellationDeadlineHours || 24;

    // 予約日時から期限時間を引いた時刻を計算
    const [hours, minutes] = existingReservation.reservedTime.split(':').map(Number);
    const reservationDateTime = new Date(existingReservation.reservedDate);
    reservationDateTime.setHours(hours, minutes, 0, 0);

    const deadlineDateTime = new Date(reservationDateTime);
    deadlineDateTime.setHours(deadlineDateTime.getHours() - cancellationDeadlineHours);

    const now = new Date();

    if (now > deadlineDateTime) {
      return errorResponse(
        `キャンセル期限を過ぎています。予約日時の${cancellationDeadlineHours}時間前までキャンセル可能です。`,
        400,
        'CANCELLATION_DEADLINE_PASSED'
      );
    }

    // キャンセル理由を取得（オプション）
    let cancellationReason: string | undefined;
    try {
      const body = await request.json();
      const validation = cancelReservationSchema.safeParse(body);
      if (validation.success) {
        cancellationReason = validation.data.cancellationReason;
      }
    } catch {
      // bodyがない場合は無視
    }

    // ステータスをCANCELLEDに更新（ソフトデリート）
    const cancelledReservation = await prisma.restaurantReservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        ...(cancellationReason && {
          notes: existingReservation.notes
            ? `${existingReservation.notes}\n\n[キャンセル理由] ${cancellationReason}`
            : `[キャンセル理由] ${cancellationReason}`,
        }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true } },
        menu: { select: { id: true, name: true, price: true, duration: true } },
      },
    });

    const formattedReservation: Reservation = {
      id: cancelledReservation.id,
      userId: cancelledReservation.userId,
      staffId: cancelledReservation.staffId,
      menuId: cancelledReservation.menuId,
      reservedDate: cancelledReservation.reservedDate.toISOString().split('T')[0],
      reservedTime: cancelledReservation.reservedTime,
      status: cancelledReservation.status,
      notes: cancelledReservation.notes,
      user: cancelledReservation.user,
      staff: cancelledReservation.staff,
      menu: cancelledReservation.menu,
      createdAt: cancelledReservation.createdAt.toISOString(),
      updatedAt: cancelledReservation.updatedAt.toISOString(),
    };

    // キャンセル確認メール送信（非同期）
    sendReservationCancellationEmail({
      to: cancelledReservation.user.email,
      userName: cancelledReservation.user.name || 'お客様',
      date: formattedReservation.reservedDate,
      time: formattedReservation.reservedTime,
      menuName: formattedReservation.menu.name,
      staffName: formattedReservation.staff?.name || '指名なし',
      cancellationReason,
    }).catch((error) => {
      console.error('Failed to send cancellation email:', error);
    });

    return successResponse<Reservation>(formattedReservation);
  });
}
