'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface VisitHistoryItem {
  id: string;
  date: string;
  time: string;
  menuName: string;
  menuPrice: number;
  menuDuration: number;
  staffName: string;
  staffRole: string | null;
}

interface ReservationHistoryItem {
  id: string;
  date: string;
  time: string;
  status: string;
  menuName: string;
  menuPrice: number;
  staffName: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  memo: string;
  visitHistory: VisitHistoryItem[];
  reservationHistory: ReservationHistoryItem[];
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'visit' | 'reservation';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visit');

  // メモ編集関連
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoValue, setMemoValue] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // 顧客情報編集関連
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
  });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const fetchCustomerDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}`);

      if (!response.ok) {
        throw new Error('顧客詳細の取得に失敗しました');
      }

      const result = await response.json();

      if (result.success) {
        setCustomer(result.data);
        setMemoValue(result.data.memo || '');
        setEditFormData({
          name: result.data.name || '',
          phone: result.data.phone || '',
        });
      } else {
        throw new Error(result.error?.message || '顧客詳細の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch customer detail:', err);
      setError(err instanceof Error ? err.message : '顧客詳細の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMemo = () => {
    setIsEditingMemo(true);
  };

  const handleSaveMemo = async () => {
    if (!customer) return;

    try {
      setIsSavingMemo(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/memo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: memoValue }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('メモを保存しました');
        setIsEditingMemo(false);
        await fetchCustomerDetail();
      } else {
        throw new Error(result.error?.message || 'メモの保存に失敗しました');
      }
    } catch (err) {
      console.error('Failed to save memo:', err);
      setError(err instanceof Error ? err.message : 'メモの保存に失敗しました');
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleDeleteMemo = async () => {
    if (!confirm('メモを削除しますか？')) {
      return;
    }

    try {
      setIsSavingMemo(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/memo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: '' }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('メモを削除しました');
        setMemoValue('');
        await fetchCustomerDetail();
      } else {
        throw new Error(result.error?.message || 'メモの削除に失敗しました');
      }
    } catch (err) {
      console.error('Failed to delete memo:', err);
      setError(err instanceof Error ? err.message : 'メモの削除に失敗しました');
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleCancelMemoEdit = () => {
    if (customer) {
      setMemoValue(customer.memo || '');
    }
    setIsEditingMemo(false);
  };

  const handleEditInfo = () => {
    if (customer) {
      setEditFormData({
        name: customer.name || '',
        phone: customer.phone || '',
      });
    }
    setShowEditModal(true);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSavingInfo(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('顧客情報を更新しました');
        setShowEditModal(false);
        await fetchCustomerDetail();
      } else {
        throw new Error(result.error?.message || '顧客情報の更新に失敗しました');
      }
    } catch (err) {
      console.error('Failed to update customer info:', err);
      setError(err instanceof Error ? err.message : '顧客情報の更新に失敗しました');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: '予約確定待ち',
      CONFIRMED: '確定',
      CANCELLED: 'キャンセル',
      COMPLETED: '来店済み',
      NO_SHOW: '無断キャンセル',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
      NO_SHOW: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div data-testid="loading-message" className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div data-testid="error-message" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error || '顧客が見つかりません'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              onClick={() => router.push('/admin/customers')}
              variant="outline"
              size="sm"
              className="mb-4"
            >
              ← 顧客一覧に戻る
            </Button>
            <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
              顧客詳細
            </h1>
          </div>
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

        {/* 顧客基本情報 */}
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
            <Button
              data-testid="customer-info-edit-button"
              onClick={handleEditInfo}
              variant="outline"
              size="sm"
            >
              顧客情報を編集
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">名前</p>
              <p data-testid="customer-detail-name" className="text-lg font-semibold text-gray-900">
                {customer.name || '（名前未設定）'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">メールアドレス</p>
              <p data-testid="customer-detail-email" className="text-lg font-semibold text-gray-900">
                {customer.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">電話番号</p>
              <p data-testid="customer-detail-phone" className="text-lg font-semibold text-gray-900">
                {customer.phone || '（未設定）'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">来店回数</p>
              <p className="text-lg font-semibold text-gray-900">{customer.visitCount}回</p>
            </div>
          </div>
        </Card>

        {/* 顧客メモ */}
        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">メモ</h2>
            {!isEditingMemo && (
              <div className="flex gap-2">
                {customer.memo && (
                  <Button
                    data-testid="customer-memo-delete-button"
                    onClick={handleDeleteMemo}
                    variant="outline"
                    size="sm"
                    disabled={isSavingMemo}
                  >
                    メモを削除
                  </Button>
                )}
                <Button
                  data-testid="customer-memo-edit-button"
                  onClick={handleEditMemo}
                  variant="outline"
                  size="sm"
                >
                  メモを追加{customer.memo ? '・編集' : ''}
                </Button>
              </div>
            )}
          </div>

          {isEditingMemo ? (
            <div>
              <textarea
                data-testid="customer-memo-input"
                value={memoValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setMemoValue(value);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                rows={5}
                placeholder="顧客メモを入力してください（500文字以内）"
                disabled={isSavingMemo}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">{memoValue.length}/500文字</p>
                <div className="flex gap-2">
                  <Button
                    data-testid="customer-memo-cancel-button"
                    onClick={handleCancelMemoEdit}
                    variant="outline"
                    size="sm"
                    disabled={isSavingMemo}
                  >
                    キャンセル
                  </Button>
                  <Button
                    data-testid="customer-memo-save-button"
                    onClick={handleSaveMemo}
                    variant="primary"
                    size="sm"
                    disabled={isSavingMemo}
                  >
                    {isSavingMemo ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {customer.memo ? (
                <p data-testid="customer-memo" className="whitespace-pre-wrap text-gray-700">
                  {customer.memo}
                </p>
              ) : (
                <p className="text-gray-500">メモがありません</p>
              )}
            </div>
          )}
        </Card>

        {/* 来店履歴・予約履歴タブ */}
        <Card>
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('visit')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'visit'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              来店履歴
            </button>
            <button
              data-testid="reservation-history-tab"
              onClick={() => setActiveTab('reservation')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'reservation'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              予約履歴
            </button>
          </div>

          {activeTab === 'visit' && (
            <div data-testid="visit-history-list">
              {customer.visitHistory.length === 0 ? (
                <p className="text-gray-500">来店履歴がありません</p>
              ) : (
                <div className="space-y-4">
                  {customer.visitHistory.map((visit) => (
                    <div
                      key={visit.id}
                      data-testid="visit-history-item"
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(visit.date).toLocaleDateString('ja-JP')} {visit.time}
                          </p>
                          <p className="text-sm text-gray-600">{visit.menuName}</p>
                          <p className="text-sm text-gray-600">
                            {visit.staffName} {visit.staffRole ? `(${visit.staffRole})` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">¥{visit.menuPrice.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{visit.menuDuration}分</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reservation' && (
            <div data-testid="reservation-history-list">
              {customer.reservationHistory.length === 0 ? (
                <p className="text-gray-500">予約履歴がありません</p>
              ) : (
                <div className="space-y-4">
                  {customer.reservationHistory.map((reservation) => (
                    <div
                      key={reservation.id}
                      data-testid="reservation-history-item"
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(reservation.date).toLocaleDateString('ja-JP')} {reservation.time}
                          </p>
                          <p className="text-sm text-gray-600">{reservation.menuName}</p>
                          <p className="text-sm text-gray-600">{reservation.staffName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              reservation.status
                            )}`}
                          >
                            {getStatusLabel(reservation.status)}
                          </span>
                          <p className="font-semibold text-gray-900">¥{reservation.menuPrice.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 顧客情報編集モーダル */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md" data-testid="customer-edit-modal">
              <h2 className="mb-4 text-xl font-semibold">顧客情報を編集</h2>
              <form onSubmit={handleSaveInfo}>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">名前</label>
                  <input
                    type="text"
                    data-testid="edit-modal-name-input"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
                  <input
                    type="tel"
                    data-testid="edit-modal-phone-input"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    data-testid="edit-modal-cancel-button"
                    onClick={() => setShowEditModal(false)}
                    variant="outline"
                    size="md"
                    disabled={isSavingInfo}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    data-testid="edit-modal-submit-button"
                    variant="primary"
                    size="md"
                    disabled={isSavingInfo}
                  >
                    {isSavingInfo ? '保存中...' : '保存'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

