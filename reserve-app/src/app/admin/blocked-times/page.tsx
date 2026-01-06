'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import BlockedTimeList from '@/components/admin/BlockedTimeList';
import BlockedTimeForm from '@/components/admin/BlockedTimeForm';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export interface BlockedTime {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string | null;
  description: string | null;
}

// エラーメッセージを安全に抽出するヘルパー
function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'エラーが発生しました';
}

export default function BlockedTimesPage() {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlockedTime, setEditingBlockedTime] = useState<BlockedTime | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // アクセストークンを取得するヘルパー
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    // テスト環境では認証をスキップ
    const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === 'true';

    if (skipAuth) {
      return {
        'Content-Type': 'application/json',
      };
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('認証が必要です。再度ログインしてください。');
    }
    return {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchBlockedTimes = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/blocked-times', { headers });
      const result = await response.json();

      if (result.success) {
        setBlockedTimes(result.data);
      } else {
        setError(extractErrorMessage(result.error) || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラーが発生しました');
      console.error('Blocked times fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchBlockedTimes();
  }, [fetchBlockedTimes]);

  const handleAdd = () => {
    setEditingBlockedTime(null);
    setIsFormOpen(true);
  };

  const handleEdit = (blockedTime: BlockedTime) => {
    setEditingBlockedTime(blockedTime);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('この予約ブロックを削除してもよろしいですか？')) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/blocked-times/${id}`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('予約ブロックを削除しました');
        fetchBlockedTimes();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(extractErrorMessage(result.error) || '削除に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラーが発生しました');
      console.error('Delete blocked time error:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<BlockedTime, 'id'>) => {
    try {
      const headers = await getAuthHeaders();
      const method = editingBlockedTime ? 'PATCH' : 'POST';
      const url = editingBlockedTime
        ? `/api/admin/blocked-times/${editingBlockedTime.id}`
        : '/api/admin/blocked-times';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(result.message || '保存しました');
        setIsFormOpen(false);
        setEditingBlockedTime(null);
        fetchBlockedTimes();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(extractErrorMessage(result.error) || '保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ネットワークエラーが発生しました');
      console.error('Save blocked time error:', err);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBlockedTime(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 data-testid="blocked-times-heading" className="mb-2 text-3xl font-bold text-gray-900">
              予約ブロック管理
            </h1>
            <p className="text-gray-600">
              ホットペッパーや電話予約など、システム外予約の時間帯を管理します
            </p>
          </div>
          <Button
            data-testid="add-blocked-time-button"
            variant="primary"
            size="md"
            onClick={handleAdd}
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            新規ブロック追加
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            data-testid="success-message"
            className="mb-6 rounded-lg bg-green-50 p-4 text-green-800"
          >
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            data-testid="error-message"
            className="mb-6 rounded-lg bg-red-50 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        {/* Blocked Times List */}
        <Card>
          {blockedTimes.length === 0 ? (
            <EmptyState
              data-testid="empty-state"
              title="予約ブロックがありません"
              description="ホットペッパーや電話予約の時間帯をブロックできます"
            />
          ) : (
            <div data-testid="blocked-times-list">
              <BlockedTimeList
                blockedTimes={blockedTimes}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </Card>
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <BlockedTimeForm
          blockedTime={editingBlockedTime}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
