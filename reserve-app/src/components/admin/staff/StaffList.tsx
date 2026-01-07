'use client';

import Card from '@/components/Card';
import StaffListItem from './StaffListItem';
import type { StaffListProps } from './types';

/**
 * スタッフ一覧コンポーネント
 */
export default function StaffList({
  staff,
  onEdit,
  onDelete,
  onShiftSetting,
}: StaffListProps) {
  return (
    <Card>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">スタッフ一覧</h2>

      {staff.length === 0 ? (
        <div data-testid="empty-message" className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">スタッフが登録されていません</p>
        </div>
      ) : (
        <div data-testid="staff-list" className="space-y-3">
          {staff.map((staffMember) => (
            <StaffListItem
              key={staffMember.id}
              staff={staffMember}
              onEdit={() => onEdit(staffMember)}
              onDelete={() => onDelete(staffMember)}
              onShiftSetting={() => onShiftSetting(staffMember)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
