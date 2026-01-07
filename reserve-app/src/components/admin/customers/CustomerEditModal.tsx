'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { CustomerEditModalProps } from './types';

/**
 * 顧客情報編集モーダルコンポーネント
 */
export default function CustomerEditModal({
  isOpen,
  formData,
  isSaving,
  onFormChange,
  onSubmit,
  onClose,
}: CustomerEditModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md" data-testid="customer-edit-modal">
        <h2 className="mb-4 text-xl font-semibold">顧客情報を編集</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">名前</label>
            <input
              type="text"
              data-testid="edit-modal-name-input"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">電話番号</label>
            <input
              type="tel"
              data-testid="edit-modal-phone-input"
              value={formData.phone}
              onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              data-testid="edit-modal-cancel-button"
              onClick={onClose}
              variant="outline"
              size="md"
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              data-testid="edit-modal-submit-button"
              variant="primary"
              size="md"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
