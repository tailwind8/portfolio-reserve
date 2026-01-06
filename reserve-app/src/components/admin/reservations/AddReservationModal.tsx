'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import type { ReservationFormData } from './types';

interface AddReservationModalProps {
  onClose: () => void;
  onSubmit: (data: ReservationFormData) => void;
  prefilledDate?: string;
  prefilledTime?: string;
}

export default function AddReservationModal({
  onClose,
  onSubmit,
  prefilledDate = '',
  prefilledTime = '',
}: AddReservationModalProps) {
  const [formData, setFormData] = useState({
    customer: '',
    menu: '',
    staff: '',
    date: prefilledDate,
    time: prefilledTime,
    notes: '',
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    if (!formData.customer || !formData.menu || !formData.staff || !formData.date || !formData.time) {
      setValidationError('必須項目を入力してください');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div data-testid="add-reservation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 data-testid="add-modal-title" className="mb-6 text-2xl font-bold">
          新規予約を追加
        </h2>

        {validationError && (
          <div data-testid="add-modal-validation-error" className="mb-4 rounded bg-red-50 p-3 text-red-800">
            {validationError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">顧客</label>
            <select
              data-testid="add-modal-customer-select"
              className="w-full rounded border px-3 py-2"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="山田太郎">山田太郎</option>
              <option value="佐藤花子">佐藤花子</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">メニュー</label>
            <select
              data-testid="add-modal-menu-select"
              className="w-full rounded border px-3 py-2"
              value={formData.menu}
              onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="カット">カット</option>
              <option value="カラー">カラー</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">スタッフ</label>
            <select
              data-testid="add-modal-staff-select"
              className="w-full rounded border px-3 py-2"
              value={formData.staff}
              onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="田中">田中</option>
              <option value="佐藤">佐藤</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">日付</label>
            <input
              type="date"
              data-testid="add-modal-date-picker"
              className="w-full rounded border px-3 py-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">時間</label>
            <select
              data-testid="add-modal-time-select"
              className="w-full rounded border px-3 py-2"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            >
              <option value="">選択してください</option>
              <option value="10:00">10:00</option>
              <option value="14:00">14:00</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">備考</label>
            <textarea
              data-testid="add-modal-notes"
              className="w-full rounded border px-3 py-2"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button data-testid="add-modal-cancel-button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button data-testid="add-modal-submit-button" variant="primary" onClick={handleSubmit}>
            予約を作成
          </Button>
        </div>
      </div>
    </div>
  );
}
