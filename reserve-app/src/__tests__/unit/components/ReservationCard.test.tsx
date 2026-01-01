import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationCard from '@/components/ReservationCard';
import type { Reservation } from '@/types/api';

// Mock fetch
global.fetch = jest.fn();

const mockReservation: Reservation = {
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
};

describe('ReservationCard', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for ReservationUpdateModal (which is opened by clicking edit button)
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: 'menu-1', name: 'Test Menu', price: 1000, duration: 60 },
              { id: 'menu-2', name: 'Test Menu 2', price: 2000, duration: 90 },
            ],
          }),
        });
      }

      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [
              { id: 'staff-1', name: 'Test Staff' },
              { id: 'staff-2', name: 'Test Staff 2' },
            ],
          }),
        });
      }

      // Default mock for cancellation
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  it.skip('should render reservation details', () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    expect(screen.getByText('2025-12-31 14:00')).toBeInTheDocument();
    expect(screen.getByText('Test Menu')).toBeInTheDocument();
    expect(screen.getByText('Test Staff')).toBeInTheDocument();
    expect(screen.getByText('60分')).toBeInTheDocument();
    expect(screen.getByText('¥1,000')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
  });

  it('should render status badge for CONFIRMED status', () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    expect(screen.getByText('予約確定')).toBeInTheDocument();
    expect(screen.getByText('予約確定').className).toContain('bg-green-100');
  });

  it('should render status badge for PENDING status', () => {
    const pendingReservation = { ...mockReservation, status: 'PENDING' as const };
    render(<ReservationCard reservation={pendingReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    expect(screen.getByText('予約待ち')).toBeInTheDocument();
    expect(screen.getByText('予約待ち').className).toContain('bg-yellow-100');
  });

  it('should render status badge for CANCELLED status', () => {
    const cancelledReservation = { ...mockReservation, status: 'CANCELLED' as const };
    render(<ReservationCard reservation={cancelledReservation} type="past" onUpdate={mockOnUpdate} />);

    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('キャンセル').className).toContain('bg-red-100');
  });

  it('should show edit and cancel buttons for upcoming reservations', () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    expect(screen.getByText('変更')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  it.skip('should not show edit and cancel buttons for cancelled reservations', () => {
    const cancelledReservation = { ...mockReservation, status: 'CANCELLED' as const };
    render(<ReservationCard reservation={cancelledReservation} type="past" onUpdate={mockOnUpdate} />);

    expect(screen.queryByText('変更')).not.toBeInTheDocument();
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('should not show edit and cancel buttons for completed reservations', () => {
    const completedReservation = { ...mockReservation, status: 'COMPLETED' as const };
    render(<ReservationCard reservation={completedReservation} type="past" onUpdate={mockOnUpdate} />);

    expect(screen.queryByText('変更')).not.toBeInTheDocument();
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
  });

  it('should open update modal when edit button is clicked', async () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    const editButton = screen.getByText('変更');
    fireEvent.click(editButton);

    // モーダルが開いたことを確認（非同期処理を待つ）
    await waitFor(() => {
      expect(screen.getByTestId('reservation-update-modal')).toBeInTheDocument();
    });
  });

  it('should close update modal when close button is clicked', async () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    const editButton = screen.getByText('変更');
    fireEvent.click(editButton);

    // モーダルが開いたことを確認
    await waitFor(() => {
      expect(screen.getByTestId('reservation-update-modal')).toBeInTheDocument();
    });

    // モーダルを閉じる
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // モーダルが閉じたことを確認
    await waitFor(() => {
      expect(screen.queryByTestId('reservation-update-modal')).not.toBeInTheDocument();
    });
  });

  it('should call onUpdate when reservation update succeeds', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ id: 'menu-1', name: 'Test Menu', price: 1000, duration: 60 }],
          }),
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: [{ id: 'staff-1', name: 'Test Staff' }],
          }),
        });
      }
      if (url.includes('/api/reservations/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    const editButton = screen.getByText('変更');
    fireEvent.click(editButton);

    // モーダルが開いたことを確認
    await waitFor(() => {
      expect(screen.getByTestId('reservation-update-modal')).toBeInTheDocument();
    });

    // Get next month
    const nextButton = screen.getByTestId('next-month-button');
    fireEvent.click(nextButton);

    // Select day
    const dayButton = screen.getByTestId('calendar-day-15');
    fireEvent.click(dayButton);

    // Select time
    const timeButton = screen.getByTestId('time-slot-10:00');
    fireEvent.click(timeButton);

    // Submit
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // onUpdateが呼ばれることを確認
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should open cancellation dialog when cancel button is clicked', () => {
    render(<ReservationCard reservation={mockReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    // ダイアログが開いたことを確認
    expect(screen.getByText('予約をキャンセルしますか?')).toBeInTheDocument();
  });

  it('should not render notes section if notes is empty', () => {
    const noNotesReservation = { ...mockReservation, notes: null };
    render(<ReservationCard reservation={noNotesReservation} type="upcoming" onUpdate={mockOnUpdate} />);

    expect(screen.queryByText('備考')).not.toBeInTheDocument();
  });
});
