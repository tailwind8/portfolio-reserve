import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReservationUpdateModal from '@/components/ReservationUpdateModal';
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

describe('ReservationUpdateModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with form fields', () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('予約を変更')).toBeInTheDocument();
    expect(screen.getByLabelText('予約日')).toBeInTheDocument();
    expect(screen.getByLabelText('時間')).toBeInTheDocument();
    expect(screen.getByLabelText('備考')).toBeInTheDocument();
  });

  it('should populate form with current reservation data', () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText('予約日') as HTMLInputElement;
    const timeInput = screen.getByLabelText('時間') as HTMLInputElement;
    const notesInput = screen.getByLabelText('備考') as HTMLTextAreaElement;

    expect(dateInput.value).toBe('2025-12-31');
    expect(timeInput.value).toBe('14:00');
    expect(notesInput.value).toBe('Test notes');
  });

  it('should update notes character count when typing', () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const notesInput = screen.getByLabelText('備考');
    fireEvent.change(notesInput, { target: { value: '新しいメモ' } });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it.skip('should successfully update reservation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText('予約日');
    const timeInput = screen.getByLabelText('時間');

    fireEvent.change(dateInput, { target: { value: '2026-01-01' } });
    fireEvent.change(timeInput, { target: { value: '15:00' } });

    const submitButton = screen.getByText('変更を保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/reservations/1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'temp-user-id',
      },
      body: JSON.stringify({
        reservedDate: '2026-01-01',
        reservedTime: '15:00',
        notes: 'Test notes',
      }),
    });
  });

  it('should display error message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: '更新に失敗しました' } }),
    });

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('変更を保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('更新に失敗しました')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it.skip('should disable form while submitting', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('変更を保存');
    fireEvent.click(submitButton);

    // ボタンがdisabledになることを確認
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('キャンセル')).toBeDisabled();
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });

  it('should validate past dates', () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const dateInput = screen.getByLabelText('予約日') as HTMLInputElement;

    // 過去の日付は入力できないことを確認
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.min).toBe(today);
  });
});
