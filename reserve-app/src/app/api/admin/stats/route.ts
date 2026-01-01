import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/stats
 * 管理者ダッシュボード用の統計データを取得
 *
 * レスポンス:
 * {
 *   todayReservations: number,    // 本日の予約件数
 *   monthlyReservations: number,  // 今月の予約件数
 *   monthlyRevenue: number,       // 今月の売上
 *   repeatRate: number,           // リピート率（%）
 *   todayReservationsList: [...], // 本日の予約一覧
 *   weeklyStats: [...]            // 週間予約件数（月〜日）
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // 現在の日時情報
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 本日の予約件数
    const todayReservations = await prisma.bookingReservation.count({
      where: {
        tenantId,
        reservedDate: {
          gte: todayStart,
          lt: todayEnd,
        },
        status: { not: 'CANCELLED' },
      },
    });

    // 今月の予約件数
    const monthlyReservations = await prisma.bookingReservation.count({
      where: {
        tenantId,
        reservedDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: { not: 'CANCELLED' },
      },
    });

    // 本日の予約一覧（詳細情報付き）
    const todayReservationsList = await prisma.bookingReservation.findMany({
      where: {
        tenantId,
        reservedDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        menu: {
          select: {
            name: true,
            price: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        reservedDate: 'asc',
      },
    });

    // 今月の売上計算
    const monthlyReservationsWithPrice = await prisma.bookingReservation.findMany({
      where: {
        tenantId,
        reservedDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'COMPLETED',
      },
      include: {
        menu: {
          select: {
            price: true,
          },
        },
      },
    });

    const monthlyRevenue = monthlyReservationsWithPrice.reduce(
      (sum: number, reservation: { menu: { price: number } | null }) =>
        sum + (reservation.menu?.price || 0),
      0
    );

    // リピート率計算（今月予約した顧客のうち、過去にも予約している人の割合）
    // N+1問題を回避: 1回のクエリで今月予約した顧客のユニークIDを取得
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

    const customerIds = uniqueCustomersThisMonth.map((r) => r.userId);

    // N+1問題を回避: 1回のクエリで過去に予約があった顧客を全て取得
    const customersWithPastReservations = customerIds.length > 0
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
    const repeatRate = uniqueCustomersThisMonth.length > 0
      ? Math.round((repeatCustomers / uniqueCustomersThisMonth.length) * 100)
      : 0;

    // 週間統計（過去7日間の予約件数）
    // N+1問題を回避: 1回のクエリで7日分のデータを取得
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyReservations = await prisma.bookingReservation.findMany({
      where: {
        tenantId,
        reservedDate: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: { not: 'CANCELLED' },
      },
      select: {
        reservedDate: true,
      },
    });

    // 日付ごとにグループ化してカウント
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = weeklyReservations.filter((reservation) => {
        const reservedDate = new Date(reservation.reservedDate);
        return reservedDate >= dayStart && reservedDate <= dayEnd;
      }).length;

      weeklyStats.push({
        date: dayStart.toISOString().split('T')[0],
        day: ['日', '月', '火', '水', '木', '金', '土'][dayStart.getDay()],
        count,
      });
    }

    // レスポンス整形
    const formattedReservations = todayReservationsList.map(
      (reservation: (typeof todayReservationsList)[0]) => ({
        id: reservation.id,
        time: reservation.reservedTime, // "14:00" format
        customer: reservation.user?.name || '名前未設定',
        email: reservation.user?.email || '',
        menu: reservation.menu?.name || 'メニュー未設定',
        staff: reservation.staff?.name || 'スタッフ未設定',
        status: reservation.status,
        price: reservation.menu?.price || 0,
        duration: reservation.menu?.duration || 0,
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        todayReservations,
        monthlyReservations,
        monthlyRevenue,
        repeatRate,
        todayReservationsList: formattedReservations,
        weeklyStats,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admin statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
