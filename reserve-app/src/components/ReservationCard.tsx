'use client';

import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import ReservationUpdateModal from './ReservationUpdateModal';
import CancellationDialog from './CancellationDialog';
import type { Reservation } from '@/types/api';

interface ReservationCardProps {
  reservation: Reservation;
  type: 'upcoming' | 'past';
  onUpdate: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: '確定待ち', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: '確定', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' },
  COMPLETED: { label: '完了', color: 'bg-blue-100 text-blue-800' },
  NO_SHOW: { label: '無断キャンセル', color: 'bg-red-100 text-red-800' },
};

export default function ReservationCard({
  reservation,
  type,
  onUpdate,
}: ReservationCardProps) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const canModify =
    type === 'upcoming' &&
    !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(reservation.status);

  const statusInfo = STATUS_LABELS[reservation.status] || {
    label: reservation.status,
    color: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <Card hover>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* 予約情報 */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">日時</p>
                  <p className="font-medium text-gray-900">
                    {reservation.reservedDate} {reservation.reservedTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">メニュー</p>
                  <p className="font-medium text-gray-900">{reservation.menu.name}</p>
                  <p className="text-sm text-gray-600">
                    ¥{reservation.menu.price.toLocaleString()} / {reservation.menu.duration}分
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">担当</p>
                  <p className="font-medium text-gray-900">{reservation.staff.name}</p>
                </div>
              </div>

              {reservation.notes && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <svg
                    className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">備考</p>
                    <p className="text-sm text-gray-700">{reservation.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {canModify && (
            <div className="flex gap-2 md:flex-col">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
                onClick={() => setShowUpdateModal(true)}
              >
                変更
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none text-red-600 hover:bg-red-50 border-red-300"
                onClick={() => setShowCancelDialog(true)}
              >
                キャンセル
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 変更モーダル */}
      {showUpdateModal && (
        <ReservationUpdateModal
          reservation={reservation}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false);
            onUpdate();
          }}
        />
      )}

      {/* キャンセルダイアログ */}
      {showCancelDialog && (
        <CancellationDialog
          reservation={reservation}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            setShowCancelDialog(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
