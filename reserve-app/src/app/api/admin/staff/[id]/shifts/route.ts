import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

/**
 * シフト設定用のバリデーションスキーマ
 */
const shiftSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '出勤時間は HH:MM 形式で入力してください',
  }),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: '退勤時間は HH:MM 形式で入力してください',
  }),
  isActive: z.boolean().optional(),
});

const createShiftsSchema = z.object({
  shifts: z.array(shiftSchema).min(1, '少なくとも1つのシフトを設定してください'),
});

/**
 * GET /api/admin/staff/[id]/shifts
 * スタッフのシフト一覧を取得
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

    // シフトを取得
    const shifts = await prisma.bookingStaffShift.findMany({
      where: {
        staffId,
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return successResponse(shifts, 200);
  } catch (error) {
    console.error('GET /api/admin/staff/[id]/shifts error:', error);
    return errorResponse('シフトの取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/staff/[id]/shifts
 * スタッフのシフトを設定
 *
 * リクエストボディ:
 * {
 *   "shifts": [
 *     {
 *       "dayOfWeek": "MONDAY",
 *       "startTime": "09:00",
 *       "endTime": "18:00",
 *       "isActive": true
 *     }
 *   ]
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
    const validation = createShiftsSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { shifts } = validation.data;

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

    // 時間の妥当性チェック
    for (const shift of shifts) {
      const startMinutes = timeToMinutes(shift.startTime);
      const endMinutes = timeToMinutes(shift.endTime);

      if (endMinutes <= startMinutes) {
        return errorResponse(
          '退勤時間は出勤時間より後である必要があります',
          400,
          'INVALID_TIME_RANGE'
        );
      }
    }

    // 既存のシフトを削除（上書き保存）
    await prisma.bookingStaffShift.deleteMany({
      where: {
        staffId,
        tenantId,
      },
    });

    // 新しいシフトを作成
    const createdShifts = await prisma.bookingStaffShift.createMany({
      data: shifts.map((shift) => ({
        tenantId,
        staffId,
        dayOfWeek: shift.dayOfWeek,
        startTime: shift.startTime,
        endTime: shift.endTime,
        isActive: shift.isActive ?? true,
      })),
    });

    // 作成されたシフトを取得して返す
    const savedShifts = await prisma.bookingStaffShift.findMany({
      where: {
        staffId,
        tenantId,
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    return successResponse(
      {
        count: createdShifts.count,
        shifts: savedShifts,
      },
      201
    );
  } catch (error) {
    console.error('POST /api/admin/staff/[id]/shifts error:', error);
    return errorResponse('シフトの設定に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * 時刻文字列（HH:MM）を分単位に変換
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
