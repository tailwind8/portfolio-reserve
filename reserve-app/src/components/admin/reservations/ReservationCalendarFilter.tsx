'use client';

import Card from '@/components/Card';
import type { ReservationCalendarFilterProps } from './types';

/**
 * カレンダー表示用フィルターコンポーネント
 */
export default function ReservationCalendarFilter({
  staffFilter,
  menuFilter,
  statusFilter,
  uniqueStaff,
  uniqueMenus,
  onStaffChange,
  onMenuChange,
  onStatusChange,
}: ReservationCalendarFilterProps) {
  return (
    <Card className="mb-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">スタッフ</label>
          <select
            data-testid="staff-filter"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={staffFilter}
            onChange={(e) => onStaffChange(e.target.value)}
          >
            <option value="all">全スタッフ</option>
            {uniqueStaff.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">メニュー</label>
          <select
            data-testid="menu-filter"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={menuFilter}
            onChange={(e) => onMenuChange(e.target.value)}
          >
            <option value="all">全メニュー</option>
            {uniqueMenus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
          <select
            data-testid="status-filter-calendar"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">全ステータス</option>
            <option value="confirmed">確定済み</option>
            <option value="pending">保留中</option>
            <option value="cancelled">キャンセル済み</option>
            <option value="completed">完了</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
