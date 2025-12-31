import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationCard from '@/components/ReservationCard';
import type { Reservation } from '@/types/api';

// Use a future date to ensure buttons are enabled
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7); // 7 days in future
const futureDateString = futureDate.toISOString().split('T')[0];

const mockReservation: Reservation = {
  id: 'reservation-1',
  userId: 'user-1',
  staffId: 'staff-1',
  menuId: 'menu-1',
  reservedDate: futureDateString,
  reservedTime: '14:00',
  status: 'CONFIRMED',
  notes: 'テスト備考',
  user: {
    id: 'user-1',
    name: '山田太郎',
    email: 'test@example.com',
  },
  staff: {
    id: 'staff-1',
    name: '田中花子',
  },
  menu: {
    id: 'menu-1',
    name: 'カット',
    price: 5000,
    duration: 60,
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('ReservationCard', () => {
  it('should render reservation details correctly', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    render(<ReservationCard reservation={mockReservation} onEdit={onEdit} onCancel={onCancel} />);

    // Check date and time
    expect(screen.getByText('14:00')).toBeInTheDocument();

    // Check menu name
    expect(screen.getByText('カット')).toBeInTheDocument();

    // Check price
    expect(screen.getByText('¥5,000')).toBeInTheDocument();

    // Check duration
    expect(screen.getByText('60分')).toBeInTheDocument();

    // Check staff name
    expect(screen.getByText('田中花子')).toBeInTheDocument();

    // Check notes
    expect(screen.getByText('テスト備考')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    render(<ReservationCard reservation={mockReservation} onEdit={onEdit} onCancel={onCancel} />);

    const editButton = screen.getByRole('button', { name: '予約を変更' });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockReservation);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    render(<ReservationCard reservation={mockReservation} onEdit={onEdit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledWith(mockReservation);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons for cancelled reservations', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    const cancelledReservation = {
      ...mockReservation,
      status: 'CANCELLED' as const,
    };

    render(<ReservationCard reservation={cancelledReservation} onEdit={onEdit} onCancel={onCancel} />);

    const editButton = screen.getByRole('button', { name: '予約を変更' });
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    expect(editButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should disable buttons for completed reservations', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    const completedReservation = {
      ...mockReservation,
      status: 'COMPLETED' as const,
    };

    render(<ReservationCard reservation={completedReservation} onEdit={onEdit} onCancel={onCancel} />);

    const editButton = screen.getByRole('button', { name: '予約を変更' });
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });

    expect(editButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should not render notes section when notes is null', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    const reservationWithoutNotes = {
      ...mockReservation,
      notes: null,
    };

    render(<ReservationCard reservation={reservationWithoutNotes} onEdit={onEdit} onCancel={onCancel} />);

    expect(screen.queryByText('備考')).not.toBeInTheDocument();
  });

  it('should render StatusBadge with correct status', () => {
    const onEdit = jest.fn();
    const onCancel = jest.fn();

    render(<ReservationCard reservation={mockReservation} onEdit={onEdit} onCancel={onCancel} />);

    const statusBadge = screen.getByText('予約確定');
    expect(statusBadge).toBeInTheDocument();
  });
});
