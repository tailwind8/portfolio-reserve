'use client';

import type { ReservationViewTabsProps } from './types';

/**
 * 表示切替タブコンポーネント（一覧 / カレンダー）
 */
export default function ReservationViewTabs({
  viewMode,
  onViewModeChange,
}: ReservationViewTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b">
      <button
        data-testid="list-view-tab"
        onClick={() => onViewModeChange('list')}
        className={`px-4 py-2 font-medium transition-colors ${
          viewMode === 'list'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        一覧表示
      </button>
      <button
        data-testid="calendar-view-tab"
        onClick={() => onViewModeChange('calendar')}
        className={`px-4 py-2 font-medium transition-colors ${
          viewMode === 'calendar'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        カレンダー表示
      </button>
    </div>
  );
}
