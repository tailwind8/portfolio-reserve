'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { Menu, Staff, TimeSlot } from '@/types/api';

function BookingContent() {
  const searchParams = useSearchParams();
  const preselectedMenuId = searchParams.get('menuId');

  // 機能フラグを取得
  const { flags: featureFlags } = useFeatureFlags();

  // State
  const [menus, setMenus] = useState<Menu[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(preselectedMenuId || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // 週間カレンダー用state
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // 月曜日を週の開始として計算
    const today = new Date();
    const day = today.getDay(); // 0 (日) ～ 6 (土)
    // 月曜日までの日数を計算
    const diff = (day === 0 ? -6 : 1) - day;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  });
  const [weeklySlots, setWeeklySlots] = useState<Map<string, TimeSlot[]>>(new Map());
  const [loadingWeeklySlots, setLoadingWeeklySlots] = useState(false);

  // 休憩時間設定（将来的にはAPIから取得）
  const breakTimeStart = '12:00';
  const breakTimeEnd = '13:00';

  // LocalStorageから表示モードを読み込む（初回のみ）
  useEffect(() => {
    const savedMode = localStorage.getItem('booking-calendar-view-mode');
    if (savedMode === 'monthly' || savedMode === 'weekly') {
      setViewMode(savedMode);
    }
  }, []);

  // viewModeが変更されたらLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('booking-calendar-view-mode', viewMode);
  }, [viewMode]);

  // Fetch menus and staff on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [menusRes, staffRes] = await Promise.all([
          fetch('/api/menus'),
          fetch('/api/staff'),
        ]);

        const [menusData, staffData] = await Promise.all([
          menusRes.json(),
          staffRes.json(),
        ]);

        if (!menusRes.ok) {
          throw new Error(menusData.message || 'メニューの取得に失敗しました');
        }
        if (!staffRes.ok) {
          throw new Error(staffData.message || 'スタッフの取得に失敗しました');
        }

        setMenus(menusData.data);
        setStaff(staffData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch available slots when date and menu are selected
  useEffect(() => {
    if (!selectedDate || !selectedMenuId) {
      setAvailableSlots([]);
      return;
    }

    async function fetchSlots() {
      if (!selectedDate) return;
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const params = new URLSearchParams({
          date: dateStr,
          menuId: selectedMenuId,
        });

        if (selectedStaffId) {
          params.append('staffId', selectedStaffId);
        }

        const response = await fetch(`/api/available-slots?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '空き時間の取得に失敗しました');
        }

        setAvailableSlots(data.data.slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, selectedMenuId, selectedStaffId]);

  // 週間カレンダー用の空き時間データを取得
  useEffect(() => {
    if (viewMode !== 'weekly' || !selectedMenuId) {
      setWeeklySlots(new Map());
      return;
    }

    async function fetchWeeklySlots() {
      setLoadingWeeklySlots(true);
      try {
        const weekDates = getWeekDates(currentWeekStart);
        const promises = weekDates.map(async (date) => {
          const dateStr = date.toISOString().split('T')[0];
          const params = new URLSearchParams({
            date: dateStr,
            menuId: selectedMenuId,
          });

          if (selectedStaffId) {
            params.append('staffId', selectedStaffId);
          }

          const response = await fetch(`/api/available-slots?${params}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || '空き時間の取得に失敗しました');
          }

          return { dateStr, slots: data.data.slots };
        });

        const results = await Promise.all(promises);
        const slotsMap = new Map<string, TimeSlot[]>();
        results.forEach(({ dateStr, slots }) => {
          slotsMap.set(dateStr, slots);
        });

        setWeeklySlots(slotsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
        setWeeklySlots(new Map());
      } finally {
        setLoadingWeeklySlots(false);
      }
    }

    fetchWeeklySlots();
  }, [currentWeekStart, selectedMenuId, selectedStaffId, viewMode]);

  // 週間カレンダー用ヘルパー関数

  // 週の範囲テキストを生成（例: "2026/01/06 - 2026/01/12"）
  function getWeekRangeText(weekStart: Date): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return `${weekStart.getFullYear()}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}/${weekStart.getDate().toString().padStart(2, '0')} - ${weekEnd.getFullYear()}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}/${weekEnd.getDate().toString().padStart(2, '0')}`;
  }

  // 7日分の日付配列を生成
  function getWeekDates(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  }

  // 休憩時間かどうかを判定
  function isBreakTime(time: string): boolean {
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    const [breakStartHour, breakStartMinute] = breakTimeStart.split(':').map(Number);
    const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

    const [breakEndHour, breakEndMinute] = breakTimeEnd.split(':').map(Number);
    const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
  }

  // 時間スロットを生成（30分刻み）
  function generateTimeSlots(openTime: string, closeTime: string): string[] {
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    const slots: string[] = [];
    const startMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  }

  // Calendar utilities
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
  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${
        ['日', '月', '火', '水', '木', '金', '土'][selectedDate.getDay()]
      }）`
    : '日付未選択';

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);

    if (date >= today) {
      setSelectedDate(date);
      setSelectedTime(null); // Reset selected time when date changes
    }
  };

  const handleTimeClick = (time: string, staffId?: string) => {
    setSelectedTime(time);
    if (staffId && !selectedStaffId) {
      setSelectedStaffId(staffId);
    }
  };

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);

  const isFormValid =
    selectedDate &&
    selectedTime &&
    selectedMenuId;

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const reservationData = {
        menuId: selectedMenuId,
        staffId: selectedStaffId || undefined, // 指名なしの場合はundefined
        reservedDate: selectedDate.toISOString().split('T')[0],
        reservedTime: selectedTime,
        notes: notes || undefined,
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Replace with actual authenticated user ID
          // 暫定的にシードデータの最初のユーザーID（山田 太郎）を使用
          'x-user-id': '550e8400-e29b-41d4-a716-446655440031',
        },
        body: JSON.stringify(reservationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '予約の作成に失敗しました');
      }

      setSuccess(true);
      // Reset form after successful submission
      setTimeout(() => {
        setSelectedDate(null);
        setSelectedTime(null);
        setSelectedMenuId('');
        setSelectedStaffId('');
        setNotes('');
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の作成中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900" data-testid="booking-title">予約カレンダー</h1>
            <p className="text-gray-600">ご希望の日時を選択してください</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-3 text-red-700">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            </Card>
          )}

          {/* Success State */}
          {success && (
            <Card className="mb-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3 text-green-700">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>予約が完了しました。確認メールをお送りしましたのでご確認ください。</p>
              </div>
            </Card>
          )}

          {!loading && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Calendar Section */}
              <div className="lg:col-span-2">
                <Card>
                  {/* 表示モード切り替えタブ */}
                  <div className="mb-6 flex gap-2 border-b">
                    <button
                      data-testid="view-mode-tab-weekly"
                      onClick={() => setViewMode('weekly')}
                      className={`px-4 py-2 font-medium transition-colors ${
                        viewMode === 'weekly'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      週間
                    </button>
                    <button
                      data-testid="view-mode-tab-monthly"
                      onClick={() => setViewMode('monthly')}
                      className={`px-4 py-2 font-medium transition-colors ${
                        viewMode === 'monthly'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      月間
                    </button>
                  </div>

                  {/* 月間カレンダー（既存） */}
                  {viewMode === 'monthly' && (
                    <div data-testid="monthly-calendar">
                      <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-900">{monthStr}</h2>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevMonth}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                        >
                          ← 前月
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                        >
                          次月 →
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2" data-testid="calendar-grid">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
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

                        const isSelected =
                          selectedDate &&
                          date.getTime() === selectedDate.getTime();
                        const isToday = date.getTime() === today.getTime();
                        const isPast = date < today;

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateClick(day)}
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

                  {/* Time Slots */}
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
                              onClick={() => slot.available && handleTimeClick(slot.time, slot.staffId)}
                              disabled={!slot.available}
                              data-testid="time-slot"
                              className={`
                                rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                                ${selectedTime === slot.time ? 'bg-blue-500 text-white border-blue-500' : ''}
                                ${
                                  slot.available && selectedTime !== slot.time
                                    ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                                    : ''
                                }
                                ${
                                  !slot.available
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
                  )}

                  {/* 週間カレンダー */}
                  {viewMode === 'weekly' && (
                    <div data-testid="weekly-calendar">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900" data-testid="week-range-title">
                          {getWeekRangeText(currentWeekStart)}
                        </h2>
                        <div className="flex gap-2">
                          <button
                            data-testid="previous-week-button"
                            onClick={() => {
                              const newWeekStart = new Date(currentWeekStart);
                              newWeekStart.setDate(currentWeekStart.getDate() - 7);
                              setCurrentWeekStart(newWeekStart);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                          >
                            ← 前週
                          </button>
                          <button
                            data-testid="next-week-button"
                            onClick={() => {
                              const newWeekStart = new Date(currentWeekStart);
                              newWeekStart.setDate(currentWeekStart.getDate() + 7);
                              setCurrentWeekStart(newWeekStart);
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                          >
                            次週 →
                          </button>
                        </div>
                      </div>

                      {/* Loading State */}
                      {loadingWeeklySlots && (
                        <div className="flex justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}

                      {/* Weekly Calendar Grid */}
                      {!loadingWeeklySlots && selectedMenuId && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="border p-2 text-sm font-semibold text-gray-600">時間</th>
                                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                                  const date = getWeekDates(currentWeekStart)[index];
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
                              {generateTimeSlots('09:00', '20:00').map((time) => (
                                <tr key={time}>
                                  <td className="border p-2 text-sm font-medium text-gray-700">{time}</td>
                                  {getWeekDates(currentWeekStart).map((date, dayIndex) => {
                                    // 休憩時間の場合は専用セルを表示
                                    if (isBreakTime(time)) {
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

                                    return (
                                      <td key={dayIndex} className="border p-1">
                                        <button
                                          data-testid="weekly-time-block"
                                          data-day={dayIndex}
                                          data-time={time}
                                          disabled={!isAvailable || isPast}
                                          onClick={() => {
                                            if (isAvailable && !isPast) {
                                              setSelectedDate(date);
                                              setSelectedTime(time);
                                              if (slot?.staffId && !selectedStaffId) {
                                                setSelectedStaffId(slot.staffId);
                                              }
                                            }
                                          }}
                                          className={`
                                            w-full rounded px-2 py-3 text-xs transition-colors
                                            ${isAvailable && !isPast ? 'bg-green-100 hover:bg-green-200 cursor-pointer' : ''}
                                            ${!isAvailable || isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                                            ${selectedDate?.toISOString().split('T')[0] === dateStr && selectedTime === time ? 'ring-2 ring-blue-500' : ''}
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

                      {/* No Menu Selected */}
                      {!selectedMenuId && (
                        <div className="py-8 text-center text-gray-500">
                          メニューを選択してください
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Booking Info Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24" data-testid="booking-info-sidebar">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        日時
                      </label>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
                        <span data-testid="selected-date">{selectedDateStr}</span>
                        <br />
                        <span className="text-gray-500" data-testid="selected-time">
                          {selectedTime || '時間未選択'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="menu" className="mb-1 block text-sm font-medium text-gray-700">
                        メニュー
                      </label>
                      <select
                        id="menu"
                        value={selectedMenuId}
                        onChange={(e) => {
                          setSelectedMenuId(e.target.value);
                          setSelectedTime(null);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">選択してください</option>
                        {menus.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}（{menu.duration}分）¥{menu.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* スタッフ選択（機能フラグで制御） */}
                    {featureFlags?.enableStaffSelection && (
                      <div>
                        <label htmlFor="staff" className="mb-1 block text-sm font-medium text-gray-700">
                          担当者
                        </label>
                        <select
                          id="staff"
                          value={selectedStaffId}
                          onChange={(e) => {
                            setSelectedStaffId(e.target.value);
                            setSelectedTime(null);
                          }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">指名なし</option>
                          {staff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.role && `（${s.role}）`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
                        備考・ご要望（任意）
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="特別なご要望があればご記入ください"
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">{notes.length}/500文字</p>
                    </div>

                    {/* クーポン入力（機能フラグで制御） */}
                    {featureFlags?.enableCouponFeature && (
                      <div>
                        <label htmlFor="coupon" className="mb-1 block text-sm font-medium text-gray-700">
                          クーポンコード（任意）
                        </label>
                        <input
                          id="coupon"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="クーポンコードを入力"
                          maxLength={50}
                          data-testid="coupon-input"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {selectedMenu && (
                      <div className="border-t pt-4">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-gray-600">料金</span>
                          <span className="font-semibold text-gray-900">
                            ¥{selectedMenu.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="mb-4 flex justify-between text-sm">
                          <span className="text-gray-600">所要時間</span>
                          <span className="font-semibold text-gray-900">{selectedMenu.duration}分</span>
                        </div>
                      </div>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      disabled={!isFormValid || submitting}
                      onClick={handleSubmit}
                      data-testid="submit-button"
                    >
                      {submitting ? '予約中...' : '予約を確定する'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      ※予約確定後、確認メールをお送りします
                    </p>
                  </div>
                </Card>

                {/* Notice */}
                <Card className="mt-4" padding="sm">
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">予約のキャンセル・変更</p>
                      <p>予約日の前日まで可能です。マイページから変更できます。</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Features */}
          {!loading && (
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Card padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-gray-900">24時間予約OK</h4>
                    <p className="text-xs text-gray-600">いつでもオンラインで予約できます</p>
                  </div>
                </div>
              </Card>

              <Card padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-gray-900">確認メール送信</h4>
                    <p className="text-xs text-gray-600">予約確定後すぐに送信されます</p>
                  </div>
                </div>
              </Card>

              <Card padding="sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-gray-900">リマインダー</h4>
                    <p className="text-xs text-gray-600">予約日前日にメールでお知らせ</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
