import prisma from '@/lib/prisma';
import { adminCreateReservationSchema, adminReservationsQuerySchema } from '@/lib/validations';
import { successResponse, errorResponse } from '@/lib/api-response';

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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータのバリデーション
    const queryValidation = adminReservationsQuerySchema.safeParse({
      status: searchParams.get('status'),
      dateRange: searchParams.get('dateRange'),
      search: searchParams.get('search'),
      tenantId: searchParams.get('tenantId'),
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
    const finalTenantId = tenantId || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

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

    // 予約一覧を取得
    const reservations = await prisma.restaurantReservation.findMany({
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

    // 検索フィルター（フロントエンド側でフィルタリング用のデータも含める）
    let filteredReservations = reservations;
    if (search) {
      filteredReservations = reservations.filter((reservation) =>
        reservation.user?.name?.includes(search)
      );
    }

    // レスポンス整形
    const formattedReservations = filteredReservations.map((reservation) => ({
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
export async function POST(request: Request) {
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
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // ユーザーの存在確認
    const user = await prisma.restaurantUser.findFirst({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      return errorResponse('User not found', 404, 'USER_NOT_FOUND');
    }

    // メニューの存在確認
    const menu = await prisma.restaurantMenu.findFirst({
      where: {
        id: menuId,
        tenantId,
        isActive: true,
      },
    });

    if (!menu) {
      return errorResponse('Menu not found or inactive', 404, 'MENU_NOT_FOUND');
    }

    // スタッフの存在確認
    const staff = await prisma.restaurantStaff.findFirst({
      where: {
        id: staffId,
        tenantId,
        isActive: true,
      },
    });

    if (!staff) {
      return errorResponse('Staff not found or inactive', 404, 'STAFF_NOT_FOUND');
    }

    // 予約日時の重複チェック（同じスタッフ、同じ時間）
    const existingReservation = await prisma.restaurantReservation.findFirst({
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
      return errorResponse(
        'This time slot is already booked for the selected staff',
        409,
        'TIME_SLOT_CONFLICT'
      );
    }

    // 予約を作成
    const reservation = await prisma.restaurantReservation.create({
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
}
