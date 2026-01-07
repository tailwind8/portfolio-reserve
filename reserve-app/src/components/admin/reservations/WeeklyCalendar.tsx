'use client';

import Card from '@/components/Card';
import { isBreakTime } from '@/lib/time-utils';
import type { WeeklyCalendarProps } from './types';
import { BREAK_TIME_START, BREAK_TIME_END, isClosedDay, getBlockColor, formatDateString } from './utils';

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

/**
 * 週間カレンダーコンポーネント
 */
export default function WeeklyCalendar({
  weekDates,
  weekTitle,
  timeSlots,
  reservations,
  onPrevWeek,
  onNextWeek,
  onTimeBlockClick,
}: WeeklyCalendarProps) {
  return (
    <div data-testid="weekly-calendar">
      {/* 週ナビゲーション */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900" data-testid="week-title">
          {weekTitle}
        </h2>
        <div className="flex gap-2">
          <button
            data-testid="prev-week-button"
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

      {/* 週間カレンダーグリッド */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-sm font-semibold text-gray-600">時間</th>
                {DAY_LABELS.map((day, index) => {
                  const date = weekDates[index];
                  return (
                    <th key={day} className="border p-2 text-sm font-semibold text-gray-600">
                      {day}
                      <br />
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
                    const dateStr = formatDateString(date);

                    // 定休日の場合
                    if (isClosedDay(date)) {
                      return (
                        <td
                          key={dayIndex}
                          className="border p-1 bg-gray-100"
                          data-testid="closed-block"
                          data-day={dayIndex}
                          data-time={time}
                        >
                          <div className="text-xs text-gray-400 text-center py-3">[休]</div>
                        </td>
                      );
                    }

                    // 休憩時間の場合
                    if (isBreakTime(time, BREAK_TIME_START, BREAK_TIME_END)) {
                      return (
                        <td
                          key={dayIndex}
                          className="border p-1 bg-gray-100"
                          data-testid="break-block"
                          data-day={dayIndex}
                          data-time={time}
                        >
                          <div className="text-xs text-gray-400 text-center py-3">休憩時間</div>
                        </td>
                      );
                    }

                    // 予約を検索
                    const reservation = reservations.find(
                      (r) => r.reservedDate === dateStr && r.reservedTime === time
                    );

                    return (
                      <td key={dayIndex} className="border p-1">
                        <button
                          data-testid="time-block"
                          data-day={dayIndex}
                          data-time={time}
                          onClick={() => onTimeBlockClick(date, time)}
                          className={`w-full rounded px-2 py-3 text-xs transition-colors cursor-pointer ${getBlockColor(reservation || null)}`}
                        >
                          {reservation ? (
                            <>
                              <div className="font-bold">{reservation.customerName}</div>
                              <div className="text-xs">{reservation.menuName}</div>
                            </>
                          ) : (
                            <div className="text-green-700">[空]</div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
