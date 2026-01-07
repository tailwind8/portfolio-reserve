import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getTenantId, validationErrorResponse, notFoundResponse } from '@/lib/api-utils';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

const updateMemoSchema = z.object({
  memo: z.string().max(500, 'メモは500文字以内で入力してください'),
});

/**
 * PATCH /api/admin/customers/[id]/memo - 顧客メモを更新
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

    const validation = updateMemoSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.issues);
    }

    const { memo } = validation.data;
    const tenantId = getTenantId();

    const existingCustomer = await prisma.bookingUser.findUnique({
      where: { id, tenantId },
    });

    if (!existingCustomer) {
      return notFoundResponse('顧客');
    }

    const updatedCustomer = await prisma.bookingUser.update({
      where: { id, tenantId },
      data: { memo: memo || '' },
      select: { id: true, memo: true, updatedAt: true },
    });

    return successResponse(updatedCustomer, 200);
  } catch (error) {
    console.error('PATCH /api/admin/customers/[id]/memo error:', error);
    return errorResponse('顧客メモの更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

