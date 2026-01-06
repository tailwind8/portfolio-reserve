'use client';

import Button from '@/components/Button';
import type { Reservation } from './types';

interface ReservationDetailModalProps {
  reservation: Reservation;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function ReservationDetailModal({
  reservation,
  onClose,
  onEdit,
  onCancel,
}: ReservationDetailModalProps) {
  return (
    <div data-testid="reservation-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="detail-modal-title" className="mb-6 text-2xl font-bold">
          予約詳細
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">顧客名</label>
            <p data-testid="detail-modal-customer" className="text-gray-900">
              {reservation.customerName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">メニュー</label>
            <p data-testid="detail-modal-menu" className="text-gray-900">
              {reservation.menuName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">スタッフ</label>
            <p data-testid="detail-modal-staff" className="text-gray-900">
              {reservation.staffName}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ステータス</label>
            <p data-testid="detail-modal-status" className="text-gray-900">
              {reservation.status === 'CONFIRMED' && '確定済み'}
              {reservation.status === 'PENDING' && '保留中'}
              {reservation.status === 'CANCELLED' && 'キャンセル済み'}
              {reservation.status === 'COMPLETED' && '完了'}
              {reservation.status === 'NO_SHOW' && '無断キャンセル'}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">予約日</label>
            <p data-testid="detail-modal-date" className="text-gray-900">
              {reservation.reservedDate}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">予約時刻</label>
            <p data-testid="detail-modal-time" className="text-gray-900">
              {reservation.reservedTime}
            </p>
          </div>

          {reservation.notes && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">備考</label>
              <p data-testid="detail-modal-notes" className="text-gray-900">
                {reservation.notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="detail-modal-close-button" variant="outline" onClick={onClose}>
            閉じる
          </Button>
          <Button data-testid="detail-modal-edit-button" variant="outline" onClick={onEdit}>
            編集
          </Button>
          <Button data-testid="detail-modal-cancel-button" variant="primary" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
}
