'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  visitCount: number;
  lastVisitDate: string | null;
  createdAt: string;
  updatedAt: string;
}

type SortBy = 'visitCount' | 'lastVisitDate' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy, sortOrder]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`/api/admin/customers?${params.toString()}`);

      if (!response.ok) {
        throw new Error('顧客一覧の取得に失敗しました');
      }

      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
      } else {
        throw new Error(result.error?.message || '顧客一覧の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err instanceof Error ? err.message : '顧客一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900">
            顧客管理
          </h1>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div data-testid="error-message" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* 検索バーとソート */}
        <Card className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <label htmlFor="search" className="mb-2 block text-sm font-medium text-gray-700">
                顧客検索
              </label>
              <input
                id="search"
                type="text"
                data-testid="search-box"
                placeholder="名前・メールアドレスで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                data-testid="sort-button-visit-count"
                onClick={() => handleSort('visitCount')}
                variant={sortBy === 'visitCount' ? 'primary' : 'outline'}
                size="sm"
              >
                来店回数 {sortBy === 'visitCount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              <Button
                data-testid="sort-button-last-visit"
                onClick={() => handleSort('lastVisitDate')}
                variant={sortBy === 'lastVisitDate' ? 'primary' : 'outline'}
                size="sm"
              >
                最終来店日 {sortBy === 'lastVisitDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
            </div>
          </div>
        </Card>

        {/* 顧客一覧 */}
        <Card>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">顧客一覧</h2>

          {loading ? (
            <div data-testid="loading-message" className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">読み込み中...</p>
            </div>
          ) : customers.length === 0 ? (
            <div data-testid="empty-message" className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">顧客が登録されていません</p>
            </div>
          ) : (
            <div data-testid="customer-list" className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  data-testid="customer-item"
                  onClick={() => handleCustomerClick(customer.id)}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
                      {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p data-testid="customer-name" className="font-semibold text-gray-900">
                        {customer.name || '（名前未設定）'}
                      </p>
                      <p data-testid="customer-email" className="text-sm text-gray-600">
                        {customer.email}
                      </p>
                      {customer.phone && (
                        <p data-testid="customer-phone" className="text-sm text-gray-600">
                          {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">来店回数</p>
                      <p data-testid="customer-visit-count" className="text-lg font-semibold text-gray-900">
                        {customer.visitCount}回
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">最終来店日</p>
                      <p data-testid="customer-last-visit-date" className="text-lg font-semibold text-gray-900">
                        {customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString('ja-JP') : 'なし'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

