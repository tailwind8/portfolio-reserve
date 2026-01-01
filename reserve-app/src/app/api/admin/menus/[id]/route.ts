import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * メニュー更新用のバリデーションスキーマ
 */
const updateMenuSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  duration: z.number().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/menus/[id]
 * 特定のメニューの詳細を取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    const menu = await prisma.bookingMenu.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        category: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!menu) {
      return errorResponse('メニューが見つかりません', 404, 'NOT_FOUND');
    }

    return successResponse(menu, 200);
  } catch (error) {
    console.error('GET /api/admin/menus/[id] error:', error);
    return errorResponse('メニュー情報の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * PATCH /api/admin/menus/[id]
 * メニュー情報を更新
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // バリデーション
    const validation = updateMenuSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    // メニューの存在確認
    const existingMenu = await prisma.bookingMenu.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingMenu) {
      return errorResponse('メニューが見つかりません', 404, 'NOT_FOUND');
    }

    // メニュー情報を更新
    const menu = await prisma.bookingMenu.update({
      where: {
        id,
      },
      data: validation.data,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        category: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return successResponse(menu, 200);
  } catch (error) {
    console.error('PATCH /api/admin/menus/[id] error:', error);
    return errorResponse('メニュー情報の更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/admin/menus/[id]
 * メニューを削除（論理削除）
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // メニューの存在確認
    const menu = await prisma.bookingMenu.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!menu) {
      return errorResponse('メニューが見つかりません', 404, 'NOT_FOUND');
    }

    // 予約が存在する場合は削除不可
    if (menu._count.reservations > 0) {
      return errorResponse(
        '予約が存在するため削除できません',
        400,
        'HAS_RESERVATIONS'
      );
    }

    // 論理削除（isActiveをfalseに設定）
    await prisma.bookingMenu.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return successResponse(null, 200);
  } catch (error) {
    console.error('DELETE /api/admin/menus/[id] error:', error);
    return errorResponse('メニューの削除に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
