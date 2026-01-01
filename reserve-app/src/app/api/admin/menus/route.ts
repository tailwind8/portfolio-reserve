import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * メニュー作成用のバリデーションスキーマ
 */
const createMenuSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください'),
  price: z.number().min(0, '価格は0以上の数値を入力してください'),
  duration: z.number().min(1, '所要時間を入力してください'),
  category: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/admin/menus
 * メニュー一覧を取得
 *
 * クエリパラメータ:
 * - search: メニュー名で検索
 * - category: カテゴリでフィルター
 * - tenantId: テナントID (デフォルト: 環境変数)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // フィルター条件を構築
    const where: Record<string, unknown> = {
      tenantId,
    };

    // 検索フィルター
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // カテゴリフィルター
    if (category) {
      where.category = category;
    }

    // メニュー一覧を取得
    const menus = await prisma.restaurantMenu.findMany({
      where,
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
            reservations: true, // 予約件数をカウント
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(menus, 200);
  } catch (error) {
    console.error('GET /api/admin/menus error:', error);
    return errorResponse('メニュー一覧の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/admin/menus
 * 新しいメニューを作成
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // バリデーション
    const validation = createMenuSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const { name, price, duration, category, description } = validation.data;

    // メニューを作成
    const menu = await prisma.restaurantMenu.create({
      data: {
        tenantId,
        name,
        price,
        duration,
        category,
        description,
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
      },
    });

    return successResponse(menu, 201);
  } catch (error) {
    console.error('POST /api/admin/menus error:', error);
    return errorResponse('メニューの作成に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
