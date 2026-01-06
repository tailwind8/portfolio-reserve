'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import type { Reservation, ReservationFormData } from './types';

interface EditReservationModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSubmit: (data: ReservationFormData) => void;
}

export default function EditReservationModal({
  reservation,
  onClose,
  onSubmit,
}: EditReservationModalProps) {
  const [formData, setFormData] = useState({
    menu: reservation.menuName,
    staff: reservation.staffName,
    date: reservation.reservedDate,
    time: reservation.reservedTime,
    status: reservation.status,
    notes: reservation.notes || '',
  });

  return (
    <div data-testid="edit-reservation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="edit-modal-title" className="mb-6 text-2xl font-bold">
          予約を編集
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">メニュー</label>
            <select
              data-testid="edit-modal-menu-select"
              className="w-full rounded border px-3 py-2"
              value={formData.menu}
              onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
            >
              <option value="カット">カット</option>
              <option value="カラー">カラー</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">スタッフ</label>
            <select
              data-testid="edit-modal-staff-select"
              className="w-full rounded border px-3 py-2"
              value={formData.staff}
              onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
            >
              <option value="田中">田中</option>
              <option value="佐藤">佐藤</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">日付</label>
            <input
              type="date"
              data-testid="edit-modal-date-picker"
              className="w-full rounded border px-3 py-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">時間</label>
            <select
              data-testid="edit-modal-time-select"
              className="w-full rounded border px-3 py-2"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            >
              <option value="10:00">10:00</option>
              <option value="14:00">14:00</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ステータス</label>
            <select
              data-testid="edit-modal-status-select"
              className="w-full rounded border px-3 py-2"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Reservation['status'] })}
            >
              <option value="PENDING">保留</option>
              <option value="CONFIRMED">確定</option>
              <option value="CANCELLED">キャンセル</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <textarea
              data-testid="edit-modal-notes"
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="edit-modal-cancel-button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button data-testid="edit-modal-submit-button" variant="primary" onClick={() => onSubmit(formData)}>
            更新する
          </Button>
        </div>
      </div>
    </div>
  );
}
