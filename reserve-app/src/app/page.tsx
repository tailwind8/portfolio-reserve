'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertCard } from '@/components/AlertCard';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { getWeekDates } from '@/lib/calendar-utils';
import { MonthlyCalendar, WeeklyCalendar, BookingSidebar, BookingFeatures } from '@/components/booking';
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

  // カレンダー用の値
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // イベントハンドラー
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const handleDateClick = useCallback((day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (date >= today) {
      setSelectedDate(date);
      setSelectedTime(null);
    }
  }, [year, month, today]);

  const handleTimeClick = useCallback((time: string, staffId?: string) => {
    setSelectedTime(time);
    if (staffId && !selectedStaffId) {
      setSelectedStaffId(staffId);
    }
  }, [selectedStaffId]);

  const handlePrevWeek = useCallback(() => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  }, [currentWeekStart]);

  const handleNextWeek = useCallback(() => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  }, [currentWeekStart]);

  const handleWeeklySlotClick = useCallback((date: Date, time: string, staffId?: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    if (staffId) {
      setSelectedStaffId(staffId);
    }
  }, []);

  const handleMenuChange = useCallback((menuId: string) => {
    setSelectedMenuId(menuId);
    setSelectedTime(null);
  }, []);

  const handleStaffChange = useCallback((staffId: string) => {
    setSelectedStaffId(staffId);
    setSelectedTime(null);
  }, []);

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
      if (!selectedDate) {return;}
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

  const isFormValid = selectedDate && selectedTime && selectedMenuId;

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDate || !selectedTime) {return;}

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

      // Supabaseセッションは自動的にCookieで送信される
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          {loading && <LoadingSpinner />}

          {/* Error State */}
          {error && <AlertCard type="error" message={error} className="mb-4" />}

          {/* Success State */}
          {success && (
            <AlertCard
              type="success"
              message="予約が完了しました。確認メールをお送りしましたのでご確認ください。"
              className="mb-4"
            />
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

                  {viewMode === 'monthly' && (
                    <MonthlyCalendar
                      currentDate={currentDate}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      selectedMenuId={selectedMenuId}
                      availableSlots={availableSlots}
                      loadingSlots={loadingSlots}
                      onPrevMonth={handlePrevMonth}
                      onNextMonth={handleNextMonth}
                      onDateClick={handleDateClick}
                      onTimeClick={handleTimeClick}
                    />
                  )}

                  {viewMode === 'weekly' && (
                    <WeeklyCalendar
                      currentWeekStart={currentWeekStart}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      selectedMenuId={selectedMenuId}
                      selectedStaffId={selectedStaffId}
                      weeklySlots={weeklySlots}
                      loadingWeeklySlots={loadingWeeklySlots}
                      breakTimeStart={breakTimeStart}
                      breakTimeEnd={breakTimeEnd}
                      onPrevWeek={handlePrevWeek}
                      onNextWeek={handleNextWeek}
                      onSlotClick={handleWeeklySlotClick}
                    />
                  )}
                </Card>
              </div>

              {/* Booking Info Sidebar */}
              <div className="lg:col-span-1">
                <BookingSidebar
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  selectedMenuId={selectedMenuId}
                  selectedStaffId={selectedStaffId}
                  notes={notes}
                  couponCode={couponCode}
                  menus={menus}
                  staff={staff}
                  featureFlags={featureFlags}
                  submitting={submitting}
                  onMenuChange={handleMenuChange}
                  onStaffChange={handleStaffChange}
                  onNotesChange={setNotes}
                  onCouponChange={setCouponCode}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          )}

          {!loading && <BookingFeatures />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
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
