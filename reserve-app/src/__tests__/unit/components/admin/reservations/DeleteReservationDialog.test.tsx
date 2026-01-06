/**
 * DeleteReservationDialog.tsx のユニットテスト
 *
 * 予約削除確認ダイアログコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DeleteReservationDialog from '@/components/admin/reservations/DeleteReservationDialog';
import type { Reservation } from '@/components/admin/reservations/types';

describe('DeleteReservationDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const mockReservation: Reservation = {
    id: 'test-reservation-1',
    reservedDate: '2025-01-20',
    reservedTime: '14:00',
    customerName: '山田太郎',
    menuName: 'カット',
    staffName: '田中',
    status: 'CONFIRMED',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('ダイアログが正しく表示される', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-title')).toHaveTextContent('予約を削除しますか？');
    });

    it('予約情報が表示される', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('delete-dialog-date')).toHaveTextContent('2025-01-20 14:00');
      expect(screen.getByTestId('delete-dialog-customer')).toHaveTextContent('山田太郎');
      expect(screen.getByTestId('delete-dialog-menu')).toHaveTextContent('カット');
    });

    it('警告メッセージが表示される', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('delete-dialog-warning')).toHaveTextContent('この操作は取り消せません');
    });

    it('キャンセルと削除ボタンが表示される', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('delete-dialog-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-confirm-button')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('戻るボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByTestId('delete-dialog-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('削除するボタンをクリックするとonConfirmが呼ばれる', () => {
      render(
        <DeleteReservationDialog
          reservation={mockReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByTestId('delete-dialog-confirm-button'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('異なる予約データの表示', () => {
    it('別の予約データが正しく表示される', () => {
      const anotherReservation: Reservation = {
        id: 'test-reservation-2',
        reservedDate: '2025-02-15',
        reservedTime: '10:00',
        customerName: '佐藤花子',
        menuName: 'カラー',
        staffName: '佐藤',
        status: 'PENDING',
      };

      render(
        <DeleteReservationDialog
          reservation={anotherReservation}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByTestId('delete-dialog-date')).toHaveTextContent('2025-02-15 10:00');
      expect(screen.getByTestId('delete-dialog-customer')).toHaveTextContent('佐藤花子');
      expect(screen.getByTestId('delete-dialog-menu')).toHaveTextContent('カラー');
    });
  });
});
