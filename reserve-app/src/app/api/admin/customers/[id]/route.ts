import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getTenantId, validationErrorResponse, notFoundResponse } from '@/lib/api-utils';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;

    // 顧客情報を取得
    const customer = await prisma.bookingUser.findUnique({
      where: { id, tenantId: getTenantId() },
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
      return notFoundResponse('顧客');
    }

    type CustomerReservation = {
      id: string;
      reservedDate: Date;
      reservedTime: string;
      status: string;
      createdAt: Date;
      menu: { name: string; price: number; duration: number };
      staff?: { name: string; role: string | null } | null;
    };

    const reservations = customer.reservations as CustomerReservation[];

    // 来店履歴（status='COMPLETED'の予約）
    const visitHistory = reservations
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
    const reservationHistory = reservations.map((reservation) => ({
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validation = updateCustomerSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.issues);
    }

    const { name, phone } = validation.data;

    // 顧客が存在するか確認
    const existingCustomer = await prisma.bookingUser.findUnique({
      where: { id, tenantId: getTenantId() },
    });

    if (!existingCustomer) {
      return notFoundResponse('顧客');
    }

    // 顧客情報を更新
    const updatedCustomer = await prisma.bookingUser.update({
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

