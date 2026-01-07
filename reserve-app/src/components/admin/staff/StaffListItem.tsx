'use client';

import Button from '@/components/Button';
import type { StaffListItemProps } from './types';

/**
 * スタッフリストアイテムコンポーネント
 */
export default function StaffListItem({
  staff,
  onEdit,
  onDelete,
  onShiftSetting,
}: StaffListItemProps) {
  const hasReservations = (staff._count?.reservations || 0) > 0;

  return (
    <div
      data-testid="staff-item"
      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-600">
          {staff.name.charAt(0)}
        </div>
        <div>
          <p data-testid="staff-name" className="font-semibold text-gray-900">{staff.name}</p>
          <p data-testid="staff-email" className="text-sm text-gray-600">{staff.email}</p>
          {staff.phone && (
            <p data-testid="staff-phone" className="text-sm text-gray-600">{staff.phone}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span data-testid="staff-status" className="text-sm text-gray-600">
          勤務中
        </span>
        <div
          data-testid="staff-status-indicator"
          className="h-2 w-2 rounded-full bg-green-500"
        />

        <Button
          data-testid="edit-button"
          onClick={onEdit}
          variant="outline"
          size="sm"
        >
          編集
        </Button>

        <Button
          data-testid="shift-button"
          onClick={onShiftSetting}
          variant="outline"
          size="sm"
        >
          シフト設定
        </Button>

        <Button
          data-testid="delete-button"
          onClick={onDelete}
          variant="outline"
          size="sm"
          disabled={hasReservations}
        >
          削除
        </Button>
      </div>
    </div>
  );
}
