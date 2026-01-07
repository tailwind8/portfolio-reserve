'use client';

import Card from '@/components/Card';
import type { StaffSearchBarProps } from './types';

/**
 * スタッフ検索バーコンポーネント
 */
export default function StaffSearchBar({ searchQuery, onSearchChange }: StaffSearchBarProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </Card>
  );
}
