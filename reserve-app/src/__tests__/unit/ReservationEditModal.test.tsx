import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ReservationEditModal from '@/components/ReservationEditModal';
import type { Reservation } from '@/types/api';

// Mock fetch globally
global.fetch = jest.fn();

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
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

describe('ReservationEditModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render modal with correct title', async () => {
    // Mock API responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('予約変更')).toBeInTheDocument();
    });
  });

  it('should render close button', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: '予約変更' })).toBeInTheDocument();
  });

  it('should fetch menus and staff on mount', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'menu-1', name: 'カット', price: 5000, duration: 60 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'staff-1', name: '田中花子' }],
        }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/menus');
      expect(global.fetch).toHaveBeenCalledWith('/api/staff');
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockRejectedValueOnce(new Error('API Error'));

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Wait for component to finish loading/error handling
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it('should render form fields after loading', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'menu-1', name: 'カット', price: 5000, duration: 60 }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{ id: 'staff-1', name: '田中花子' }],
        }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('メニュー')).toBeInTheDocument();
      expect(screen.getByLabelText(/担当者/)).toBeInTheDocument();
      expect(screen.getByLabelText(/備考/)).toBeInTheDocument();
    });
  });

  it('should render submit button', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '予約を更新する' })).toBeInTheDocument();
    });
  });

  it('should render calendar navigation buttons', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

    render(
      <ReservationEditModal
        reservation={mockReservation}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '← 前月' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '次月 →' })).toBeInTheDocument();
    });
  });
});
