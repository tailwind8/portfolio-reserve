'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { Staff } from './types';

interface DeleteStaffDialogProps {
  staff: Staff;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteStaffDialog({
  staff,
  onConfirm,
  onClose,
}: DeleteStaffDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md" data-testid="delete-confirmation-dialog">
        <h2 data-testid="delete-dialog-title" className="mb-4 text-xl font-semibold text-red-600">
          スタッフを削除しますか？
        </h2>
        <p data-testid="delete-dialog-message" className="mb-6 text-gray-700">
          {staff.name}を削除します。この操作は取り消せません。
        </p>

        <div className="flex justify-end gap-3">
          <Button
            data-testid="delete-dialog-cancel-button"
            onClick={onClose}
            variant="outline"
            size="md"
          >
            キャンセル
          </Button>
          <Button
            data-testid="delete-dialog-confirm-button"
            onClick={onConfirm}
            variant="primary"
            size="md"
            className="bg-red-600 hover:bg-red-700"
          >
            削除
          </Button>
        </div>
      </Card>
    </div>
  );
}
