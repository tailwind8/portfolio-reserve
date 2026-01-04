import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandling } from '@/lib/api-response';
import { createReservationSchema } from '@/lib/validations';
import { sendReservationConfirmationEmail } from '@/lib/email';
import { getFeatureFlags } from '@/lib/api-feature-flag';
import { requireAuthAndGetBookingUser } from '@/lib/auth';
import { minutesSinceStartOfDay, hasTimeOverlap } from '@/lib/time-utils';
import type { Reservation } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * Get all reservations for the current user
 * GET /api/reservations
 *
 * @returns List of user's reservations
 *
 * @example
 * GET /api/reservations
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "userId": "uuid",
 *       "staffId": "uuid",
 *       "menuId": "uuid",
 *       "reservedDate": "2025-01-20",
 *       "reservedTime": "14:00",
 *       "status": "CONFIRMED",
 *       "notes": "窓際の席を希望",
 *       "user": { "id": "uuid", "name": "山田太郎", "email": "user@example.com" },
 *       "staff": { "id": "uuid", "name": "田中花子" },
 *       "menu": { "id": "uuid", "name": "カット", "price": 5000, "duration": 60 },
 *       "createdAt": "2025-01-15T10:00:00.000Z",
 *       "updatedAt": "2025-01-15T10:00:00.000Z"
 *     }
 *   ],
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Supabaseセッションから認証済みユーザーを取得
    const bookingUser = await requireAuthAndGetBookingUser();

    const reservations = await prisma.bookingReservation.findMany({
      where: {
        tenantId: TENANT_ID,
        userId: bookingUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
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
      },
      orderBy: [
        { reservedDate: 'desc' },
        { reservedTime: 'desc' },
      ],
    });

    const formattedReservations: Reservation[] = reservations.map((reservation) => ({
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
    }));

    return successResponse<Reservation[]>(formattedReservations);
  });
}

