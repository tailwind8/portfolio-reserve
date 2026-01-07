'use client';

import type { VisitHistoryListProps } from './types';

/**
 * 来店履歴リストコンポーネント
 */
export default function VisitHistoryList({ visitHistory }: VisitHistoryListProps) {
  if (visitHistory.length === 0) {
    return <p className="text-gray-500">来店履歴がありません</p>;
  }

  return (
    <div data-testid="visit-history-list" className="space-y-4">
      {visitHistory.map((visit) => (
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
  );
}
