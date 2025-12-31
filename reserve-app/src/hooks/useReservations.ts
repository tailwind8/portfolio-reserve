import { useState, useEffect, useCallback } from 'react';
import type { Reservation } from '@/types/api';

interface UseReservationsReturn {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reservations', {
        headers: {
          'x-user-id': 'temp-user-id', // TODO: 実際の認証トークンに置き換え
        },
      });

      if (!response.ok) {
        throw new Error('予約情報の取得に失敗しました');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '予約情報の取得に失敗しました');
      }

      setReservations(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return {
    reservations,
    isLoading,
    error,
    refetch: fetchReservations,
  };
}
