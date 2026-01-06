'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { StaffFormData } from './types';

interface AddStaffModalProps {
  formData: StaffFormData;
  error: string | null;
  onFormChange: (data: StaffFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function AddStaffModal({
  formData,
  error,
  onFormChange,
  onSubmit,
  onClose,
}: AddStaffModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md" data-testid="add-staff-modal">
        <h2 data-testid="add-modal-title" className="mb-4 text-xl font-semibold">スタッフを追加</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">名前 *</label>
            <input
              type="text"
              data-testid="add-modal-name-input"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">メールアドレス *</label>
            <input
              type="email"
              data-testid="add-modal-email-input"
              value={formData.email}
              onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
            <input
              type="tel"
              data-testid="add-modal-phone-input"
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div data-testid="add-modal-validation-error" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              data-testid="add-modal-cancel-button"
              onClick={onClose}
              variant="outline"
              size="md"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              data-testid="add-modal-submit-button"
              variant="primary"
              size="md"
            >
              追加
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
