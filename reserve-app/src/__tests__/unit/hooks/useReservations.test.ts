import { renderHook, waitFor } from '@testing-library/react';
import { useReservations } from '@/hooks/useReservations';
import type { Reservation } from '@/types/api';

// Mock fetch
global.fetch = jest.fn();

const mockReservations: Reservation[] = [
  {
    id: '1',
    userId: 'user-1',
    staffId: 'staff-1',
    menuId: 'menu-1',
    reservedDate: '2025-12-31',
    reservedTime: '14:00',
    status: 'CONFIRMED',
    notes: 'Test reservation',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    staff: { id: 'staff-1', name: 'Test Staff' },
    menu: { id: 'menu-1', name: 'Test Menu', price: 1000, duration: 60 },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('useReservations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch reservations successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockReservations }),
    });

    const { result } = renderHook(() => useReservations());

    // 初期状態: ローディング中
    expect(result.current.isLoading).toBe(true);
    expect(result.current.reservations).toEqual([]);
    expect(result.current.error).toBeNull();

    // データ取得完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 取得成功
    expect(result.current.reservations).toEqual(mockReservations);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/reservations', {
      headers: { 'x-user-id': 'temp-user-id' },
    });
  });

  it.skip('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Failed to fetch' } }),
    });

    const { result } = renderHook(() => useReservations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.reservations).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should handle network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReservations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.reservations).toEqual([]);
    expect(result.current.error).toBe('Network error');
  });

  it('should refetch reservations when refetch is called', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockReservations }),
    });

    const { result } = renderHook(() => useReservations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // refetch実行
    result.current.refetch();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
