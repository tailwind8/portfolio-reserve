'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import {
  CustomerInfoSection,
  CustomerMemoSection,
  HistoryTabs,
  VisitHistoryList,
  ReservationHistoryList,
  CustomerEditModal,
} from '@/components/admin/customers';
import type { CustomerDetail, TabType } from '@/components/admin/customers';

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
  const [editFormData, setEditFormData] = useState({ name: '', phone: '' });
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

  // メモ操作
  const handleEditMemo = () => setIsEditingMemo(true);

  const handleSaveMemo = async () => {
    if (!customer) { return; }

    try {
      setIsSavingMemo(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/memo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    if (!confirm('メモを削除しますか？')) { return; }

    try {
      setIsSavingMemo(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${customerId}/memo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  // 顧客情報編集
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
        headers: { 'Content-Type': 'application/json' },
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
        <CustomerInfoSection customer={customer} onEdit={handleEditInfo} />

        {/* 顧客メモ */}
        <CustomerMemoSection
          memo={customer.memo}
          isEditing={isEditingMemo}
          memoValue={memoValue}
          isSaving={isSavingMemo}
          onEdit={handleEditMemo}
          onSave={handleSaveMemo}
          onDelete={handleDeleteMemo}
          onCancel={handleCancelMemoEdit}
          onMemoChange={setMemoValue}
        />

        {/* 来店履歴・予約履歴タブ */}
        <Card>
          <HistoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'visit' && (
            <VisitHistoryList visitHistory={customer.visitHistory} />
          )}

          {activeTab === 'reservation' && (
            <ReservationHistoryList reservationHistory={customer.reservationHistory} />
          )}
        </Card>

        {/* 顧客情報編集モーダル */}
        <CustomerEditModal
          isOpen={showEditModal}
          formData={editFormData}
          isSaving={isSavingInfo}
          onFormChange={setEditFormData}
          onSubmit={handleSaveInfo}
          onClose={() => setShowEditModal(false)}
        />
      </main>
    </div>
  );
}
