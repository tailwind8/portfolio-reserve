import ReservationCard from './ReservationCard';
import EmptyState from './EmptyState';
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
      <EmptyState
        icon={
          <svg
            className="h-12 w-12"
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
        }
        title={type === 'upcoming' ? '今後の予約はありません' : '過去の予約はありません'}
        description={type === 'upcoming' ? '新しい予約を作成しましょう' : undefined}
      />
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
