'use client';

import { isBreakTime, generateTimeSlots } from '@/lib/time-utils';
import { getWeekDates, getWeekRangeText } from '@/lib/calendar-utils';
import type { TimeSlot } from '@/types/api';

interface WeeklyCalendarProps {
  currentWeekStart: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedMenuId: string;
  selectedStaffId: string;
  weeklySlots: Map<string, TimeSlot[]>;
  loadingWeeklySlots: boolean;
  breakTimeStart: string;
  breakTimeEnd: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSlotClick: (date: Date, time: string, staffId?: string) => void;
}

const WEEK_DAYS = ['月', '火', '水', '木', '金', '土', '日'];

export default function WeeklyCalendar({
  currentWeekStart,
  selectedDate,
  selectedTime,
  selectedMenuId,
  selectedStaffId,
  weeklySlots,
  loadingWeeklySlots,
  breakTimeStart,
  breakTimeEnd,
  onPrevWeek,
  onNextWeek,
  onSlotClick,
}: WeeklyCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDates = getWeekDates(currentWeekStart);
  const timeSlots = generateTimeSlots('09:00', '20:00');

  return (
    <div data-testid="weekly-calendar">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900" data-testid="week-range-title">
          {getWeekRangeText(currentWeekStart)}
        </h2>
        <div className="flex gap-2">
          <button
            data-testid="previous-week-button"
            onClick={onPrevWeek}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          >
            ← 前週
          </button>
          <button
            data-testid="next-week-button"
            onClick={onNextWeek}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          >
            次週 →
          </button>
        </div>
      </div>

      {loadingWeeklySlots && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {!loadingWeeklySlots && selectedMenuId && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-sm font-semibold text-gray-600">時間</th>
                {WEEK_DAYS.map((day, index) => {
                  const date = weekDates[index];
                  return (
                    <th key={day} className="border p-2 text-sm font-semibold text-gray-600">
                      {day}<br />
                      <span className="text-xs text-gray-500">
                        {date.getMonth() + 1}/{date.getDate()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="border p-2 text-sm font-medium text-gray-700">{time}</td>
                  {weekDates.map((date, dayIndex) => {
                    if (isBreakTime(time, breakTimeStart, breakTimeEnd)) {
                      return (
                        <td key={dayIndex} className="border p-1 bg-gray-200" data-testid="break-time-block" data-time={time}>
                          <div className="text-xs text-gray-500 text-center py-3">
                            {time} 休憩時間
                          </div>
                        </td>
                      );
                    }

                    const dateStr = date.toISOString().split('T')[0];
                    const slots = weeklySlots.get(dateStr) || [];
                    const slot = slots.find((s) => s.time === time);
                    const isAvailable = slot?.available ?? false;
                    const isPast = date < today;
                    const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr && selectedTime === time;

                    return (
                      <td key={dayIndex} className="border p-1">
                        <button
                          data-testid="weekly-time-block"
                          data-day={dayIndex}
                          data-time={time}
                          disabled={!isAvailable || isPast}
                          onClick={() => {
                            if (isAvailable && !isPast) {
                              onSlotClick(date, time, slot?.staffId && !selectedStaffId ? slot.staffId : undefined);
                            }
                          }}
                          className={`
                            w-full rounded px-2 py-3 text-xs transition-colors
                            ${isAvailable && !isPast ? 'bg-green-100 hover:bg-green-200 cursor-pointer' : ''}
                            ${!isAvailable || isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                            ${isSelected ? 'ring-2 ring-blue-500' : ''}
                          `}
                        >
                          {isAvailable && !isPast ? '○' : '×'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!selectedMenuId && (
        <div className="py-8 text-center text-gray-500">
          メニューを選択してください
        </div>
      )}
    </div>
  );
}
