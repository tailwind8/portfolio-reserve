import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandling } from '@/lib/api-response';
import { createReservationSchema } from '@/lib/validations';
import type { Reservation } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

/**
 * Get all reservations for the current user
 * GET /api/reservations
 *
 * @returns List of user's reservations
 *
 * @example
 * GET /api/reservations
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "userId": "uuid",
 *       "staffId": "uuid",
 *       "menuId": "uuid",
 *       "reservedDate": "2025-01-20",
 *       "reservedTime": "14:00",
 *       "status": "CONFIRMED",
 *       "notes": "窓際の席を希望",
 *       "user": { "id": "uuid", "name": "山田太郎", "email": "user@example.com" },
 *       "staff": { "id": "uuid", "name": "田中花子" },
 *       "menu": { "id": "uuid", "name": "カット", "price": 5000, "duration": 60 },
 *       "createdAt": "2025-01-15T10:00:00.000Z",
 *       "updatedAt": "2025-01-15T10:00:00.000Z"
 *     }
 *   ],
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // TODO: Get userId from authenticated session
    // For now, using a temporary mock userId
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const reservations = await prisma.restaurantReservation.findMany({
      where: {
        tenantId: TENANT_ID,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        menu: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: [
        { reservedDate: 'desc' },
        { reservedTime: 'desc' },
      ],
    });

    const formattedReservations: Reservation[] = reservations.map((reservation) => ({
      id: reservation.id,
      userId: reservation.userId,
      staffId: reservation.staffId,
      menuId: reservation.menuId,
      reservedDate: reservation.reservedDate.toISOString().split('T')[0],
      reservedTime: reservation.reservedTime,
      status: reservation.status,
      notes: reservation.notes,
      user: reservation.user,
      staff: reservation.staff,
      menu: reservation.menu,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    }));

    return successResponse<Reservation[]>(formattedReservations);
  });
}

/**
 * Create a new reservation
 * POST /api/reservations
 *
 * @param body - Reservation details
 *
 * @returns Created reservation
 *
 * @example
 * POST /api/reservations
 * Body:
 * {
 *   "menuId": "uuid",
 *   "staffId": "uuid",
 *   "reservedDate": "2025-01-20",
 *   "reservedTime": "14:00",
 *   "notes": "窓際の席を希望"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "userId": "uuid",
 *     "staffId": "uuid",
 *     "menuId": "uuid",
 *     "reservedDate": "2025-01-20",
 *     "reservedTime": "14:00",
 *     "status": "PENDING",
 *     "notes": "窓際の席を希望",
 *     "user": { "id": "uuid", "name": "山田太郎", "email": "user@example.com" },
 *     "staff": { "id": "uuid", "name": "田中花子" },
 *     "menu": { "id": "uuid", "name": "カット", "price": 5000, "duration": 60 },
 *     "createdAt": "2025-01-15T10:00:00.000Z",
 *     "updatedAt": "2025-01-15T10:00:00.000Z"
 *   },
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    // TODO: Get userId from authenticated session
    // For now, using a temporary mock userId
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return errorResponse('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const validation = createReservationSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { menuId, staffId, reservedDate, reservedTime, notes } = validation.data;

    // Check if menu exists and is active
    const menu = await prisma.restaurantMenu.findUnique({
      where: { id: menuId },
    });

    if (!menu || !menu.isActive) {
      return errorResponse('Menu not found or inactive', 404, 'MENU_NOT_FOUND');
    }

    // Check if staff exists and is active
    const staff = await prisma.restaurantStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff || !staff.isActive) {
      return errorResponse('Staff not found or inactive', 404, 'STAFF_NOT_FOUND');
    }

    // Check for duplicate reservations (same staff, date, and overlapping time)
    const existingReservations = await prisma.restaurantReservation.findMany({
      where: {
        tenantId: TENANT_ID,
        staffId,
        reservedDate: new Date(reservedDate),
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        menu: { select: { duration: true } },
      },
    });

    // Check for time slot conflicts
    const [newHour, newMinute] = reservedTime.split(':').map(Number);
    const newStartMinutes = newHour * 60 + newMinute;
    const newEndMinutes = newStartMinutes + menu.duration;

    for (const reservation of existingReservations) {
      const [resHour, resMinute] = reservation.reservedTime.split(':').map(Number);
      const resStartMinutes = resHour * 60 + resMinute;
      const resEndMinutes = resStartMinutes + reservation.menu.duration;

      // Check for overlap
      if (
        (newStartMinutes >= resStartMinutes && newStartMinutes < resEndMinutes) ||
        (newEndMinutes > resStartMinutes && newEndMinutes <= resEndMinutes) ||
        (newStartMinutes <= resStartMinutes && newEndMinutes >= resEndMinutes)
      ) {
        return errorResponse(
          'Time slot is already reserved',
          409,
          'TIME_SLOT_CONFLICT'
        );
      }
    }

    // Create reservation
    const reservation = await prisma.restaurantReservation.create({
      data: {
        tenantId: TENANT_ID,
        userId,
        menuId,
        staffId,
        reservedDate: new Date(reservedDate),
        reservedTime,
        notes,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        menu: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
    });

    const formattedReservation: Reservation = {
      id: reservation.id,
      userId: reservation.userId,
      staffId: reservation.staffId,
      menuId: reservation.menuId,
      reservedDate: reservation.reservedDate.toISOString().split('T')[0],
      reservedTime: reservation.reservedTime,
      status: reservation.status,
      notes: reservation.notes,
      user: reservation.user,
      staff: reservation.staff,
      menu: reservation.menu,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    };

    return successResponse<Reservation>(formattedReservation, 201);
  });
}
