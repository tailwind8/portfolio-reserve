'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { isBreakTime } from '@/lib/time-utils';

interface Reservation {
  id: string;
  reservedDate: string;
  reservedTime: string;
  customerName: string;
  menuName: string;
  staffName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  menuId?: string;
  staffId?: string;
}

interface ReservationFormData {
  customer?: string;
  menu: string;
  staff: string;
  date: string;
  time: string;
  status?: Reservation['status'];
  notes?: string;
}

// 営業時間設定
const OPENING_TIME = '09:00';
const CLOSING_TIME = '20:00';
const BREAK_TIME_START = '12:00';
const BREAK_TIME_END = '13:00';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 表示モード（一覧 or カレンダー）
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // モーダル・ダイアログの状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // 新規予約モーダル用の初期値（カレンダーから選択した日時）
  const [prefilledDate, setPrefilledDate] = useState<string>('');
  const [prefilledTime, setPrefilledTime] = useState<string>('');

  // フィルター・検索（一覧表示用）
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // カレンダー表示用フィルター
  const [staffFilterCalendar, setStaffFilterCalendar] = useState('all');
  const [menuFilterCalendar, setMenuFilterCalendar] = useState('all');
  const [statusFilterCalendar, setStatusFilterCalendar] = useState('all');

  // 週間カレンダー用state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    // 2026-01-06（月曜日）を基準とする
    const baseDate = new Date('2026-01-06');
    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
  });

  // LocalStorageから表示モードを読み込む（初回のみ）
  useEffect(() => {
    const savedMode = localStorage.getItem('adminReservationsViewMode');
    if (savedMode === 'calendar' || savedMode === 'list') {
      setViewMode(savedMode);
    }
  }, []);

  // viewModeが変更されたらLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('adminReservationsViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reservations');
      const result = await response.json();

      if (result.success) {
        setReservations(result.data);
      } else {
        setError(result.error?.message || result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Reservations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReservation = () => {
    setPrefilledDate('');
    setPrefilledTime('');
    setShowAddModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDeleteDialog(true);
  };

  const handleShowDetail = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setShowDetailModal(false);
    setSelectedReservation(null);
    setPrefilledDate('');
    setPrefilledTime('');
  };

  const submitAddReservation = async (formData: ReservationFormData) => {
    try {
      if (!formData.customer || !formData.menu || !formData.staff || !formData.date || !formData.time) {
        throw new Error('必須項目を入力してください');
      }

      const response = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を追加しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(result.error || '予約の追加に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  const submitEditReservation = async (formData: ReservationFormData) => {
    try {
      if (!selectedReservation) return;

      const response = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を更新しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(result.error || '予約の更新に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  const confirmDelete = async () => {
    try {
      if (!selectedReservation) return;

      const response = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を削除しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(result.error || '予約の削除に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  const statusBadge = (status: Reservation['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      NO_SHOW: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      PENDING: '保留',
      CONFIRMED: '確定',
      CANCELLED: 'キャンセル',
      COMPLETED: '完了',
      NO_SHOW: '無断キャンセル',
    };
    return (
      <span
        data-testid="reservation-status"
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // 週間カレンダー用ヘルパー関数

  // 週の範囲テキストを生成
  const weekTitle = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    return `${currentWeekStart.getFullYear()}年${currentWeekStart.getMonth() + 1}月${currentWeekStart.getDate()}日 〜 ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
  }, [currentWeekStart]);

  // 7日分の日付配列を生成
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      return date;
    });
  }, [currentWeekStart]);

  // 時間スロットを生成（30分刻み）
  const timeSlots = useMemo(() => {
    const [openHour, openMinute] = OPENING_TIME.split(':').map(Number);
    const [closeHour, closeMinute] = CLOSING_TIME.split(':').map(Number);

    const slots: string[] = [];
    const startMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return slots;
  }, []);

  // 定休日かどうかを判定（日曜日を定休日とする）
  const isClosedDay = (date: Date): boolean => {
    return date.getDay() === 0; // 0 = 日曜日
  };

  // タイムブロックの色を取得
  const getBlockColor = (reservation: Reservation | null): string => {
    if (!reservation) return 'bg-green-100 text-green-800';

    switch (reservation.status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // カレンダー表示用にフィルタリングされた予約
  const filteredReservationsCalendar = useMemo(() => {
    return reservations.filter((reservation) => {
      if (staffFilterCalendar !== 'all' && reservation.staffId !== staffFilterCalendar) return false;
      if (menuFilterCalendar !== 'all' && reservation.menuId !== menuFilterCalendar) return false;
      if (statusFilterCalendar !== 'all' && reservation.status !== statusFilterCalendar.toUpperCase()) return false;
      return true;
    });
  }, [reservations, staffFilterCalendar, menuFilterCalendar, statusFilterCalendar]);

  // 一覧表示用にフィルタリングされた予約
  const filteredReservations = reservations.filter((reservation) => {
    if (statusFilter !== 'all' && reservation.status !== statusFilter.toUpperCase()) {
      return false;
    }

    if (searchQuery && !reservation.customerName.includes(searchQuery)) {
      return false;
    }

    if (dateRangeFilter === 'this-week') {
      // TODO: 今週の予約のみフィルタリング実装
    }

    return true;
  });

  // スタッフとメニューのユニークリストを取得（フィルター用）
  const uniqueStaff = useMemo(() => {
    const staffMap = new Map<string, string>();
    reservations.forEach((r) => {
      if (r.staffId && r.staffName) {
        staffMap.set(r.staffId, r.staffName);
      }
    });
    return Array.from(staffMap.entries()).map(([id, name]) => ({ id, name }));
  }, [reservations]);

  const uniqueMenus = useMemo(() => {
    const menuMap = new Map<string, string>();
    reservations.forEach((r) => {
      if (r.menuId && r.menuName) {
        menuMap.set(r.menuId, r.menuName);
      }
    });
    return Array.from(menuMap.entries()).map(([id, name]) => ({ id, name }));
  }, [reservations]);

  // 週のナビゲーション
  const handlePrevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  // タイムブロッククリック処理
  const handleTimeBlockClick = (date: Date, time: string) => {
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

    // その日時に予約があるかチェック
    const reservation = filteredReservationsCalendar.find(
      (r) => r.reservedDate === dateStr && r.reservedTime === time
    );

    if (reservation) {
      // 予約詳細モーダルを表示
      handleShowDetail(reservation);
    } else {
      // 空き時間 → 新規予約モーダルを表示（日時を自動入力）
      setPrefilledDate(dateStr);
      setPrefilledTime(time);
      setShowAddModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">
              読み込み中...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div data-testid="error-message" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
          <Button data-testid="retry-button" onClick={fetchReservations} className="mt-4">
            再試行
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            予約一覧
          </h1>
          <Button data-testid="add-reservation-button" variant="primary" onClick={handleAddReservation}>
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新規予約を追加
          </Button>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <div data-testid="success-message" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            {successMessage}
          </div>
        )}

        {/* 表示切り替えタブ */}
        <div className="mb-6 flex gap-2 border-b">
          <button
            data-testid="list-view-tab"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'list'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            一覧表示
          </button>
          <button
            data-testid="calendar-view-tab"
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            カレンダー表示
          </button>
        </div>

        {/* 一覧表示 */}
        {viewMode === 'list' && (
          <>
            {/* フィルター・検索 */}
            <Card className="mb-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
                  <select
                    data-testid="status-filter"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">すべて</option>
                    <option value="confirmed">確定</option>
                    <option value="pending">保留</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">日付範囲</label>
                  <select
                    data-testid="date-range-filter"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                  >
                    <option value="all">すべて</option>
                    <option value="this-week">今週</option>
                    <option value="this-month">今月</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">顧客名で検索</label>
                  <input
                    type="text"
                    data-testid="search-box"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="顧客名を入力..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            {/* 予約一覧テーブル */}
            <Card>
              {filteredReservations.length === 0 ? (
                <div className="py-12 text-center">
                  <p data-testid="empty-message" className="text-gray-500">
                    予約がありません
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table data-testid="reservations-table" className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">予約日時</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">顧客名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">メニュー</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">スタッフ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">ステータス</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReservations.map((reservation) => (
                        <tr key={reservation.id} data-testid="reservation-row" className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div data-testid="reservation-date" className="text-sm font-medium text-gray-900">
                              {reservation.reservedDate}
                            </div>
                            <div data-testid="reservation-time" className="text-sm text-gray-500">
                              {reservation.reservedTime}
                            </div>
                          </td>
                          <td data-testid="reservation-customer" className="px-4 py-3 text-sm text-gray-900">
                            {reservation.customerName}
                          </td>
                          <td data-testid="reservation-menu" className="px-4 py-3 text-sm text-gray-900">
                            {reservation.menuName}
                          </td>
                          <td data-testid="reservation-staff" className="px-4 py-3 text-sm text-gray-900">
                            {reservation.staffName}
                          </td>
                          <td className="px-4 py-3">{statusBadge(reservation.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                data-testid="edit-button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReservation(reservation)}
                              >
                                編集
                              </Button>
                              <Button
                                data-testid="delete-button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteReservation(reservation)}
                              >
                                削除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* カレンダー表示 */}
        {viewMode === 'calendar' && (
          <div data-testid="weekly-calendar">
            {/* 週ナビゲーション */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900" data-testid="week-title">
                {weekTitle}
              </h2>
              <div className="flex gap-2">
                <button
                  data-testid="prev-week-button"
                  onClick={handlePrevWeek}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                >
                  ← 前週
                </button>
                <button
                  data-testid="next-week-button"
                  onClick={handleNextWeek}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                >
                  次週 →
                </button>
              </div>
            </div>

            {/* フィルター */}
            <Card className="mb-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">スタッフ</label>
                  <select
                    data-testid="staff-filter"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={staffFilterCalendar}
                    onChange={(e) => setStaffFilterCalendar(e.target.value)}
                  >
                    <option value="all">全スタッフ</option>
                    {uniqueStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">メニュー</label>
                  <select
                    data-testid="menu-filter"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={menuFilterCalendar}
                    onChange={(e) => setMenuFilterCalendar(e.target.value)}
                  >
                    <option value="all">全メニュー</option>
                    {uniqueMenus.map((menu) => (
                      <option key={menu.id} value={menu.id}>
                        {menu.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
                  <select
                    data-testid="status-filter-calendar"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={statusFilterCalendar}
                    onChange={(e) => setStatusFilterCalendar(e.target.value)}
                  >
                    <option value="all">全ステータス</option>
                    <option value="confirmed">確定済み</option>
                    <option value="pending">保留中</option>
                    <option value="cancelled">キャンセル済み</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 週間カレンダーグリッド */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-sm font-semibold text-gray-600">時間</th>
                      {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
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
                          const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

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
                          const reservation = filteredReservationsCalendar.find(
                            (r) => r.reservedDate === dateStr && r.reservedTime === time
                          );

                          return (
                            <td key={dayIndex} className="border p-1">
                              <button
                                data-testid="time-block"
                                data-day={dayIndex}
                                data-time={time}
                                onClick={() => handleTimeBlockClick(date, time)}
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
        )}

        {/* 新規予約追加モーダル */}
        {showAddModal && (
          <AddReservationModal
            onClose={closeModals}
            onSubmit={submitAddReservation}
            prefilledDate={prefilledDate}
            prefilledTime={prefilledTime}
          />
        )}

        {/* 予約編集モーダル */}
        {showEditModal && selectedReservation && (
          <EditReservationModal
            reservation={selectedReservation}
            onClose={closeModals}
            onSubmit={submitEditReservation}
          />
        )}

        {/* 削除確認ダイアログ */}
        {showDeleteDialog && selectedReservation && (
          <DeleteConfirmationDialog
            reservation={selectedReservation}
            onClose={closeModals}
            onConfirm={confirmDelete}
          />
        )}

        {/* 予約詳細モーダル */}
        {showDetailModal && selectedReservation && (
          <ReservationDetailModal
            reservation={selectedReservation}
            onClose={closeModals}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onCancel={() => {
              // キャンセル処理（ステータスをCANCELLEDに変更）
              submitEditReservation({
                menu: selectedReservation.menuName,
                staff: selectedReservation.staffName,
                date: selectedReservation.reservedDate,
                time: selectedReservation.reservedTime,
                status: 'CANCELLED',
                notes: selectedReservation.notes,
              });
            }}
          />
        )}
      </main>
    </div>
  );
}

// ===== モーダルコンポーネント =====

function AddReservationModal({
  onClose,
  onSubmit,
  prefilledDate = '',
  prefilledTime = '',
}: {
  onClose: () => void;
  onSubmit: (data: ReservationFormData) => void;
  prefilledDate?: string;
  prefilledTime?: string;
}) {
  const [formData, setFormData] = useState({
    customer: '',
    menu: '',
    staff: '',
    date: prefilledDate,
    time: prefilledTime,
    notes: '',
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    if (!formData.customer || !formData.menu || !formData.staff || !formData.date || !formData.time) {
      setValidationError('必須項目を入力してください');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div data-testid="add-reservation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="add-modal-title" className="mb-6 text-2xl font-bold">
          新規予約を追加
        </h2>

        {validationError && (
          <div data-testid="add-modal-validation-error" className="mb-4 rounded bg-red-50 p-3 text-red-800">
            {validationError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">顧客</label>
            <select
              data-testid="add-modal-customer-select"
              className="w-full rounded border px-3 py-2"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="山田太郎">山田太郎</option>
              <option value="佐藤花子">佐藤花子</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">メニュー</label>
            <select
              data-testid="add-modal-menu-select"
              className="w-full rounded border px-3 py-2"
              value={formData.menu}
              onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="カット">カット</option>
              <option value="カラー">カラー</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">スタッフ</label>
            <select
              data-testid="add-modal-staff-select"
              className="w-full rounded border px-3 py-2"
              value={formData.staff}
              onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="田中">田中</option>
              <option value="佐藤">佐藤</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">日付</label>
            <input
              type="date"
              data-testid="add-modal-date-picker"
              className="w-full rounded border px-3 py-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">時間</label>
            <select
              data-testid="add-modal-time-select"
              className="w-full rounded border px-3 py-2"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="10:00">10:00</option>
              <option value="14:00">14:00</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <textarea
              data-testid="add-modal-notes"
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="add-modal-cancel-button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button data-testid="add-modal-submit-button" variant="primary" onClick={handleSubmit}>
            予約を作成
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditReservationModal({
  reservation,
  onClose,
  onSubmit,
}: {
  reservation: Reservation;
  onClose: () => void;
  onSubmit: (data: ReservationFormData) => void;
}) {
  const [formData, setFormData] = useState({
    menu: reservation.menuName,
    staff: reservation.staffName,
    date: reservation.reservedDate,
    time: reservation.reservedTime,
    status: reservation.status,
    notes: reservation.notes || '',
  });

  return (
    <div data-testid="edit-reservation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="edit-modal-title" className="mb-6 text-2xl font-bold">
          予約を編集
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">メニュー</label>
            <select
              data-testid="edit-modal-menu-select"
              className="w-full rounded border px-3 py-2"
              value={formData.menu}
              onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
            >
              <option value="カット">カット</option>
              <option value="カラー">カラー</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">スタッフ</label>
            <select
              data-testid="edit-modal-staff-select"
              className="w-full rounded border px-3 py-2"
              value={formData.staff}
              onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
            >
              <option value="田中">田中</option>
              <option value="佐藤">佐藤</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">日付</label>
            <input
              type="date"
              data-testid="edit-modal-date-picker"
              className="w-full rounded border px-3 py-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">時間</label>
            <select
              data-testid="edit-modal-time-select"
              className="w-full rounded border px-3 py-2"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            >
              <option value="10:00">10:00</option>
              <option value="14:00">14:00</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ステータス</label>
            <select
              data-testid="edit-modal-status-select"
              className="w-full rounded border px-3 py-2"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Reservation['status'] })}
            >
              <option value="PENDING">保留</option>
              <option value="CONFIRMED">確定</option>
              <option value="CANCELLED">キャンセル</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <textarea
              data-testid="edit-modal-notes"
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="edit-modal-cancel-button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button data-testid="edit-modal-submit-button" variant="primary" onClick={() => onSubmit(formData)}>
            更新する
          </Button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationDialog({
  reservation,
  onClose,
  onConfirm,
}: {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div data-testid="delete-confirmation-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="delete-dialog-title" className="mb-4 text-xl font-bold text-red-600">
          予約を削除しますか？
        </h2>

        <div className="mb-6 space-y-2">
          <p>
            <span className="font-medium">予約日時:</span>{' '}
            <span data-testid="delete-dialog-date">
              {reservation.reservedDate} {reservation.reservedTime}
            </span>
          </p>
          <p>
            <span className="font-medium">顧客名:</span> <span data-testid="delete-dialog-customer">{reservation.customerName}</span>
          </p>
          <p>
            <span className="font-medium">メニュー:</span> <span data-testid="delete-dialog-menu">{reservation.menuName}</span>
          </p>
        </div>

        <div data-testid="delete-dialog-warning" className="mb-6 rounded bg-red-50 p-3 text-sm text-red-800">
          この操作は取り消せません
        </div>

        <div className="flex justify-end gap-3">
          <Button data-testid="delete-dialog-cancel-button" variant="outline" onClick={onClose}>
            戻る
          </Button>
          <Button data-testid="delete-dialog-confirm-button" variant="primary" onClick={onConfirm}>
            削除する
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReservationDetailModal({
  reservation,
  onClose,
  onEdit,
  onCancel,
}: {
  reservation: Reservation;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <div data-testid="reservation-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="detail-modal-title" className="mb-6 text-2xl font-bold">
          予約詳細
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">顧客名</label>
            <p data-testid="detail-modal-customer" className="text-gray-900">
              {reservation.customerName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">メニュー</label>
            <p data-testid="detail-modal-menu" className="text-gray-900">
              {reservation.menuName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">スタッフ</label>
            <p data-testid="detail-modal-staff" className="text-gray-900">
              {reservation.staffName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ステータス</label>
            <p data-testid="detail-modal-status" className="text-gray-900">
              {reservation.status === 'CONFIRMED' && '確定済み'}
              {reservation.status === 'PENDING' && '保留中'}
              {reservation.status === 'CANCELLED' && 'キャンセル済み'}
              {reservation.status === 'COMPLETED' && '完了'}
              {reservation.status === 'NO_SHOW' && '無断キャンセル'}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">予約日</label>
            <p data-testid="detail-modal-date" className="text-gray-900">
              {reservation.reservedDate}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">予約時刻</label>
            <p data-testid="detail-modal-time" className="text-gray-900">
              {reservation.reservedTime}
            </p>
          </div>

          {reservation.notes && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">備考</label>
              <p data-testid="detail-modal-notes" className="text-gray-900">
                {reservation.notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="detail-modal-close-button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
          <Button data-testid="detail-modal-edit-button" variant="outline" onClick={onEdit}>
            編集
          </Button>
          <Button data-testid="detail-modal-cancel-button" variant="primary" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}
