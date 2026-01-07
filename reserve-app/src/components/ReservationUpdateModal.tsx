'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Button from './Button';
import type { Reservation } from '@/types/api';

// 【パフォーマンス改善】定数をコンポーネント外に定義（毎レンダリングで再生成しない）
const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

// 時間帯生成（9:00-18:00、30分刻み）- 定数なのでコンポーネント外で1回だけ生成
const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) {break;}
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return slots;
})();

interface ReservationUpdateModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

interface Menu {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Staff {
  id: string;
  name: string;
}

export default function ReservationUpdateModal({
  reservation,
  onClose,
  onSuccess,
}: ReservationUpdateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [menus, setMenus] = useState<Menu[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [formData, setFormData] = useState({
    reservedDate: reservation.reservedDate,
    reservedTime: reservation.reservedTime,
    menuId: reservation.menuId,
    staffId: reservation.staffId,
    notes: reservation.notes || '',
  });

  // メニューとスタッフを取得
  useEffect(() => {
    fetchMenus();
    fetchStaff();
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus');
      const data = await response.json();
      if (data.success) {
        setMenus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      const data = await response.json();
      if (data.success) {
        setStaffList(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  // 【パフォーマンス改善】カレンダー日付をuseMemoでメモ化
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const days: (number | null)[] = [];

    // 空白を埋める
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 日付を追加
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [selectedYear, selectedMonth]);

  // 【パフォーマンス改善】今日の日付をuseMemoでメモ化（1回のみ計算）
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // 過去の日付かどうかを判定
  const isPastDate = useCallback((day: number) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    return date < today;
  }, [selectedYear, selectedMonth, today]);

  // 【パフォーマンス改善】日付選択をuseCallbackでメモ化
  const handleSelectDay = useCallback((day: number) => {
    if (isPastDate(day)) {return;}

    setSelectedDay(day);
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setFormData((prev) => ({ ...prev, reservedDate: dateStr }));
  }, [selectedYear, selectedMonth, isPastDate]);

  // 【パフォーマンス改善】時間帯選択をuseCallbackでメモ化
  const handleSelectTime = useCallback((time: string) => {
    setSelectedTime(time);
    setFormData((prev) => ({ ...prev, reservedTime: time }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Supabaseセッションは自動的にCookieで送信される
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '予約の変更に失敗しました');
      }

      setSuccessMessage('予約を更新しました');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の変更に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // calendarDays, TIME_SLOTS, WEEK_DAYS は上部で定義済み（パフォーマンス最適化済み）

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto" data-testid="reservation-update-modal">
      <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl my-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900" data-testid="modal-title">予約変更</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
            data-testid="close-button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800" data-testid="error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800" data-testid="success-message">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カレンダー */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              日付を選択
            </label>

            {/* 月選択 */}
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear(selectedYear - 1);
                  } else {
                    setSelectedMonth(selectedMonth - 1);
                  }
                }}
                className="rounded px-3 py-1 hover:bg-gray-100"
                data-testid="prev-month-button"
              >
                ←
              </button>
              <span className="font-semibold" data-testid="current-month">
                {selectedYear}年 {selectedMonth}月
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear(selectedYear + 1);
                  } else {
                    setSelectedMonth(selectedMonth + 1);
                  }
                }}
                className="rounded px-3 py-1 hover:bg-gray-100"
                data-testid="next-month-button"
              >
                →
              </button>
            </div>

            {/* カレンダーグリッド */}
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && handleSelectDay(day)}
                  disabled={!day || isPastDate(day)}
                  data-testid={day ? `calendar-day-${day}` : undefined}
                  className={`
                    aspect-square rounded p-2 text-sm
                    ${!day ? 'invisible' : ''}
                    ${day && isPastDate(day) ? 'text-gray-300 cursor-not-allowed' : ''}
                    ${day && !isPastDate(day) && selectedDay === day ? 'bg-blue-500 text-white' : ''}
                    ${day && !isPastDate(day) && selectedDay !== day ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {day || ''}
                </button>
              ))}
            </div>
          </div>

          {/* 時間帯選択 */}
          {selectedDay && (
            <div data-testid="time-selection-section">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                時間を選択
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleSelectTime(time)}
                    data-testid={`time-slot-${time}`}
                    className={`
                      rounded px-4 py-2 text-sm
                      ${selectedTime === time ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* メニュー選択 */}
          <div>
            <label htmlFor="menu" className="mb-1 block text-sm font-medium text-gray-700">
              メニュー
            </label>
            <select
              id="menu"
              value={formData.menuId}
              onChange={(e) => setFormData({ ...formData, menuId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              data-testid="menu-select"
              required
            >
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} - ¥{menu.price.toLocaleString()} ({menu.duration}分)
                </option>
              ))}
            </select>
          </div>

          {/* スタッフ選択 */}
          <div>
            <label htmlFor="staff" className="mb-1 block text-sm font-medium text-gray-700">
              担当スタッフ（任意）
            </label>
            <select
              id="staff"
              value={formData.staffId || ''}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              data-testid="staff-select"
            >
              <option value="">指定なし</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          {/* 備考 */}
          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              備考
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              data-testid="notes-input"
              rows={3}
              maxLength={500}
            />
            <p className="mt-1 text-sm text-gray-500" data-testid="notes-counter">{formData.notes.length}/500</p>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              キャンセル
            </Button>
            <Button type="submit" fullWidth disabled={isSubmitting} data-testid="submit-button">
              {isSubmitting ? '更新中...' : '予約を更新する'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
