'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import type { Menu, Staff, TimeSlot } from '@/types/api';

function BookingContent() {
  const searchParams = useSearchParams();
  const preselectedMenuId = searchParams.get('menuId');

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
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
    selectedMenuId &&
    selectedStaffId;

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const reservationData = {
        menuId: selectedMenuId,
        staffId: selectedStaffId,
        reservedDate: selectedDate.toISOString().split('T')[0],
        reservedTime: selectedTime,
        notes: notes || undefined,
      };

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Replace with actual authenticated user ID
          'x-user-id': 'temp-user-id',
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
            <h1 className="mb-2 text-3xl font-bold text-gray-900">予約カレンダー</h1>
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
                    <div className="grid grid-cols-7 gap-2">
                      {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
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
                    <div className="border-t pt-6">
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
                </Card>
              </div>

              {/* Booking Info Sidebar */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        日時
                      </label>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
                        {selectedDateStr}
                        <br />
                        <span className="text-gray-500">
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
