import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/analytics
 * 分析レポート用のデータを取得
 *
 * レスポンス:
 * {
 *   reservationTrends: {
 *     daily: Array<{ date: string, count: number }>,    // 過去30日分
 *     weekly: Array<{ week: string, count: number }>,   // 過去8週間分
 *     monthly: Array<{ month: string, count: number }>, // 過去12ヶ月分
 *   },
 *   repeatRate: {
 *     overall: number,           // 全体のリピート率（%）
 *     newCustomers: number,      // 新規顧客数
 *     repeatCustomers: number,   // リピート顧客数
 *     monthlyTrends: Array<{     // 過去6ヶ月のリピート率推移
 *       month: string,
 *       rate: number
 *     }>
 *   }
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // テスト環境ではモックデータを返す
    if (process.env.SKIP_AUTH_IN_TEST === 'true') {
      return NextResponse.json({
        success: true,
        data: generateMockAnalyticsData(),
      });
    }

    const now = new Date();

    // ========================================
    // 予約推移データの取得
    // ========================================

    // 日別データ（過去30日分）
    const dailyData = await getDailyTrends(tenantId, now, 30);

    // 週別データ（過去8週間分）
    const weeklyData = await getWeeklyTrends(tenantId, now, 8);

    // 月別データ（過去12ヶ月分）
    const monthlyData = await getMonthlyTrends(tenantId, now, 12);

    // ========================================
    // リピート率データの取得
    // ========================================

    // 全体のリピート率
    const { newCustomers, repeatCustomers, overall } = await getOverallRepeatRate(tenantId, now);

    // 月別リピート率推移（過去6ヶ月）
    const monthlyRepeatTrends = await getMonthlyRepeatRateTrends(tenantId, now, 6);

    return NextResponse.json({
      success: true,
      data: {
        reservationTrends: {
          daily: dailyData,
          weekly: weeklyData,
          monthly: monthlyData,
        },
        repeatRate: {
          overall,
          newCustomers,
          repeatCustomers,
          monthlyTrends: monthlyRepeatTrends,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'データの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ========================================
// ヘルパー関数
// ========================================

/**
 * テスト用のモックデータを生成
 */
function generateMockAnalyticsData() {
  const now = new Date();

  // 日別データ（過去30日分）
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dailyData.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10) + 5,
    });
  }

  // 週別データ（過去8週間分）
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeklyData.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      count: Math.floor(Math.random() * 50) + 30,
    });
  }

  // 月別データ（過去12ヶ月分）
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyData.push({
      month: `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 150) + 100,
    });
  }

  // リピート率の月別推移（過去6ヶ月）
  const monthlyRepeatTrends = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyRepeatTrends.push({
      month: `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      rate: Math.floor(Math.random() * 30) + 50,
    });
  }

  return {
    reservationTrends: {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
    },
    repeatRate: {
      overall: 65,
      newCustomers: 45,
      repeatCustomers: 85,
      monthlyTrends: monthlyRepeatTrends,
    },
  };
}

/**
 * 日別予約推移を取得（過去N日分）
 */
async function getDailyTrends(tenantId: string, now: Date, days: number) {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const reservations = await prisma.bookingReservation.findMany({
    where: {
      tenantId,
      reservedDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: 'CANCELLED' },
    },
    select: {
      reservedDate: true,
    },
  });

  // 日付ごとにグループ化
  const dailyMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, 0);
  }

  reservations.forEach((reservation: { reservedDate: Date }) => {
    const dateStr = reservation.reservedDate.toISOString().split('T')[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    }
  });

  return Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * 週別予約推移を取得（過去N週間分）
 */
