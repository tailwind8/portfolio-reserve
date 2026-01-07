import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';
import { requireFeatureFlag } from '@/lib/api-feature-flag';
import type { NextRequest } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

/**
 * スタッフ作成用のバリデーションスキーマ
 */
const createStaffSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください'),
  email: z.string().min(1, 'メールアドレスを入力してください').email('有効なメールアドレスを入力してください'),
  phone: z.string().optional(),
  role: z.string().optional(),
});

/**
 * GET /api/admin/staff
 * スタッフ一覧を取得
 *
 * クエリパラメータ:
 * - search: スタッフ名で検索
 * - tenantId: テナントID (デフォルト: 環境変数)
 */
export async function GET(request: NextRequest) {
  return requireFeatureFlag('enableStaffShiftManagement', async () => {
    const admin = await requireAdminApiAuth(request);
    if (admin instanceof Response) {return admin;}

    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

      // フィルター条件を構築
      const where: Record<string, unknown> = {
        tenantId,
        isActive: true, // アクティブなスタッフのみ
      };

      // 検索フィルター
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // スタッフ一覧を取得
      const staff = await prisma.bookingStaff.findMany({
        where,
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
              reservations: true, // 予約件数をカウント
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return successResponse(staff, 200);
    } catch (error) {
      console.error('GET /api/admin/staff error:', error);
      return errorResponse('スタッフ一覧の取得に失敗しました', 500, 'INTERNAL_ERROR');
    }
  });
}

/**
 * POST /api/admin/staff
 * 新しいスタッフを作成
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // バリデーション
    const validation = createStaffSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { name, email, phone, role } = validation.data;

    // メールアドレスの重複チェック
    const existingStaff = await prisma.bookingStaff.findFirst({
      where: {
        tenantId,
        email,
      },
    });

    if (existingStaff) {
      return errorResponse(
        'このメールアドレスは既に登録されています',
        400,
        'EMAIL_EXISTS'
      );
    }

    // スタッフを作成
    const staff = await prisma.bookingStaff.create({
      data: {
        tenantId,
        name,
        email,
        phone,
        role,
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
      },
    });

    return successResponse(staff, 201);
  } catch (error) {
    console.error('POST /api/admin/staff error:', error);
    return errorResponse('スタッフの作成に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
