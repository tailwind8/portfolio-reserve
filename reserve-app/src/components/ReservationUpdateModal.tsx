'use client';

import { useState } from 'react';
import Button from './Button';
import type { Reservation } from '@/types/api';

interface ReservationUpdateModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReservationUpdateModal({
  reservation,
  onClose,
  onSuccess,
}: ReservationUpdateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    reservedDate: reservation.reservedDate,
    reservedTime: reservation.reservedTime,
    menuId: reservation.menuId,
    staffId: reservation.staffId,
    notes: reservation.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'temp-user-id',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '予約の変更に失敗しました');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約の変更に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">予約を変更</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reservedDate" className="mb-1 block text-sm font-medium text-gray-700">
              予約日
            </label>
            <input
              id="reservedDate"
              type="date"
              value={formData.reservedDate}
              onChange={(e) => setFormData({ ...formData, reservedDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label htmlFor="reservedTime" className="mb-1 block text-sm font-medium text-gray-700">
              時間
            </label>
            <input
              id="reservedTime"
              type="time"
              value={formData.reservedTime}
              onChange={(e) => setFormData({ ...formData, reservedTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              備考
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={3}
              maxLength={500}
            />
            <p className="mt-1 text-sm text-gray-500">{formData.notes.length}/500</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? '変更中...' : '変更を保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
