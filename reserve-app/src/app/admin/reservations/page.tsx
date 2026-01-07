'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Button from '@/components/Button';
import { useAuthFetch, extractErrorMessage } from '@/hooks/useAuthFetch';
import {
  AddReservationModal,
  EditReservationModal,
  DeleteReservationDialog as DeleteConfirmationDialog,
  ReservationDetailModal,
  ReservationViewTabs,
  ReservationListFilter,
  ReservationTable,
  ReservationCalendarFilter,
  WeeklyCalendar,
  generateTimeSlots,
  formatWeekTitle,
  generateWeekDates,
  formatDateString,
} from '@/components/admin/reservations';
import type { Reservation, ReservationFormData, ViewMode, UniqueItem } from '@/components/admin/reservations';

export default function AdminReservationsPage() {
  const { authFetch } = useAuthFetch();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 表示モード（一覧 or カレンダー）
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
    const baseDate = new Date('2026-01-06');
    baseDate.setHours(0, 0, 0, 0);
    return baseDate;
  });

  // LocalStorageから表示モードを読み込む
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

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/admin/reservations');
      const result = await response.json();

      if (result.success) {
        setReservations(result.data?.data || []);
      } else {
        setError(extractErrorMessage(result.error) || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラーが発生しました');
      console.error('Reservations fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // モーダル操作ハンドラー
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

  // CRUD操作
  const submitAddReservation = async (formData: ReservationFormData) => {
    try {
      if (!formData.customer || !formData.menu || !formData.staff || !formData.date || !formData.time) {
        throw new Error('必須項目を入力してください');
      }

      const response = await authFetch('/api/admin/reservations', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を追加しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(extractErrorMessage(result.error) || '予約の追加に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  const submitEditReservation = async (formData: ReservationFormData) => {
    try {
      if (!selectedReservation) { return; }

      const response = await authFetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を更新しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(extractErrorMessage(result.error) || '予約の更新に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  const confirmDelete = async () => {
    try {
      if (!selectedReservation) { return; }

      const response = await authFetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約を削除しました');
        closeModals();
        fetchReservations();
      } else {
        throw new Error(extractErrorMessage(result.error) || '予約の削除に失敗しました');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '予期しないエラーが発生しました';
      setError(errorMessage);
    }
  };

  // カレンダー関連
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const weekTitle = useMemo(() => formatWeekTitle(currentWeekStart), [currentWeekStart]);
  const weekDates = useMemo(() => generateWeekDates(currentWeekStart), [currentWeekStart]);

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

  // フィルタリング
  const filteredReservationsCalendar = useMemo(() => {
    return reservations.filter((reservation) => {
      if (staffFilterCalendar !== 'all' && reservation.staffId !== staffFilterCalendar) { return false; }
      if (menuFilterCalendar !== 'all' && reservation.menuId !== menuFilterCalendar) { return false; }
      if (statusFilterCalendar !== 'all' && reservation.status !== statusFilterCalendar.toUpperCase()) { return false; }
      return true;
    });
  }, [reservations, staffFilterCalendar, menuFilterCalendar, statusFilterCalendar]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      if (statusFilter !== 'all' && reservation.status !== statusFilter.toUpperCase()) {
        return false;
      }
      if (searchQuery && !reservation.customerName.includes(searchQuery)) {
        return false;
      }
      return true;
    });
  }, [reservations, statusFilter, searchQuery]);

  const uniqueStaff: UniqueItem[] = useMemo(() => {
    const staffMap = new Map<string, string>();
    reservations.forEach((r) => {
      if (r.staffId && r.staffName) {
        staffMap.set(r.staffId, r.staffName);
      }
    });
    return Array.from(staffMap.entries()).map(([id, name]) => ({ id, name }));
  }, [reservations]);

  const uniqueMenus: UniqueItem[] = useMemo(() => {
    const menuMap = new Map<string, string>();
    reservations.forEach((r) => {
      if (r.menuId && r.menuName) {
        menuMap.set(r.menuId, r.menuName);
      }
    });
    return Array.from(menuMap.entries()).map(([id, name]) => ({ id, name }));
  }, [reservations]);

  // タイムブロッククリック
  const handleTimeBlockClick = (date: Date, time: string) => {
    const dateStr = formatDateString(date);

    const reservation = filteredReservationsCalendar.find(
      (r) => r.reservedDate === dateStr && r.reservedTime === time
    );

    if (reservation) {
      handleShowDetail(reservation);
    } else {
      setPrefilledDate(dateStr);
      setPrefilledTime(time);
      setShowAddModal(true);
    }
  };

  // ローディング表示
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

  // エラー表示
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
        <ReservationViewTabs viewMode={viewMode} onViewModeChange={setViewMode} />

        {/* 一覧表示 */}
        {viewMode === 'list' && (
          <>
            <ReservationListFilter
              statusFilter={statusFilter}
              dateRangeFilter={dateRangeFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onDateRangeChange={setDateRangeFilter}
              onSearchChange={setSearchQuery}
            />
            <ReservationTable
              reservations={filteredReservations}
              onShowDetail={handleShowDetail}
              onEdit={handleEditReservation}
              onDelete={handleDeleteReservation}
            />
          </>
        )}

        {/* カレンダー表示 */}
        {viewMode === 'calendar' && (
          <>
            <ReservationCalendarFilter
              staffFilter={staffFilterCalendar}
              menuFilter={menuFilterCalendar}
              statusFilter={statusFilterCalendar}
              uniqueStaff={uniqueStaff}
              uniqueMenus={uniqueMenus}
              onStaffChange={setStaffFilterCalendar}
              onMenuChange={setMenuFilterCalendar}
              onStatusChange={setStatusFilterCalendar}
            />
            <WeeklyCalendar
              weekDates={weekDates}
              weekTitle={weekTitle}
              timeSlots={timeSlots}
              reservations={filteredReservationsCalendar}
              onPrevWeek={handlePrevWeek}
              onNextWeek={handleNextWeek}
              onTimeBlockClick={handleTimeBlockClick}
            />
          </>
        )}

        {/* モーダル */}
        {showAddModal && (
          <AddReservationModal
            onClose={closeModals}
            onSubmit={submitAddReservation}
            prefilledDate={prefilledDate}
            prefilledTime={prefilledTime}
          />
        )}

        {showEditModal && selectedReservation && (
          <EditReservationModal
            reservation={selectedReservation}
            onClose={closeModals}
            onSubmit={submitEditReservation}
          />
        )}

        {showDeleteDialog && selectedReservation && (
          <DeleteConfirmationDialog
            reservation={selectedReservation}
            onClose={closeModals}
            onConfirm={confirmDelete}
          />
        )}

        {showDetailModal && selectedReservation && (
          <ReservationDetailModal
            reservation={selectedReservation}
            onClose={closeModals}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onCancel={() => {
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