/**
 * Create a new reservation
 * POST /api/reservations
 *
 * @param body - Reservation details
 *
 * @returns Created reservation
 *
 * @example
 * POST /api/reservations
 * Body:
 * {
 *   "menuId": "uuid",
 *   "staffId": "uuid",
 *   "reservedDate": "2025-01-20",
 *   "reservedTime": "14:00",
 *   "notes": "窓際の席を希望"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "staffId": "uuid",
 *     "menuId": "uuid",
 *     "reservedDate": "2025-01-20",
 *     "reservedTime": "14:00",
 *     "status": "PENDING",
 *     "notes": "窓際の席を希望",
 *     "user": { "id": "uuid", "name": "山田太郎", "email": "user@example.com" },
 *     "staff": { "id": "uuid", "name": "田中花子" },
 *     "menu": { "id": "uuid", "name": "カット", "price": 5000, "duration": 60 },
 *     "createdAt": "2025-01-15T10:00:00.000Z",
 *     "updatedAt": "2025-01-15T10:00:00.000Z"
 *   },
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // Supabaseセッションから認証済みユーザーを取得
    const bookingUser = await requireAuthAndGetBookingUser();

    const body = await request.json();
    const validation = createReservationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { menuId, reservedDate, reservedTime, notes } = validation.data;
    let { staffId } = validation.data;

    // Check if menu exists and is active
    const menu = await prisma.bookingMenu.findUnique({
      where: { id: menuId },
    });

    if (!menu || !menu.isActive) {
      return errorResponse('Menu not found or inactive', 404, 'MENU_NOT_FOUND');
    }

    // 機能フラグを取得
    const featureFlags = await getFeatureFlags();

    // Issue #77: スタッフ指名機能がOFFの場合、スタッフを自動割り当て
    if (featureFlags && !featureFlags.enableStaffSelection && !staffId) {
      // 利用可能なスタッフを検索
      const availableStaff = await prisma.bookingStaff.findMany({
        where: {
          tenantId: TENANT_ID,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (availableStaff.length === 0) {
        return errorResponse('No staff available', 404, 'NO_STAFF_AVAILABLE');
      }

      // 各スタッフの予約状況を確認し、空いているスタッフを見つける
      const reservedStartMinutes = minutesSinceStartOfDay(reservedTime);
      const reservedEndMinutes = reservedStartMinutes + menu.duration;

      for (const staff of availableStaff) {
        // スタッフの既存予約を確認
        const staffReservations = await prisma.bookingReservation.findMany({
          where: {
            tenantId: TENANT_ID,
            staffId: staff.id,
            reservedDate: new Date(reservedDate),
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          include: {
            menu: { select: { duration: true } },
          },
        });

        // 時間重複チェック
        let isAvailable = true;
        for (const res of staffReservations) {
          const resStartMinutes = minutesSinceStartOfDay(res.reservedTime);
          const resEndMinutes = resStartMinutes + res.menu.duration;

          // 時間が重複している場合
          if (hasTimeOverlap(reservedStartMinutes, reservedEndMinutes, resStartMinutes, resEndMinutes)) {
            isAvailable = false;
            break;
          }
        }

        // 空いているスタッフが見つかった
        if (isAvailable) {
          staffId = staff.id;
          break;
        }
      }

      // 空いているスタッフが見つからなかった場合
      if (!staffId) {
        return errorResponse('No available staff for the selected time', 409, 'NO_STAFF_AVAILABLE_FOR_TIME');
      }
    }

    // Check if staff exists and is active (only if staffId is provided)
    if (staffId) {
      const staff = await prisma.bookingStaff.findUnique({
        where: { id: staffId },
      });

      if (!staff || !staff.isActive) {
        return errorResponse('Staff not found or inactive', 404, 'STAFF_NOT_FOUND');
      }
    }

    // トランザクション内で予約を作成（Race Condition対策）
    const reservation = await prisma.$transaction(async (tx) => {
      // 1. ユーザー自身の重複予約チェック（同じ時間帯に既に予約がないか）
      const userReservations = await tx.bookingReservation.findMany({
        where: {
          tenantId: TENANT_ID,
          userId: bookingUser.id,
          reservedDate: new Date(reservedDate),
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        include: {
          menu: { select: { duration: true } },
        },
      });

      const newStartMinutes = minutesSinceStartOfDay(reservedTime);
      const newEndMinutes = newStartMinutes + menu.duration;

      // ユーザー自身の予約時間重複チェック
      for (const userRes of userReservations) {
        const resStartMinutes = minutesSinceStartOfDay(userRes.reservedTime);
        const resEndMinutes = resStartMinutes + userRes.menu.duration;

        // Check for overlap
        if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
          throw new Error('既にこの時間帯に予約があります');
        }
      }

      // 2. スタッフの重複予約チェック（スタッフ指定がある場合のみ）
      if (staffId) {
        const staffReservations = await tx.bookingReservation.findMany({
          where: {
            tenantId: TENANT_ID,
            staffId,
            reservedDate: new Date(reservedDate),
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          include: {
            menu: { select: { duration: true } },
          },
        });

        // スタッフの予約時間重複チェック
        for (const staffRes of staffReservations) {
          const resStartMinutes = minutesSinceStartOfDay(staffRes.reservedTime);
          const resEndMinutes = resStartMinutes + staffRes.menu.duration;

          // Check for overlap
          if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
            throw new Error('選択されたスタッフは指定時間帯に対応できません');
          }
        }
      }

      // 3. 全体の重複予約チェック（スタッフ指定なしの場合）
      if (!staffId) {
        const allReservations = await tx.bookingReservation.findMany({
          where: {
            tenantId: TENANT_ID,
            staffId: null,
            reservedDate: new Date(reservedDate),
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          include: {
            menu: { select: { duration: true } },
          },
        });

        // 重複チェック
        for (const res of allReservations) {
          const resStartMinutes = minutesSinceStartOfDay(res.reservedTime);
          const resEndMinutes = resStartMinutes + res.menu.duration;

          if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
            throw new Error('この時間は既に予約済みです');
          }
        }
      }

      // 4. 予約作成
      const reservationData: {
        tenantId: string;
        userId: string;
        menuId: string;
        staffId?: string | null;
        reservedDate: Date;
        reservedTime: string;
        notes?: string | null;
        status: 'PENDING';
      } = {
        tenantId: TENANT_ID,
        userId: bookingUser.id,
        menuId,
        reservedDate: new Date(reservedDate),
        reservedTime,
        notes,
        status: 'PENDING',
      };

      // staffIdが指定されている場合のみ追加
      if (staffId) {
        reservationData.staffId = staffId;
      }

      return await tx.bookingReservation.create({
        data: reservationData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
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
        },
      });
    }).catch((error) => {
      // トランザクションエラーを適切なHTTPエラーに変換
      if (error.message === '既にこの時間帯に予約があります') {
        throw { statusCode: 409, message: error.message, code: 'USER_TIME_SLOT_CONFLICT' };
      } else if (error.message === '選択されたスタッフは指定時間帯に対応できません') {
        throw { statusCode: 409, message: error.message, code: 'STAFF_TIME_SLOT_CONFLICT' };
      } else if (error.message === 'この時間は既に予約済みです') {
        throw { statusCode: 409, message: error.message, code: 'TIME_SLOT_CONFLICT' };
      }
      throw error;
    });

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

    // Send confirmation email (non-blocking)
    // Email sending failure should not fail the reservation
    try {
      await sendReservationConfirmationEmail({
        to: reservation.user.email,
        userName: reservation.user.name || 'お客様',
        menuName: reservation.menu.name,
        staffName: reservation.staff?.name || '指名なし',
        reservedDate: formattedReservation.reservedDate,
        reservedTime: reservation.reservedTime,
        price: reservation.menu.price,
        duration: reservation.menu.duration,
        notes: reservation.notes || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue anyway - reservation is created successfully
    }

    return successResponse<Reservation>(formattedReservation, 201);
  });
}
