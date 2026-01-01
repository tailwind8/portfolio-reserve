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

const mockMenus = [
  { id: 'menu-1', name: 'Test Menu', price: 1000, duration: 60 },
  { id: 'menu-2', name: 'Test Menu 2', price: 2000, duration: 90 },
];

const mockStaff = [
  { id: 'staff-1', name: 'Test Staff' },
  { id: 'staff-2', name: 'Test Staff 2' },
];

describe('ReservationUpdateModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for /api/menus and /api/staff
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: mockMenus,
          }),
        });
      }

      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: mockStaff,
          }),
        });
      }

      // Default mock
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });
  });

  it('should render modal with title', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('reservation-update-modal')).toBeInTheDocument();
    });

    expect(screen.getByTestId('modal-title')).toHaveTextContent('予約変更');
  });

  it('should close modal when close button is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when cancel button is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should fetch and display menus and staff', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('menu-select')).toBeInTheDocument();
    });

    const menuSelect = screen.getByTestId('menu-select') as HTMLSelectElement;
    const staffSelect = screen.getByTestId('staff-select') as HTMLSelectElement;

    expect(menuSelect.options.length).toBe(2);
    expect(staffSelect.options.length).toBe(3); // 2 staff + 1 "指定なし" option
  });

  it('should display current month', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-month')).toBeInTheDocument();
    });

    const currentMonth = screen.getByTestId('current-month');
    const today = new Date();
    const expectedText = `${today.getFullYear()}年 ${today.getMonth() + 1}月`;

    expect(currentMonth).toHaveTextContent(expectedText);
  });

  it('should navigate to next month when next button is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('next-month-button')).toBeInTheDocument();
    });

    const nextButton = screen.getByTestId('next-month-button');
    const currentMonth = screen.getByTestId('current-month');

    fireEvent.click(nextButton);

    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1);
    const expectedText = `${nextMonthDate.getFullYear()}年 ${nextMonthDate.getMonth() + 1}月`;

    expect(currentMonth).toHaveTextContent(expectedText);
  });

  it('should navigate to previous month when prev button is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('prev-month-button')).toBeInTheDocument();
    });

    const prevButton = screen.getByTestId('prev-month-button');
    const currentMonth = screen.getByTestId('current-month');

    fireEvent.click(prevButton);

    const today = new Date();
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1);
    const expectedText = `${prevMonthDate.getFullYear()}年 ${prevMonthDate.getMonth() + 1}月`;

    expect(currentMonth).toHaveTextContent(expectedText);
  });

  it('should select a day when calendar day is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('next-month-button')).toBeInTheDocument();
    });

    // Get next month to ensure we have future dates
    const nextButton = screen.getByTestId('next-month-button');
    fireEvent.click(nextButton);

    const dayButton = screen.getByTestId('calendar-day-15');
    fireEvent.click(dayButton);

    expect(dayButton).toHaveClass('bg-blue-500');
  });

  it('should show time selection after day is selected', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('next-month-button')).toBeInTheDocument();
    });

    // Get next month
    const nextButton = screen.getByTestId('next-month-button');
    fireEvent.click(nextButton);

    const dayButton = screen.getByTestId('calendar-day-15');
    fireEvent.click(dayButton);

    expect(screen.getByTestId('time-selection-section')).toBeInTheDocument();
  });

  it('should select time slot when time button is clicked', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('next-month-button')).toBeInTheDocument();
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

    expect(timeButton).toHaveClass('bg-blue-500');
  });

  it('should update notes character count when typing', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('notes-input')).toBeInTheDocument();
    });

    const notesInput = screen.getByTestId('notes-input');
    fireEvent.change(notesInput, { target: { value: '新しいメモ' } });

    expect(screen.getByTestId('notes-counter')).toHaveTextContent('5/500');
  });

  it('should successfully update reservation', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockMenus }),
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockStaff }),
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

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
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

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('success-message')).toHaveTextContent('予約を更新しました');
  });

  it('should display error message on failure', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockMenus }),
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockStaff }),
        });
      }
      if (url.includes('/api/reservations/1')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            success: false,
            error: { message: '更新に失敗しました' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
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

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('更新に失敗しました');
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should disable submit button while submitting', async () => {
    let resolveSubmit: (value: unknown) => void;
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve;
    });

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/menus')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockMenus }),
        });
      }
      if (url.includes('/api/staff')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockStaff }),
        });
      }
      if (url.includes('/api/reservations/1')) {
        return submitPromise.then(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          })
        );
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
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

    const submitButton = screen.getByTestId('submit-button');
    const cancelButton = screen.getByTestId('cancel-button');

    fireEvent.click(submitButton);

    // ボタンがdisabledになることを確認
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText('更新中...')).toBeInTheDocument();

    // Resolve the promise
    resolveSubmit!({});
  });

  it('should change menu selection', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('menu-select')).toBeInTheDocument();
    });

    const menuSelect = screen.getByTestId('menu-select') as HTMLSelectElement;
    fireEvent.change(menuSelect, { target: { value: 'menu-2' } });

    expect(menuSelect.value).toBe('menu-2');
  });

  it('should change staff selection', async () => {
    render(
      <ReservationUpdateModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('staff-select')).toBeInTheDocument();
    });

    const staffSelect = screen.getByTestId('staff-select') as HTMLSelectElement;
    fireEvent.change(staffSelect, { target: { value: 'staff-2' } });

    expect(staffSelect.value).toBe('staff-2');
  });
});
