import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * 顧客メモ更新用のバリデーションスキーマ
 */
const updateMemoSchema = z.object({
  memo: z.string().max(500, 'メモは500文字以内で入力してください'),
});

/**
 * PATCH /api/admin/customers/[id]/memo
 * 顧客メモを更新
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
    const validation = updateMemoSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { memo } = validation.data;

    // 顧客が存在するか確認
    const existingCustomer = await prisma.bookingUser.findUnique({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingCustomer) {
      return errorResponse('顧客が見つかりません', 404, 'CUSTOMER_NOT_FOUND');
    }

    // 顧客メモを更新
    const updatedCustomer = await prisma.bookingUser.update({
      where: {
        id,
      },
      data: {
        memo: memo || '',
      },
      select: {
        id: true,
        memo: true,
        updatedAt: true,
      },
    });

    return successResponse(updatedCustomer, 200);
  } catch (error) {
    console.error('PATCH /api/admin/customers/[id]/memo error:', error);
    return errorResponse('顧客メモの更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

