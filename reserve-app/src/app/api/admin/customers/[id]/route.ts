import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * 顧客情報更新用のバリデーションスキーマ
 */
const updateCustomerSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください').optional(),
  phone: z.string().max(20, '電話番号は20文字以内で入力してください').optional(),
});

/**
 * GET /api/admin/customers/[id]
 * 顧客詳細を取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // 顧客情報を取得
    const customer = await prisma.restaurantUser.findUnique({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        memo: true,
        createdAt: true,
        updatedAt: true,
        reservations: {
          select: {
            id: true,
            reservedDate: true,
            reservedTime: true,
            status: true,
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
            createdAt: true,
          },
          orderBy: {
            reservedDate: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return errorResponse('顧客が見つかりません', 404, 'CUSTOMER_NOT_FOUND');
    }

    // 来店履歴（status='COMPLETED'の予約）
    const visitHistory = customer.reservations
      .filter((r) => r.status === 'COMPLETED')
      .map((reservation) => ({
        id: reservation.id,
        date: reservation.reservedDate.toISOString().split('T')[0],
        time: reservation.reservedTime,
        menuName: reservation.menu.name,
        menuPrice: reservation.menu.price,
        menuDuration: reservation.menu.duration,
        staffName: reservation.staff?.name || '未指定',
        staffRole: reservation.staff?.role || null,
      }));

    // 予約履歴（全ステータス）
    const reservationHistory = customer.reservations.map((reservation) => ({
      id: reservation.id,
      date: reservation.reservedDate.toISOString().split('T')[0],
      time: reservation.reservedTime,
      status: reservation.status,
      menuName: reservation.menu.name,
      menuPrice: reservation.menu.price,
      staffName: reservation.staff?.name || '未指定',
      createdAt: reservation.createdAt.toISOString(),
    }));

    return successResponse(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        memo: customer.memo || '',
        visitHistory,
        reservationHistory,
        visitCount: visitHistory.length,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
      200
    );
  } catch (error) {
    console.error('GET /api/admin/customers/[id] error:', error);
    return errorResponse('顧客詳細の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * PATCH /api/admin/customers/[id]
 * 顧客情報を更新
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // バリデーション
    const validation = updateCustomerSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { name, phone } = validation.data;

    // 顧客が存在するか確認
    const existingCustomer = await prisma.restaurantUser.findUnique({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingCustomer) {
      return errorResponse('顧客が見つかりません', 404, 'CUSTOMER_NOT_FOUND');
    }

    // 顧客情報を更新
    const updatedCustomer = await prisma.restaurantUser.update({
      where: {
        id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    return successResponse(updatedCustomer, 200);
  } catch (error) {
    console.error('PATCH /api/admin/customers/[id] error:', error);
    return errorResponse('顧客情報の更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

