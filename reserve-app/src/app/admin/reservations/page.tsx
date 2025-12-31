'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Reservation {
  id: string;
  reservedDate: string;
  reservedTime: string;
  customerName: string;
  menuName: string;
  staffName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
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

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // フィルター・検索
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      // TODO: API実装後に実際のエンドポイントに変更
      const response = await fetch('/api/admin/reservations');
      const result = await response.json();

      if (result.success) {
        setReservations(result.data);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Reservations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReservation = () => {
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

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setSelectedReservation(null);
  };

  const submitAddReservation = async (formData: ReservationFormData) => {
    try {
      // TODO: バリデーション実装
      if (!formData.customer || !formData.menu || !formData.staff || !formData.date || !formData.time) {
        throw new Error('必須項目を入力してください');
      }

      // TODO: API実装後に実際のエンドポイントに変更
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

      // TODO: API実装後に実際のエンドポイントに変更
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

      // TODO: API実装後に実際のエンドポイントに変更
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

  // フィルタリング・検索ロジック
  const filteredReservations = reservations.filter((reservation) => {
    // ステータスフィルター
    if (statusFilter !== 'all' && reservation.status !== statusFilter) {
      return false;
    }

    // 検索
    if (searchQuery && !reservation.customerName.includes(searchQuery)) {
      return false;
    }

    // 日付範囲フィルター
    if (dateRangeFilter === 'this-week') {
      // TODO: 今週の予約のみフィルタリング実装
    }

    return true;
  });

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

        {/* TODO: 新規予約追加モーダル実装 */}
        {showAddModal && <AddReservationModal onClose={closeModals} onSubmit={submitAddReservation} />}

        {/* TODO: 予約編集モーダル実装 */}
        {showEditModal && selectedReservation && (
          <EditReservationModal
            reservation={selectedReservation}
            onClose={closeModals}
            onSubmit={submitEditReservation}
          />
        )}

        {/* TODO: 削除確認ダイアログ実装 */}
        {showDeleteDialog && selectedReservation && (
          <DeleteConfirmationDialog
            reservation={selectedReservation}
            onClose={closeModals}
            onConfirm={confirmDelete}
          />
        )}
      </main>
    </div>
  );
}

// ===== モーダルコンポーネント（暫定実装） =====

function AddReservationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: ReservationFormData) => void }) {
  const [formData, setFormData] = useState({
    customer: '',
    menu: '',
    staff: '',
    date: '',
    time: '',
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
