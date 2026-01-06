'use client';

import Button from '@/components/Button';
import type { Reservation } from './types';

interface DeleteReservationDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteReservationDialog({
  reservation,
  onClose,
  onConfirm,
}: DeleteReservationDialogProps) {
  return (
    <div data-testid="delete-confirmation-dialog" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="delete-dialog-title" className="mb-4 text-xl font-bold text-red-600">
          予約を削除しますか？
        </h2>

        <div className="mb-6 space-y-2">
          <p>
            <span className="font-medium">予約日時:</span>{' '}
            <span data-testid="delete-dialog-date">
              {reservation.reservedDate} {reservation.reservedTime}
            </span>
          </p>
          <p>
            <span className="font-medium">顧客名:</span> <span data-testid="delete-dialog-customer">{reservation.customerName}</span>
          </p>
          <p>
            <span className="font-medium">メニュー:</span> <span data-testid="delete-dialog-menu">{reservation.menuName}</span>
          </p>
        </div>

        <div data-testid="delete-dialog-warning" className="mb-6 rounded bg-red-50 p-3 text-sm text-red-800">
          この操作は取り消せません
        </div>

        <div className="flex justify-end gap-3">
          <Button data-testid="delete-dialog-cancel-button" variant="outline" onClick={onClose}>
            戻る
          </Button>
          <Button data-testid="delete-dialog-confirm-button" variant="primary" onClick={onConfirm}>
            削除する
          </Button>
        </div>
      </div>
    </div>
  );
}
