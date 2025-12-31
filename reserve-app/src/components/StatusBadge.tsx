import React from 'react';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

interface StatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

/**
 * StatusBadge - 予約ステータスを表示するバッジコンポーネント
 *
 * @param status - 予約ステータス（PENDING/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW）
 * @param className - 追加のCSSクラス（オプション）
 *
 * @example
 * <StatusBadge status="CONFIRMED" />
 * <StatusBadge status="PENDING" className="ml-2" />
 */
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  // ステータスごとのスタイルマッピング
  const statusStyles: Record<ReservationStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  // ステータスごとの日本語ラベル
  const statusLabels: Record<ReservationStatus, string> = {
    PENDING: '予約待ち',
    CONFIRMED: '予約確定',
    CANCELLED: 'キャンセル',
    COMPLETED: '完了',
    NO_SHOW: '来店なし',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {statusLabels[status]}
    </span>
  );
}
