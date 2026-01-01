import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * スタッフ更新用のバリデーションスキーマ
 */
const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
});

/**
 * GET /api/admin/staff/[id]
 * 特定のスタッフの詳細を取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    const staff = await prisma.bookingStaff.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
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

    if (!staff) {
      return errorResponse('スタッフが見つかりません', 404, 'NOT_FOUND');
    }

    return successResponse(staff, 200);
  } catch (error) {
    console.error('GET /api/admin/staff/[id] error:', error);
    return errorResponse('スタッフ情報の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * PATCH /api/admin/staff/[id]
 * スタッフ情報を更新
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
    const validation = updateStaffSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    // スタッフの存在確認
    const existingStaff = await prisma.bookingStaff.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingStaff) {
      return errorResponse('スタッフが見つかりません', 404, 'NOT_FOUND');
    }

    // メールアドレス変更時の重複チェック
    if (validation.data.email && validation.data.email !== existingStaff.email) {
      const emailExists = await prisma.bookingStaff.findFirst({
        where: {
          tenantId,
          email: validation.data.email,
          id: {
            not: id,
          },
        },
      });

      if (emailExists) {
        return errorResponse(
          'このメールアドレスは既に登録されています',
          400,
          'EMAIL_EXISTS'
        );
      }
    }

    // スタッフ情報を更新
    const staff = await prisma.bookingStaff.update({
      where: {
        id,
      },
      data: validation.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return successResponse(staff, 200);
  } catch (error) {
    console.error('PATCH /api/admin/staff/[id] error:', error);
    return errorResponse('スタッフ情報の更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * スタッフを削除（論理削除）
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // スタッフの存在確認
    const staff = await prisma.bookingStaff.findFirst({
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

    if (!staff) {
      return errorResponse('スタッフが見つかりません', 404, 'NOT_FOUND');
    }

    // 予約が存在する場合は削除不可
    if (staff._count.reservations > 0) {
      return errorResponse(
        '予約が存在するため削除できません',
        400,
        'HAS_RESERVATIONS'
      );
    }

    // 論理削除（isActiveをfalseに設定）
    await prisma.bookingStaff.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return successResponse(null, 200);
  } catch (error) {
    console.error('DELETE /api/admin/staff/[id] error:', error);
    return errorResponse('スタッフの削除に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
