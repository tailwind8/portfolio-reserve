'use client';

import { useState } from 'react';
import Button from './Button';
import type { Reservation } from '@/types/api';

interface CancellationDialogProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancellationDialog({
  reservation,
  onClose,
  onSuccess,
}: CancellationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCancel = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Supabaseセッションは自動的にCookieで送信される
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancellationReason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || '予約のキャンセルに失敗しました');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約のキャンセルに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-medium text-gray-900">
          予約をキャンセルしますか?
        </h3>
        <p className="mb-6 text-center text-sm text-gray-600">
          この操作は取り消せません。
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <p>
            <span className="text-gray-600">日時:</span>{' '}
            <span className="font-medium text-gray-900">
              {reservation.reservedDate} {reservation.reservedTime}
            </span>
          </p>
          <p>
            <span className="text-gray-600">メニュー:</span>{' '}
            <span className="font-medium text-gray-900">{reservation.menu.name}</span>
          </p>
          <p>
            <span className="text-gray-600">担当:</span>{' '}
            <span className="font-medium text-gray-900">{reservation.staff?.name || '指名なし'}</span>
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            キャンセル理由（任意）
          </label>
          <textarea
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            maxLength={500}
            placeholder="キャンセル理由をお聞かせください"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">{cancellationReason.length}/500</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            戻る
          </Button>
          <Button
            fullWidth
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'キャンセル中...' : 'キャンセルする'}
          </Button>
        </div>
      </div>
    </div>
  );
}
