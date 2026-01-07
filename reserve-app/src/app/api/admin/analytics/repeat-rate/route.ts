import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';
import { requireFeatureFlag } from '@/lib/api-feature-flag';

/**
 * GET /api/admin/analytics/repeat-rate
 * リピート率分析データを取得
 *
 * クエリパラメータ:
 * - tenantId: テナントID (デフォルト: 環境変数)
 */
export async function GET(request: NextRequest) {
  return requireFeatureFlag('enableRepeatRateAnalysis', async () => {
    const admin = await requireAdminApiAuth(request);
    if (admin instanceof Response) {return admin;}

    try {
      const { searchParams } = new URL(request.url);
      const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

      // 全予約を取得
      const allReservations = await prisma.bookingReservation.findMany({
        where: {
          tenantId,
          status: 'COMPLETED',
        },
        select: {
          userId: true,
          reservedDate: true,
        },
        orderBy: {
          reservedDate: 'asc',
        },
      });

      // ユーザーごとの予約回数を集計
      const userReservationCounts = new Map<string, number>();

      for (const reservation of allReservations) {
        const count = userReservationCounts.get(reservation.userId) || 0;
        userReservationCounts.set(reservation.userId, count + 1);
      }

      // リピーター数とユニークユーザー数を計算
      const totalUsers = userReservationCounts.size;
      const repeatUsers = Array.from(userReservationCounts.values()).filter((count) => count > 1).length;

      // リピート率を計算（％）
      const repeatRate = totalUsers > 0 ? Math.round((repeatUsers / totalUsers) * 100) : 0;

      // 予約回数の分布を計算
      const reservationDistribution = {
        once: 0,
        twice: 0,
        threeTimes: 0,
        fourOrMore: 0,
      };

      for (const count of userReservationCounts.values()) {
        if (count === 1) {
          reservationDistribution.once++;
        } else if (count === 2) {
          reservationDistribution.twice++;
        } else if (count === 3) {
          reservationDistribution.threeTimes++;
        } else {
          reservationDistribution.fourOrMore++;
        }
      }

      return successResponse({
        repeatRate,
        totalUsers,
        repeatUsers,
        oneTimeUsers: totalUsers - repeatUsers,
        reservationDistribution,
      });
    } catch (error) {
      console.error('Error fetching repeat rate analytics:', error);
      return errorResponse(
        'Failed to fetch repeat rate analytics',
        500,
        'ANALYTICS_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });
}
