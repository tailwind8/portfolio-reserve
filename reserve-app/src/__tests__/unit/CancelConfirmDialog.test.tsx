import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CancelConfirmDialog from '@/components/CancelConfirmDialog';
import type { Reservation } from '@/types/api';

const mockReservation: Reservation = {
  id: 'reservation-1',
  userId: 'user-1',
  staffId: 'staff-1',
  menuId: 'menu-1',
  reservedDate: '2025-12-25',
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

describe('CancelConfirmDialog', () => {
  it('should render dialog with correct title', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.getByText('予約をキャンセルしますか？')).toBeInTheDocument();
  });

  it('should display reservation summary', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    // Check menu name
    expect(screen.getByText('カット')).toBeInTheDocument();

    // Check price
    expect(screen.getByText(/¥5,000/)).toBeInTheDocument();

    // Check duration
    expect(screen.getByText(/60分/)).toBeInTheDocument();

    // Check staff name
    expect(screen.getByText('田中花子')).toBeInTheDocument();
  });

  it('should display warning message', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.getByText('この操作は取り消せません。本当にキャンセルしますか？')).toBeInTheDocument();
  });

  it('should call onCancel when back button is clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const backButton = screen.getByRole('button', { name: '戻る' });
    fireEvent.click(backButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when cancel button is clicked', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: 'キャンセルする' });
    fireEvent.click(cancelButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('should render both action buttons', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <CancelConfirmDialog reservation={mockReservation} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセルする' })).toBeInTheDocument();
  });
});
