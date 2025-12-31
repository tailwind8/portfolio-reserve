'use client';

import { useState, useEffect } from 'react';
import type { Reservation, Menu, Staff, TimeSlot } from '@/types/api';

interface ReservationEditModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * ReservationEditModal - 予約変更モーダル
 *
 * @param reservation - 編集対象の予約データ
 * @param onClose - モーダルを閉じるコールバック
 * @param onSuccess - 編集成功時のコールバック
 */
export default function ReservationEditModal({
  reservation,
  onClose,
  onSuccess,
}: ReservationEditModalProps) {
  // State
  const [menus, setMenus] = useState<Menu[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state - 初期値は既存の予約データ
  const initialDate = new Date(reservation.reservedDate);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(reservation.reservedTime);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(reservation.menuId);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(reservation.staffId);
  const [notes, setNotes] = useState(reservation.notes || '');

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

  const isFormValid = selectedDate && selectedTime && selectedMenuId && selectedStaffId;

  const handleSubmit = async () => {
    if (!isFormValid || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const updateData = {
        menuId: selectedMenuId,
        staffId: selectedStaffId,
        reservedDate: selectedDate.toISOString().split('T')[0],
        reservedTime: selectedTime,
        notes: notes || undefined,
      };

      // TODO: 実際の認証実装後は、セッションからユーザーIDを取得
      const userId = 'mock-user-id';

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || '予約の更新に失敗しました');
      }

      alert('予約を更新しました');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の更新中にエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
        {/* ヘッダー */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">予約変更</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* エラー表示 */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3 text-red-700">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* カレンダーセクション */}
              <div className="lg:col-span-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">{monthStr}</h3>
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

                    {/* カレンダーグリッド */}
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

                        const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
                        const isToday = date.getTime() === today.getTime();
                        const isPast = date < today;

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={isPast}
                            className={`rounded-lg p-2 text-center text-sm transition-colors ${
                              isSelected
                                ? 'bg-blue-500 font-bold text-white'
                                : isToday
                                  ? 'border-2 border-blue-500 bg-white text-blue-600 font-semibold'
                                  : isPast
                                    ? 'cursor-not-allowed text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* タイムスロット */}
                  {selectedDate && selectedMenuId && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">時間帯を選択</h3>
                      {loadingSlots ? (
                        <div className="flex justify-center py-8">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="py-4 text-center text-gray-500">
                          この日は予約できる時間がありません
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => handleTimeClick(slot.time, slot.staffId)}
                              disabled={!slot.available}
                              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                selectedTime === slot.time
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : slot.available
                                    ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 予約情報サイドバー */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h3>

                  <div className="space-y-4">
                    {/* メニュー選択 */}
                    <div>
                      <label htmlFor="menu" className="mb-2 block text-sm font-medium text-gray-700">
                        メニュー
                      </label>
                      <select
                        id="menu"
                        value={selectedMenuId}
                        onChange={(e) => {
                          setSelectedMenuId(e.target.value);
                          setSelectedTime(null);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">選択してください</option>
                        {menus.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name} (¥{menu.price.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* スタッフ選択 */}
                    <div>
                      <label htmlFor="staff" className="mb-2 block text-sm font-medium text-gray-700">
                        担当者（任意）
                      </label>
                      <select
                        id="staff"
                        value={selectedStaffId}
                        onChange={(e) => {
                          setSelectedStaffId(e.target.value);
                          setSelectedTime(null);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">指定なし</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 備考 */}
                    <div>
                      <label htmlFor="notes" className="mb-2 block text-sm font-medium text-gray-700">
                        備考（任意）
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={500}
                        placeholder="ご要望などがあればご記入ください"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">{notes.length}/500文字</p>
                    </div>
                  </div>

                  {/* 送信ボタン */}
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || submitting}
                    className={`mt-6 w-full rounded-lg px-6 py-3 font-semibold text-white transition-colors ${
                      isFormValid && !submitting
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'cursor-not-allowed bg-gray-300'
                    }`}
                  >
                    {submitting ? '更新中...' : '予約を更新する'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
