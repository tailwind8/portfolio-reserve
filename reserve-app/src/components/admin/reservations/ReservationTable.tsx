'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { ReservationTableProps, Reservation } from './types';
import { STATUS_STYLES, STATUS_LABELS } from './utils';

/**
 * ステータスバッジコンポーネント
 */
function StatusBadge({ status }: { status: Reservation['status'] }) {
  return (
    <span
      data-testid="reservation-status"
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * 予約一覧テーブルコンポーネント
 */
export default function ReservationTable({
  reservations,
  onShowDetail,
  onEdit,
  onDelete,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <p data-testid="empty-message" className="text-gray-500">
            予約がありません
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table data-testid="reservations-table" className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">予約日時</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">顧客名</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">メニュー</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">スタッフ</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <tr
                key={reservation.id}
                data-testid="reservation-row"
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onShowDetail(reservation)}
              >
                <td className="px-4 py-3">
                  <div data-testid="reservation-date" className="text-sm font-medium text-gray-900">
                    {reservation.reservedDate}
                  </div>
                  <div data-testid="reservation-time" className="text-sm text-gray-500">
                    {reservation.reservedTime}
                  </div>
                </td>
                <td data-testid="reservation-customer" className="px-4 py-3 text-sm text-gray-900">
                  {reservation.customerName}
                </td>
                <td data-testid="reservation-menu" className="px-4 py-3 text-sm text-gray-900">
                  {reservation.menuName}
                </td>
                <td data-testid="reservation-staff" className="px-4 py-3 text-sm text-gray-900">
                  {reservation.staffName}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={reservation.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      data-testid="edit-button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(reservation);
                      }}
                    >
                      編集
                    </Button>
                    <Button
                      data-testid="delete-button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(reservation);
                      }}
                    >
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
