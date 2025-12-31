import { prisma } from '@/lib/prisma';
import { successResponse, withErrorHandling } from '@/lib/api-response';
import type { Staff } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

/**
 * Get all active staff members
 * GET /api/staff
 *
 * @returns List of active staff members
 *
 * @example
 * GET /api/staff
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "name": "田中太郎",
 *       "role": "シニアスタイリスト",
 *       "isActive": true
 *     }
 *   ],
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function GET() {
  return withErrorHandling(async () => {
    const staff = await prisma.restaurantStaff.findMany({
      where: {
        tenantId: TENANT_ID,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse<Staff[]>(staff);
  });
}
