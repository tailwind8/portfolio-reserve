import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { NextRequest } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

/**
 * GET /api/admin/customers
 * 顧客一覧を取得
 *
 * クエリパラメータ:
 * - search: 顧客名・メールアドレスで検索
 * - sortBy: ソート基準 (visitCount | lastVisitDate | createdAt)
 * - sortOrder: ソート順 (asc | desc)
 * - tenantId: テナントID (デフォルト: 環境変数)
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

    // フィルター条件を構築
    const where: Record<string, unknown> = {
      tenantId,
    };

    // 検索フィルター（名前またはメールアドレス）
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // 顧客一覧を取得
    const customers = await prisma.bookingUser.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        reservations: {
          select: {
            id: true,
            status: true,
            reservedDate: true,
          },
        },
      },
      orderBy: {
        createdAt: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    });

    // 来店回数と最終来店日を計算
    type CustomerReservation = { status: string; reservedDate: Date };
    type CustomerWithReservations = {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      createdAt: Date;
      updatedAt: Date;
      reservations: CustomerReservation[];
    };

    const customersTyped = customers as CustomerWithReservations[];

    const customersWithStats = customersTyped.map((customer) => {
      const completedReservations = customer.reservations.filter(
        (r) => r.status === 'COMPLETED'
      );
      const visitCount = completedReservations.length;
      const lastVisitDate = completedReservations.length > 0
        ? completedReservations.reduce((latest, reservation) => {
            return reservation.reservedDate > latest ? reservation.reservedDate : latest;
          }, completedReservations[0].reservedDate)
        : null;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        visitCount,
        lastVisitDate: lastVisitDate ? lastVisitDate.toISOString().split('T')[0] : null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      };
    });

    // ソート処理
    if (sortBy === 'visitCount') {
      customersWithStats.sort((a, b) => {
        return sortOrder === 'asc' ? a.visitCount - b.visitCount : b.visitCount - a.visitCount;
      });
    } else if (sortBy === 'lastVisitDate') {
      customersWithStats.sort((a, b) => {
        if (!a.lastVisitDate && !b.lastVisitDate) {return 0;}
        if (!a.lastVisitDate) {return 1;}
        if (!b.lastVisitDate) {return -1;}
        return sortOrder === 'asc'
          ? a.lastVisitDate.localeCompare(b.lastVisitDate)
          : b.lastVisitDate.localeCompare(a.lastVisitDate);
      });
    }

    return successResponse(customersWithStats, 200);
  } catch (error) {
    console.error('GET /api/admin/customers error:', error);
    return errorResponse('顧客一覧の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

