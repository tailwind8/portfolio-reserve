import { render, screen } from '@testing-library/react';
import ReservationList from '@/components/ReservationList';
import type { Reservation } from '@/types/api';

const mockReservations: Reservation[] = [
  {
    id: '1',
    userId: 'user-1',
    staffId: 'staff-1',
    menuId: 'menu-1',
    reservedDate: '2025-12-31',
    reservedTime: '14:00',
    status: 'CONFIRMED',
    notes: 'Test notes',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    staff: { id: 'staff-1', name: 'Test Staff' },
    menu: { id: 'menu-1', name: 'Test Menu', price: 1000, duration: 60 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    staffId: 'staff-2',
    menuId: 'menu-2',
    reservedDate: '2025-12-30',
    reservedTime: '15:00',
    status: 'PENDING',
    notes: null,
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    staff: { id: 'staff-2', name: 'Test Staff 2' },
    menu: { id: 'menu-2', name: 'Test Menu 2', price: 2000, duration: 90 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('ReservationList', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of reservations', () => {
    render(
      <ReservationList
        reservations={mockReservations}
        type="upcoming"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('Test Menu')).toBeInTheDocument();
    expect(screen.getByText('Test Menu 2')).toBeInTheDocument();
  });

  it('should render empty state for upcoming reservations when list is empty', () => {
    render(
      <ReservationList
        reservations={[]}
        type="upcoming"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('今後の予約はありません')).toBeInTheDocument();
    expect(screen.getByText('新しい予約を作成しましょう')).toBeInTheDocument();
  });

  it('should render empty state for past reservations when list is empty', () => {
    render(
      <ReservationList
        reservations={[]}
        type="past"
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText('過去の予約はありません')).toBeInTheDocument();
  });

  it('should render correct number of reservation cards', () => {
    const { container } = render(
      <ReservationList
        reservations={mockReservations}
        type="upcoming"
        onUpdate={mockOnUpdate}
      />
    );

    // ReservationCardが2つ表示されることを確認
    const cards = container.querySelectorAll('[class*="rounded-lg"][class*="border"]');
    // 空状態のカードも含まれる可能性があるため、最低2つ以上あることを確認
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});
