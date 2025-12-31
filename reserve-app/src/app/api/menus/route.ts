import { prisma } from '@/lib/prisma';
import { successResponse, withErrorHandling } from '@/lib/api-response';
import type { Menu } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

/**
 * Get all active menus
 * GET /api/menus
 *
 * @returns List of active menus
 *
 * @example
 * GET /api/menus
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "カット",
 *       "description": "シャンプー・ブロー込み",
 *       "price": 5000,
 *       "duration": 60,
 *       "category": "ヘアスタイル",
 *       "isActive": true
 *     }
 *   ],
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function GET() {
  return withErrorHandling(async () => {
    const menus = await prisma.restaurantMenu.findMany({
      where: {
        tenantId: TENANT_ID,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        category: true,
        isActive: true,
      },
      orderBy: [{ category: 'asc' }, { price: 'asc' }],
    });

    return successResponse<Menu[]>(menus);
  });
}
