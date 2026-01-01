import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * 休暇設定用のバリデーションスキーマ
 */
const createVacationSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: '開始日は YYYY-MM-DD 形式で入力してください',
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: '終了日は YYYY-MM-DD 形式で入力してください',
  }),
  reason: z.string().optional(),
});

/**
 * GET /api/admin/staff/[id]/vacations
 * スタッフの休暇一覧を取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params;
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // スタッフの存在確認
    const staff = await prisma.bookingStaff.findFirst({
      where: {
        id: staffId,
        tenantId,
      },
    });

    if (!staff) {
      return errorResponse('スタッフが見つかりません', 404, 'STAFF_NOT_FOUND');
    }

    // 休暇を取得（未来の休暇のみ）
    const vacations = await prisma.bookingStaffVacation.findMany({
      where: {
        staffId,
        tenantId,
        endDate: {
          gte: new Date(), // 終了日が今日以降
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return successResponse(vacations, 200);
  } catch (error) {
    console.error('GET /api/admin/staff/[id]/vacations error:', error);
    return errorResponse('休暇の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/staff/[id]/vacations
 * スタッフの休暇を設定
 *
 * リクエストボディ:
 * {
 *   "startDate": "2025-01-25",
 *   "endDate": "2025-01-27",
 *   "reason": "私用休暇"
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params;
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // バリデーション
    const validation = createVacationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { startDate, endDate, reason } = validation.data;

    // スタッフの存在確認
    const staff = await prisma.bookingStaff.findFirst({
      where: {
        id: staffId,
        tenantId,
      },
    });

    if (!staff) {
      return errorResponse('スタッフが見つかりません', 404, 'STAFF_NOT_FOUND');
    }

    // 日付の妥当性チェック
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return errorResponse(
        '終了日は開始日以降である必要があります',
        400,
        'INVALID_DATE_RANGE'
      );
    }

    // 休暇を作成
    const vacation = await prisma.bookingStaffVacation.create({
      data: {
        tenantId,
        staffId,
        startDate: start,
        endDate: end,
        reason,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(vacation, 201);
  } catch (error) {
    console.error('POST /api/admin/staff/[id]/vacations error:', error);
    return errorResponse('休暇の設定に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
