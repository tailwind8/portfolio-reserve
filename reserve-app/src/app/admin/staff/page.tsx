'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive: boolean;
  _count?: {
    reservations: number;
  };
}

interface StaffFormData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // モーダル・ダイアログの状態
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // フォームデータ
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
  });

  // 検索
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const url = searchQuery
        ? `/api/admin/staff?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/staff';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStaff(result.data);
        setError(null);
      } else {
        setError(result.error?.message || result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setFormData({ name: '', email: '', phone: '', role: '' });
    setShowAddModal(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setShowDeleteDialog(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setSelectedStaff(null);
    setFormData({ name: '', email: '', phone: '', role: '' });
  };

  const submitAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.name || !formData.email) {
        setError('名前とメールアドレスは必須です');
        return;
      }

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフを追加しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフの追加に失敗しました');
      }
    } catch (err) {
      setError('スタッフの追加に失敗しました');
      console.error('Add staff error:', err);
    }
  };

  const submitEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!selectedStaff) return;

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフ情報を更新しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフ情報の更新に失敗しました');
      }
    } catch (err) {
      setError('スタッフ情報の更新に失敗しました');
      console.error('Edit staff error:', err);
    }
  };

  const confirmDelete = async () => {
    try {
      if (!selectedStaff) return;

      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('スタッフを削除しました');
        closeModals();
        fetchStaff();
      } else {
        setError(result.error?.message || result.error || 'スタッフの削除に失敗しました');
      }
    } catch (err) {
      setError('スタッフの削除に失敗しました');
      console.error('Delete staff error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* ページヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">スタッフ管理</h1>
          <Button
            data-testid="add-staff-button"
            onClick={handleAddStaff}
            variant="primary"
            size="md"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            スタッフを追加
          </Button>
        </div>

        {/* 成功・エラーメッセージ */}
        {successMessage && (
          <div data-testid="success-message" className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            {successMessage}
          </div>
        )}
        {error && (
          <div data-testid="error-message" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* 検索バー */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
                スタッフ検索
              </label>
              <input
                id="search"
                type="text"
                data-testid="search-box"
                placeholder="名前で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* スタッフ一覧 */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">スタッフ一覧</h2>

          {staff.length === 0 ? (
            <div data-testid="empty-message" className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">スタッフが登録されていません</p>
            </div>
          ) : (
            <div data-testid="staff-list" className="space-y-3">
              {staff.map((staffMember) => {
                const hasReservations = (staffMember._count?.reservations || 0) > 0;

                return (
                  <div
                    key={staffMember.id}
                    data-testid="staff-item"
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                        {staffMember.name.charAt(0)}
                      </div>
                      <div>
                        <p data-testid="staff-name" className="font-semibold text-gray-900">{staffMember.name}</p>
                        <p data-testid="staff-email" className="text-sm text-gray-600">{staffMember.email}</p>
                        {staffMember.phone && (
                          <p data-testid="staff-phone" className="text-sm text-gray-600">{staffMember.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span data-testid="staff-status" className="text-sm text-gray-600">
                        勤務中
                      </span>
                      <div
                        data-testid="staff-status-indicator"
                        className="h-2 w-2 rounded-full bg-green-500"
                      ></div>

                      <Button
                        data-testid="edit-button"
                        onClick={() => handleEditStaff(staffMember)}
                        variant="outline"
                        size="sm"
                      >
                        編集
                      </Button>

                      <Button
                        data-testid="delete-button"
                        onClick={() => handleDeleteStaff(staffMember)}
                        variant="outline"
                        size="sm"
                        disabled={hasReservations}
                      >
                        削除
                      </Button>

                      {/* TODO: Issue #22でシフト設定ボタンを追加 */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

      {/* スタッフ追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md" data-testid="add-staff-modal">
            <h2 data-testid="add-modal-title" className="mb-4 text-xl font-semibold">スタッフを追加</h2>
            <form onSubmit={submitAddStaff}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">名前 *</label>
                <input
                  type="text"
                  data-testid="add-modal-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">メールアドレス *</label>
                <input
                  type="email"
                  data-testid="add-modal-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
                <input
                  type="tel"
                  data-testid="add-modal-phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {error && (
                <div data-testid="add-modal-validation-error" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  data-testid="add-modal-cancel-button"
                  onClick={closeModals}
                  variant="outline"
                  size="md"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  data-testid="add-modal-submit-button"
                  variant="primary"
                  size="md"
                >
                  追加
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* スタッフ編集モーダル */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md" data-testid="edit-staff-modal">
            <h2 data-testid="edit-modal-title" className="mb-4 text-xl font-semibold">スタッフを編集</h2>
            <form onSubmit={submitEditStaff}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">名前</label>
                <input
                  type="text"
                  data-testid="edit-modal-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">メールアドレス</label>
                <input
                  type="email"
                  data-testid="edit-modal-email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
                <input
                  type="tel"
                  data-testid="edit-modal-phone-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  data-testid="edit-modal-cancel-button"
                  onClick={closeModals}
                  variant="outline"
                  size="md"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  data-testid="edit-modal-submit-button"
                  variant="primary"
                  size="md"
                >
                  保存
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md" data-testid="delete-confirmation-dialog">
            <h2 data-testid="delete-dialog-title" className="mb-4 text-xl font-semibold text-red-600">
              スタッフを削除しますか？
            </h2>
            <p data-testid="delete-dialog-message" className="mb-6 text-gray-700">
              {selectedStaff.name}を削除します。この操作は取り消せません。
            </p>

            <div className="flex justify-end gap-3">
              <Button
                data-testid="delete-dialog-cancel-button"
                onClick={closeModals}
                variant="outline"
                size="md"
              >
                キャンセル
              </Button>
              <Button
                data-testid="delete-dialog-confirm-button"
                onClick={confirmDelete}
                variant="primary"
                size="md"
                className="bg-red-600 hover:bg-red-700"
              >
                削除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
