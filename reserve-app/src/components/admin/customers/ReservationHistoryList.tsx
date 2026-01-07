'use client';

import type { ReservationHistoryListProps } from './types';
import { getStatusLabel, getStatusColor } from './types';

/**
 * 予約履歴リストコンポーネント
 */
export default function ReservationHistoryList({ reservationHistory }: ReservationHistoryListProps) {
  if (reservationHistory.length === 0) {
    return <p className="text-gray-500">予約履歴がありません</p>;
  }

  return (
    <div data-testid="reservation-history-list" className="space-y-4">
      {reservationHistory.map((reservation) => (
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
  );
}
