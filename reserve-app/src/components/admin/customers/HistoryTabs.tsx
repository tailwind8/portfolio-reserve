'use client';

import type { HistoryTabsProps } from './types';

/**
 * 履歴タブ切替コンポーネント
 */
export default function HistoryTabs({ activeTab, onTabChange }: HistoryTabsProps) {
  return (
    <div className="mb-6 flex gap-2 border-b border-gray-200">
      <button
        onClick={() => onTabChange('visit')}
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
        onClick={() => onTabChange('reservation')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'reservation'
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        予約履歴
      </button>
    </div>
  );
}
