'use client';

import Card from '@/components/Card';
import type { ReservationListFilterProps } from './types';

/**
 * 一覧表示用フィルター・検索コンポーネント
 */
export default function ReservationListFilter({
  statusFilter,
  dateRangeFilter,
  searchQuery,
  onStatusChange,
  onDateRangeChange,
  onSearchChange,
}: ReservationListFilterProps) {
  return (
    <Card className="mb-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
          <select
            data-testid="status-filter"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
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
            onChange={(e) => onDateRangeChange(e.target.value)}
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
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