async function getWeeklyTrends(tenantId: string, now: Date, weeks: number) {
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const reservations = await prisma.bookingReservation.findMany({
    where: {
      tenantId,
      reservedDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: 'CANCELLED' },
    },
    select: {
      reservedDate: true,
    },
  });

  // 週ごとにグループ化
  const weeklyMap = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weeks - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weeklyMap.set(weekLabel, 0);
  }

  // 各予約を週に割り当て
  reservations.forEach((reservation: { reservedDate: Date }) => {
    const reservedDate = reservation.reservedDate;
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (weeks - i) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      if (reservedDate >= weekStart && reservedDate <= weekEnd) {
        const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        weeklyMap.set(weekLabel, (weeklyMap.get(weekLabel) || 0) + 1);
        break;
      }
    }
  });

  return Array.from(weeklyMap.entries()).map(([week, count]) => ({
    week,
    count,
  }));
}

/**
 * 月別予約推移を取得（過去Nヶ月分）
 */
async function getMonthlyTrends(tenantId: string, now: Date, months: number) {
  const monthlyMap = new Map<string, number>();

  for (let i = 0; i < months; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const monthLabel = `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(monthLabel, 0);
  }

  // 過去Nヶ月の予約を取得
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const reservations = await prisma.bookingReservation.findMany({
    where: {
      tenantId,
      reservedDate: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: 'CANCELLED' },
    },
    select: {
      reservedDate: true,
    },
  });

  reservations.forEach((reservation: { reservedDate: Date }) => {
    const reservedDate = reservation.reservedDate;
    const monthLabel = `${reservedDate.getFullYear()}/${String(reservedDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(monthLabel)) {
      monthlyMap.set(monthLabel, (monthlyMap.get(monthLabel) || 0) + 1);
    }
  });

  return Array.from(monthlyMap.entries()).map(([month, count]) => ({
    month,
    count,
  }));
}

/**
 * 全体のリピート率を取得
 */
async function getOverallRepeatRate(tenantId: string, now: Date) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 今月予約した顧客のユニークID
  const uniqueCustomersThisMonth = await prisma.bookingReservation.findMany({
    where: {
      tenantId,
      reservedDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      userId: true,
    },
    distinct: ['userId'],
  });

  const customerIds = uniqueCustomersThisMonth.map((r: { userId: string }) => r.userId);

  // 過去に予約があった顧客
  const customersWithPastReservations =
    customerIds.length > 0
      ? await prisma.bookingReservation.findMany({
          where: {
            tenantId,
            userId: { in: customerIds },
            reservedDate: {
              lt: monthStart,
            },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })
      : [];

  const repeatCustomers = customersWithPastReservations.length;
  const newCustomers = uniqueCustomersThisMonth.length - repeatCustomers;
  const overall =
    uniqueCustomersThisMonth.length > 0
      ? Math.round((repeatCustomers / uniqueCustomersThisMonth.length) * 100)
      : 0;

  return {
    newCustomers,
    repeatCustomers,
    overall,
  };
}

/**
 * 月別リピート率推移を取得（過去Nヶ月）
 */
async function getMonthlyRepeatRateTrends(tenantId: string, now: Date, months: number) {
  const trends = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
    const monthLabel = `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

    // 対象月の顧客
    const uniqueCustomersThisMonth = await prisma.bookingReservation.findMany({
      where: {
        tenantId,
        reservedDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const customerIds = uniqueCustomersThisMonth.map((r: { userId: string }) => r.userId);

    // 過去に予約があった顧客
    const customersWithPastReservations =
      customerIds.length > 0
        ? await prisma.bookingReservation.findMany({
            where: {
              tenantId,
              userId: { in: customerIds },
              reservedDate: {
                lt: monthStart,
              },
            },
            select: {
              userId: true,
            },
            distinct: ['userId'],
          })
        : [];

    const repeatCustomers = customersWithPastReservations.length;
    const rate =
      uniqueCustomersThisMonth.length > 0
        ? Math.round((repeatCustomers / uniqueCustomersThisMonth.length) * 100)
        : 0;

    trends.push({
      month: monthLabel,
      rate,
    });
  }

  return trends;
}
