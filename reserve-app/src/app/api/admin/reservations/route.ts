import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { adminCreateReservationSchema, adminReservationsQuerySchema } from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkAdminAuthHeader } from '@/lib/auth';
import { requireFeatureFlag } from '@/lib/api-feature-flag';

/**
 * GET /api/admin/reservations
 * 管理者用の予約一覧を取得
 *
 * クエリパラメータ:
 * - status: 予約ステータスフィルター ('all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW')
 * - dateRange: 日付範囲フィルター ('all' | 'this-week' | 'this-month')
 * - search: 顧客名で検索
 * - tenantId: テナントID (デフォルト: 環境変数)
 */
export async function GET(request: NextRequest) {
  // 管理者権限チェック
  const authResult = checkAdminAuthHeader(request);
  if (typeof authResult !== 'string') {
    return authResult; // 401または403エラー
  }

  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータのバリデーション
    const queryValidation = adminReservationsQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      dateRange: searchParams.get('dateRange') || undefined,
      search: searchParams.get('search') || undefined,
      tenantId: searchParams.get('tenantId') || undefined,
    });

    if (!queryValidation.success) {
      return errorResponse(
        'Invalid query parameters',
        400,
        'VALIDATION_ERROR',
        queryValidation.error.issues
      );
    }

    const { status, dateRange, search, tenantId } = queryValidation.data;
    const finalTenantId = tenantId || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // フィルター条件を構築
    const where: Record<string, unknown> = {
      tenantId: finalTenantId,
    };

    // ステータスフィルター
    if (status && status !== 'all') {
      where.status = status;
    }

    // 日付範囲フィルター
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'this-week') {
        // 今週（月曜日〜日曜日）
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 月曜日を週の始まりとする
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        where.reservedDate = {
          gte: weekStart,
          lte: weekEnd,
        };
      } else if (dateRange === 'this-month') {
        // 今月
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        where.reservedDate = {
          gte: monthStart,
          lte: monthEnd,
        };
      }
    }

    // 顧客名検索フィルター（DBレベルで実行）
    if (search) {
      where.user = {
        name: {
          contains: search, // PostgreSQL LIKEクエリ
        },
      };
    }

    // 予約一覧を取得
    const reservations = await prisma.bookingReservation.findMany({
      where,
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
      orderBy: [
        { reservedDate: 'desc' },
        { reservedTime: 'asc' },
      ],
    });

    // レスポンス整形
    const formattedReservations = reservations.map((reservation) => ({
      id: reservation.id,
      reservedDate: reservation.reservedDate.toISOString().split('T')[0], // YYYY-MM-DD
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
    }));

    return successResponse(formattedReservations);
  } catch (error) {
    console.error('Error fetching admin reservations:', error);
    return errorResponse(
      'Failed to fetch reservations',
      500,
      'FETCH_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * POST /api/admin/reservations
 * 管理者が新規予約を作成
 *
 * リクエストボディ:
 * - userId: ユーザーID (UUID)
 * - menuId: メニューID (UUID)
 * - staffId: スタッフID (UUID)
 * - reservedDate: 予約日 (YYYY-MM-DD)
 * - reservedTime: 予約時間 (HH:mm)
 * - notes: 備考 (オプション)
 */
export async function POST(request: NextRequest) {
  return requireFeatureFlag('enableManualReservation', async () => {
    // 管理者権限チェック
    const authResult = checkAdminAuthHeader(request);
    if (typeof authResult !== 'string') {
      return authResult; // 401または403エラー
    }

    try {
    const body = await request.json();

    // バリデーション
    const validation = adminCreateReservationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { userId, menuId, staffId, reservedDate, reservedTime, notes } = validation.data;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // トランザクション内で予約を作成（Race Condition対策）
    const reservation = await prisma.$transaction(async (tx) => {
      // 1. ユーザーの存在確認
      const user = await tx.bookingUser.findFirst({
        where: {
          id: userId,
          tenantId,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // 2. メニューの存在確認
      const menu = await tx.bookingMenu.findFirst({
        where: {
          id: menuId,
          tenantId,
          isActive: true,
        },
      });

      if (!menu) {
        throw new Error('MENU_NOT_FOUND');
      }

      // 3. スタッフの存在確認
      const staff = await tx.bookingStaff.findFirst({
        where: {
          id: staffId,
          tenantId,
          isActive: true,
        },
      });

      if (!staff) {
        throw new Error('STAFF_NOT_FOUND');
      }

      // 4. 予約日時の重複チェック（同じスタッフ、同じ時間）
      const existingReservation = await tx.bookingReservation.findFirst({
        where: {
          tenantId,
          staffId,
          reservedDate: new Date(reservedDate),
          reservedTime,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (existingReservation) {
        throw new Error('TIME_SLOT_CONFLICT');
      }

      // 5. 予約を作成
      return await tx.bookingReservation.create({
        data: {
          tenantId,
          userId,
          menuId,
          staffId,
          reservedDate: new Date(reservedDate),
          reservedTime,
          status: 'CONFIRMED', // 管理者が作成する場合は自動的に確定
          notes,
        },
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
    }).catch((error) => {
      // トランザクションエラーを適切なHTTPエラーに変換
      if (error.message === 'USER_NOT_FOUND') {
        throw { statusCode: 404, message: 'User not found', code: 'USER_NOT_FOUND' };
      } else if (error.message === 'MENU_NOT_FOUND') {
        throw { statusCode: 404, message: 'Menu not found or inactive', code: 'MENU_NOT_FOUND' };
      } else if (error.message === 'STAFF_NOT_FOUND') {
        throw { statusCode: 404, message: 'Staff not found or inactive', code: 'STAFF_NOT_FOUND' };
      } else if (error.message === 'TIME_SLOT_CONFLICT') {
        throw { statusCode: 409, message: 'This time slot is already booked for the selected staff', code: 'TIME_SLOT_CONFLICT' };
      }
      throw error;
    });

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
      staffName: reservation.staff?.name || 'スタッフ未設定',
      status: reservation.status,
      notes: reservation.notes || '',
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

      return successResponse(formattedReservation, 201);
    } catch (error) {
      console.error('Error creating reservation:', error);
      return errorResponse(
        'Failed to create reservation',
        500,
        'CREATE_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });
}
