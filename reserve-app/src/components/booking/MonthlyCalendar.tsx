'use client';

import type { TimeSlot } from '@/types/api';

interface MonthlyCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedMenuId: string;
  availableSlots: TimeSlot[];
  loadingSlots: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (day: number) => void;
  onTimeClick: (time: string, staffId?: string) => void;
}

export default function MonthlyCalendar({
  currentDate,
  selectedDate,
  selectedTime,
  selectedMenuId,
  availableSlots,
  loadingSlots,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  onTimeClick,
}: MonthlyCalendarProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays: (number | null)[] = [
    ...Array(startingDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthStr = `${year}年${month + 1}月`;
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${weekDays[selectedDate.getDay()]}）`
    : '日付未選択';

  return (
    <div data-testid="monthly-calendar">
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{monthStr}</h2>
          <div className="flex gap-2">
            <button
              onClick={onPrevMonth}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
            >
              ← 前月
            </button>
            <button
              onClick={onNextMonth}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
            >
              次月 →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2" data-testid="calendar-grid">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600" data-testid="calendar-weekday">
              {day}
            </div>
          ))}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }

            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);

            const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
            const isToday = date.getTime() === today.getTime();
            const isPast = date < today;

            return (
              <button
                key={day}
                onClick={() => onDateClick(day)}
                disabled={isPast}
                data-day={day}
                className={`
                  aspect-square rounded-lg p-2 text-sm font-medium transition-colors
                  ${isPast ? 'cursor-not-allowed text-gray-300' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${isToday && !isSelected ? 'border-2 border-blue-500 text-blue-500' : ''}
                  ${!isPast && !isSelected && !isToday ? 'hover:bg-blue-50 text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && selectedMenuId && (
        <div className="border-t pt-6" data-testid="time-slots-section">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            時間帯を選択（{selectedDateStr}）
          </h3>

          {loadingSlots && (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {!loadingSlots && availableSlots.length === 0 && (
            <p className="py-8 text-center text-gray-500">
              この日は予約できる時間がありません
            </p>
          )}

          {!loadingSlots && availableSlots.length > 0 && (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onTimeClick(slot.time, slot.staffId)}
                  disabled={!slot.available}
                  data-testid="time-slot"
                  className={`
                    rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                    ${selectedTime === slot.time ? 'bg-blue-500 text-white border-blue-500' : ''}
                    ${slot.available && selectedTime !== slot.time
                      ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                      : ''
                    }
                    ${!slot.available
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                      : ''
                    }
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedMenuId && (
        <div className="border-t pt-6">
          <p className="py-8 text-center text-gray-500">
            メニューを選択してください
          </p>
        </div>
      )}
    </div>
  );
}
