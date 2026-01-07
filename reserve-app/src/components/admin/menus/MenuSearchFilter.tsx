'use client';

import { MENU_CATEGORIES } from './types';

type MenuSearchFilterProps = {
  searchQuery: string;
  categoryFilter: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

/**
 * メニュー検索・フィルターコンポーネント
 */
export function MenuSearchFilter({
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
}: MenuSearchFilterProps) {
  return (
    <div className="mb-4 flex gap-4">
      <input
        type="text"
        data-testid="search-input"
        placeholder="メニュー名で検索"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border px-4 py-2 rounded"
      />
      <select
        data-testid="category-filter"
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border px-4 py-2 rounded"
      >
        <option value="">すべてのカテゴリ</option>
        {MENU_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
