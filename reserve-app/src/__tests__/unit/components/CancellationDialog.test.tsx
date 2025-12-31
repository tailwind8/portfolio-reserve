import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CancellationDialog from '@/components/CancellationDialog';
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

describe('CancellationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with reservation details', () => {
    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('予約をキャンセルしますか?')).toBeInTheDocument();
    expect(screen.getByText('2025-12-31 14:00')).toBeInTheDocument();
    expect(screen.getByText('Test Menu')).toBeInTheDocument();
    expect(screen.getByText('Test Staff')).toBeInTheDocument();
  });

  it('should render cancellation reason textarea', () => {
    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText('キャンセル理由をお聞かせください');
    expect(textarea).toBeInTheDocument();
  });

  it('should update character count when typing in textarea', () => {
    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText('キャンセル理由をお聞かせください');
    fireEvent.change(textarea, { target: { value: 'テスト理由' } });

    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('should call onClose when back button is clicked', () => {
    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const backButton = screen.getByText('戻る');
    fireEvent.click(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should successfully cancel reservation', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('キャンセルする');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/reservations/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'temp-user-id',
      },
      body: JSON.stringify({ cancellationReason: '' }),
    });
  });

  it('should send cancellation reason if provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const textarea = screen.getByPlaceholderText('キャンセル理由をお聞かせください');
    fireEvent.change(textarea, { target: { value: '予定が変更になりました' } });

    const cancelButton = screen.getByText('キャンセルする');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/reservations/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'temp-user-id',
        },
        body: JSON.stringify({ cancellationReason: '予定が変更になりました' }),
      });
    });
  });

  it('should display error message on failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'キャンセルに失敗しました' } }),
    });

    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('キャンセルする');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('キャンセルに失敗しました')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should disable buttons while submitting', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <CancellationDialog
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('キャンセルする');
    fireEvent.click(cancelButton);

    // ボタンがdisabledになることを確認
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('戻る')).toBeDisabled();
    expect(screen.getByText('キャンセル中...')).toBeInTheDocument();
  });
});
