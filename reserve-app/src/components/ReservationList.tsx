import ReservationCard from './ReservationCard';
import Card from './Card';
import type { Reservation } from '@/types/api';

interface ReservationListProps {
  reservations: Reservation[];
  type: 'upcoming' | 'past';
  onUpdate: () => void;
}

export default function ReservationList({
  reservations,
  type,
  onUpdate,
}: ReservationListProps) {
  if (reservations.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-900">
            {type === 'upcoming' ? '今後の予約はありません' : '過去の予約はありません'}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {type === 'upcoming' && '新しい予約を作成しましょう'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          type={type}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
