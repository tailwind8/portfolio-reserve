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
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // 現在の日時情報
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 本日の予約件数
    const todayReservations = await prisma.restaurantReservation.count({
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
    const monthlyReservations = await prisma.restaurantReservation.count({
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
    const todayReservationsList = await prisma.restaurantReservation.findMany({
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
    const monthlyReservationsWithPrice = await prisma.restaurantReservation.findMany({
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
      (sum, reservation) => sum + (reservation.menu?.price || 0),
      0
    );

    // リピート率計算（今月予約した顧客のうち、過去にも予約している人の割合）
    const uniqueCustomersThisMonth = await prisma.restaurantReservation.findMany({
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

    let repeatCustomers = 0;
    for (const { userId } of uniqueCustomersThisMonth) {
      const pastReservations = await prisma.restaurantReservation.count({
        where: {
          tenantId,
          userId,
          reservedDate: {
            lt: monthStart,
          },
        },
      });
      if (pastReservations > 0) {
        repeatCustomers++;
      }
    }

    const repeatRate = uniqueCustomersThisMonth.length > 0
      ? Math.round((repeatCustomers / uniqueCustomersThisMonth.length) * 100)
      : 0;

    // 週間統計（過去7日間の予約件数）
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.restaurantReservation.count({
        where: {
          tenantId,
          reservedDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          status: { not: 'CANCELLED' },
        },
      });

      weeklyStats.push({
        date: dayStart.toISOString().split('T')[0],
        day: ['日', '月', '火', '水', '木', '金', '土'][dayStart.getDay()],
        count,
      });
    }

    // レスポンス整形
    const formattedReservations = todayReservationsList.map((reservation) => ({
      id: reservation.id,
      time: reservation.reservedTime, // "14:00" format
      customer: reservation.user?.name || '名前未設定',
      email: reservation.user?.email || '',
      menu: reservation.menu?.name || 'メニュー未設定',
      staff: reservation.staff?.name || 'スタッフ未設定',
      status: reservation.status,
      price: reservation.menu?.price || 0,
      duration: reservation.menu?.duration || 0,
    }));

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
