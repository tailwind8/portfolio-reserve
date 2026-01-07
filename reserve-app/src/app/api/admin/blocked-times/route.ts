import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * 予約ブロック作成用のバリデーションスキーマ
 */
const blockedTimeCreateSchema = z
  .object({
    startDateTime: z.string().min(1, '開始日時は必須です'),
    endDateTime: z.string().min(1, '終了日時は必須です'),
    reason: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDateTime);
      const end = new Date(data.endDateTime);
      return !isNaN(start.getTime()) && !isNaN(end.getTime());
    },
    {
      message: '有効な日時形式で入力してください',
      path: ['startDateTime'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDateTime);
      const end = new Date(data.endDateTime);
      return end > start;
    },
    {
      message: '終了日時は開始日時より後にしてください',
      path: ['endDateTime'],
    }
  );

/**
 * GET /api/admin/blocked-times
 * 予約ブロック一覧を取得
 * クエリパラメータ:
 * - from: 開始日（YYYY-MM-DD形式）
 * - to: 終了日（YYYY-MM-DD形式）
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // 日付範囲フィルター
    const where: {
      tenantId: string;
      startDateTime?: { gte: Date };
      endDateTime?: { lte: Date };
    } = {
      tenantId: TENANT_ID,
    };

    if (fromDate) {
      where.startDateTime = { gte: new Date(fromDate) };
    }

    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      where.endDateTime = { lte: endOfDay };
    }

    const blockedTimes = await prisma.bookingBlockedTimeSlot.findMany({
      where,
      orderBy: {
        startDateTime: 'asc',
      },
    });

    return successResponse(blockedTimes, 200);
  } catch (error) {
    console.error('Failed to fetch blocked times:', error);
    return errorResponse('予約ブロック一覧の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/blocked-times
 * 新しい予約ブロックを追加
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const body = await request.json();

    // Zodバリデーション
    const validation = blockedTimeCreateSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { startDateTime, endDateTime, reason, description } = validation.data;
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // 予約ブロックを作成
    const blockedTime = await prisma.bookingBlockedTimeSlot.create({
      data: {
        tenantId: TENANT_ID,
        startDateTime: start,
        endDateTime: end,
        reason: reason || null,
        description: description || null,
      },
    });

    return successResponse(
      { ...blockedTime, message: '予約ブロックを追加しました' },
      201
    );
  } catch (error) {
    console.error('Failed to create blocked time:', error);
    return errorResponse('予約ブロックの追加に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
