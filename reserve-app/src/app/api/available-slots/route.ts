import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandling } from '@/lib/api-response';
import { availableSlotsQuerySchema } from '@/lib/validations';
import { getFeatureFlags } from '@/lib/api-feature-flag';
import type { AvailableSlots, TimeSlot } from '@/types/api';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

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
 * Issue #78: スタッフがシフト内で勤務しているかチェック
 */
function isStaffWorkingAtTime(
  time: string,
  shifts: { dayOfWeek: string; startTime: string; endTime: string; isActive: boolean }[],
  dayOfWeek: string
): boolean {
  // シフトが登録されていない場合は勤務していない
  if (shifts.length === 0) {
    return false;
  }

  // 指定された曜日のアクティブなシフトを検索
  const shift = shifts.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  if (!shift) {
    return false;
  }

  // 時間を分に変換
  const [timeHour, timeMinute] = time.split(':').map(Number);
  const timeMinutes = timeHour * 60 + timeMinute;

  const [startHour, startMinute] = shift.startTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;

  const [endHour, endMinute] = shift.endTime.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;

  // シフト内の時間かチェック
  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
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
    const settings = await prisma.bookingSettings.findUnique({
      where: { tenantId: TENANT_ID },
    });

    if (!settings) {
      return errorResponse('Store settings not found', 404, 'SETTINGS_NOT_FOUND');
    }

    const closedDayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (settings.closedDays.includes(closedDayName)) {
      return successResponse<AvailableSlots>({
        date,
        slots: [],
      });
    }

    // Get menu details
    const menu = await prisma.bookingMenu.findUnique({
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
      const reservations = await prisma.bookingReservation.findMany({
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
    const activeStaff = await prisma.bookingStaff.findMany({
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

    // Issue #78: 機能フラグを取得してシフト管理を確認
    const featureFlags = await getFeatureFlags();
    const enableShiftManagement = featureFlags?.enableStaffShiftManagement || false;

    // シフト管理がONの場合、シフトと休暇情報を取得
    const staffShifts: Map<string, { dayOfWeek: string; startTime: string; endTime: string; isActive: boolean }[]> = new Map();
    const staffVacations: Map<string, { startDate: Date; endDate: Date }[]> = new Map();

    if (enableShiftManagement) {
      // 指定日の曜日を取得
      const dateObj = new Date(date);
      const dayOfWeekMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayOfWeek = dayOfWeekMap[dateObj.getDay()];

      // 全スタッフのシフト情報を取得
      const shifts = await prisma.bookingStaffShift.findMany({
        where: {
          tenantId: TENANT_ID,
          staffId: { in: activeStaff.map((s) => s.id) },
          isActive: true,
        },
        select: {
          staffId: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
        },
      });

      // スタッフごとにシフトをグループ化
      for (const shift of shifts) {
        const staffShiftList = staffShifts.get(shift.staffId) || [];
        staffShiftList.push({
          dayOfWeek: shift.dayOfWeek,
          startTime: shift.startTime,
          endTime: shift.endTime,
          isActive: shift.isActive,
        });
        staffShifts.set(shift.staffId, staffShiftList);
      }

      // 全スタッフの休暇情報を取得
      const vacations = await prisma.bookingStaffVacation.findMany({
        where: {
          tenantId: TENANT_ID,
          staffId: { in: activeStaff.map((s) => s.id) },
          startDate: { lte: new Date(date + 'T23:59:59Z') },
          endDate: { gte: new Date(date + 'T00:00:00Z') },
        },
        select: {
          staffId: true,
          startDate: true,
          endDate: true,
        },
      });

      // スタッフごとに休暇をグループ化
      for (const vacation of vacations) {
        const staffVacationList = staffVacations.get(vacation.staffId) || [];
        staffVacationList.push({
          startDate: vacation.startDate,
          endDate: vacation.endDate,
        });
        staffVacations.set(vacation.staffId, staffVacationList);
      }

      // シフト管理ON時: シフト未登録または休暇中のスタッフを除外
      const dateObj2 = new Date(date);
      const dayOfWeek2 = dayOfWeekMap[dateObj2.getDay()];

      // スタッフをフィルタリング
      const filteredStaff = activeStaff.filter((staff) => {
        // 休暇中のスタッフを除外
        const vacationList = staffVacations.get(staff.id) || [];
        if (vacationList.length > 0) {
          return false;
        }

        // シフト未登録のスタッフを除外
        const shiftList = staffShifts.get(staff.id) || [];
        if (shiftList.length === 0) {
          return false;
        }

        // 指定曜日のシフトがないスタッフを除外
        const hasShiftToday = shiftList.some((s) => s.dayOfWeek === dayOfWeek2 && s.isActive);
        return hasShiftToday;
      });

      // フィルタリング後のスタッフを使用
      activeStaff.length = 0;
      activeStaff.push(...filteredStaff);

      // フィルタリング後にスタッフが0人の場合
      if (activeStaff.length === 0) {
        const slots: TimeSlot[] = allTimeSlots.map((time) => ({
          time,
          available: false,
        }));
        return successResponse<AvailableSlots>({ date, slots });
      }
    }

    const allReservations = await prisma.bookingReservation.findMany({
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

    // 指定日の曜日を取得（シフトチェック用）
    const dateObj = new Date(date);
    const dayOfWeekMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayOfWeekMap[dateObj.getDay()];

    // Check if any staff is available for each time slot
    const slots: TimeSlot[] = allTimeSlots.map((time) => {
      for (const [sid, reservations] of reservationsByStaff.entries()) {
        // シフト管理がONの場合、シフト内の時間かチェック
        if (enableShiftManagement) {
          const shifts = staffShifts.get(sid) || [];
          if (!isStaffWorkingAtTime(time, shifts, dayOfWeek)) {
            continue; // シフト外の時間はスキップ
          }
        }

        // 予約可能かチェック
        if (isSlotAvailable(time, reservations, menu.duration)) {
          return { time, available: true, staffId: sid };
        }
      }
      return { time, available: false };
    });

    return successResponse<AvailableSlots>({ date, slots });
  });
}
