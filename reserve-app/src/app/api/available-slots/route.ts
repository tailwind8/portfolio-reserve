import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandling } from '@/lib/api-response';
import { availableSlotsQuerySchema } from '@/lib/validations';
import type { AvailableSlots, TimeSlot } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-restaurant';

/**
 * Generate time slots based on store settings
 */
function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number,
  menuDuration: number
): string[] {
  const slots: string[] = [];
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute - menuDuration; // Exclude slots that would exceed closing time

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += slotDuration) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }

  return slots;
}

/**
 * Check if a time slot is available for a staff member
 */
function isSlotAvailable(
  time: string,
  reservations: { reservedTime: string; menu: { duration: number } }[],
  menuDuration: number
): boolean {
  const [slotHour, slotMinute] = time.split(':').map(Number);
  const slotStartMinutes = slotHour * 60 + slotMinute;
  const slotEndMinutes = slotStartMinutes + menuDuration;

  for (const reservation of reservations) {
    const [resHour, resMinute] = reservation.reservedTime.split(':').map(Number);
    const resStartMinutes = resHour * 60 + resMinute;
    const resEndMinutes = resStartMinutes + reservation.menu.duration;

    // Check for time slot overlap
    if (
      (slotStartMinutes >= resStartMinutes && slotStartMinutes < resEndMinutes) ||
      (slotEndMinutes > resStartMinutes && slotEndMinutes <= resEndMinutes) ||
      (slotStartMinutes <= resStartMinutes && slotEndMinutes >= resEndMinutes)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Get available time slots for a specific date, menu, and optionally staff
 * GET /api/available-slots?date=2025-01-20&menuId=uuid&staffId=uuid
 *
 * @param date - Date in YYYY-MM-DD format
 * @param menuId - Menu UUID
 * @param staffId - Optional staff UUID
 *
 * @returns Available time slots
 *
 * @example
 * GET /api/available-slots?date=2025-01-20&menuId=uuid&staffId=uuid
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "date": "2025-01-20",
 *     "slots": [
 *       { "time": "09:00", "available": true, "staffId": "uuid" },
 *       { "time": "09:30", "available": false },
 *       { "time": "10:00", "available": true, "staffId": "uuid" }
 *     ]
 *   },
 *   "timestamp": "2025-01-20T12:00:00.000Z"
 * }
 */
export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = request.nextUrl;
    const params = {
      date: searchParams.get('date'),
      menuId: searchParams.get('menuId'),
      staffId: searchParams.get('staffId'),
    };

    // Validate query parameters
    const validation = availableSlotsQuerySchema.safeParse(params);
    if (!validation.success) {
      return errorResponse('Invalid query parameters', 400, 'VALIDATION_ERROR', validation.error.issues);
    }

    const { date, menuId, staffId } = validation.data;

    // Check if date is a closed day
    const settings = await prisma.restaurantSettings.findUnique({
      where: { tenantId: TENANT_ID },
    });

    if (!settings) {
      return errorResponse('Store settings not found', 404, 'SETTINGS_NOT_FOUND');
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (settings.closedDays.includes(dayOfWeek)) {
      return successResponse<AvailableSlots>({
        date,
        slots: [],
      });
    }

    // Get menu details
    const menu = await prisma.restaurantMenu.findUnique({
      where: { id: menuId },
      select: { duration: true },
    });

    if (!menu) {
      return errorResponse('Menu not found', 404, 'MENU_NOT_FOUND');
    }

    // Generate all possible time slots
    const allTimeSlots = generateTimeSlots(
      settings.openTime,
      settings.closeTime,
      settings.slotDuration,
      menu.duration
    );

    // If staffId is provided, check availability for that specific staff
    if (staffId) {
      const reservations = await prisma.restaurantReservation.findMany({
        where: {
          tenantId: TENANT_ID,
          staffId,
          reservedDate: new Date(date),
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: {
          reservedTime: true,
          menu: { select: { duration: true } },
        },
      });

      const slots: TimeSlot[] = allTimeSlots.map((time) => ({
        time,
        available: isSlotAvailable(time, reservations, menu.duration),
        staffId,
      }));

      return successResponse<AvailableSlots>({ date, slots });
    }

    // If no staffId, check availability across all active staff
    const activeStaff = await prisma.restaurantStaff.findMany({
      where: {
        tenantId: TENANT_ID,
        isActive: true,
      },
      select: { id: true },
    });

    // スタッフが存在しない場合、全ての時間スロットを利用可能として返す
    if (activeStaff.length === 0) {
      const slots: TimeSlot[] = allTimeSlots.map((time) => ({
        time,
        available: true,
      }));
      return successResponse<AvailableSlots>({ date, slots });
    }

    const allReservations = await prisma.restaurantReservation.findMany({
      where: {
        tenantId: TENANT_ID,
        reservedDate: new Date(date),
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        staffId: true,
        reservedTime: true,
        menu: { select: { duration: true } },
      },
    });

    // Group reservations by staff
    const reservationsByStaff = new Map<string, typeof allReservations>();
    for (const staff of activeStaff) {
      reservationsByStaff.set(
        staff.id,
        allReservations.filter((r) => r.staffId === staff.id)
      );
    }

    // Check if any staff is available for each time slot
    const slots: TimeSlot[] = allTimeSlots.map((time) => {
      for (const [sid, reservations] of reservationsByStaff.entries()) {
        if (isSlotAvailable(time, reservations, menu.duration)) {
          return { time, available: true, staffId: sid };
        }
      }
      return { time, available: false };
    });

    return successResponse<AvailableSlots>({ date, slots });
  });
}
