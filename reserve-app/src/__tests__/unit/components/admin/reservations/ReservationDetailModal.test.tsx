/**
 * ReservationDetailModal.tsx のユニットテスト
 *
 * 予約詳細モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ReservationDetailModal from '@/components/admin/reservations/ReservationDetailModal';
import type { Reservation } from '@/components/admin/reservations/types';

describe('ReservationDetailModal', () => {
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnCancel = jest.fn();

  const mockReservation: Reservation = {
    id: 'test-reservation-1',
    reservedDate: '2025-01-20',
    reservedTime: '14:00',
    customerName: '山田太郎',
    menuName: 'カット',
    staffName: '田中',
    status: 'CONFIRMED',
    notes: 'テスト備考',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('reservation-detail-modal')).toBeInTheDocument();
      expect(screen.getByTestId('detail-modal-title')).toHaveTextContent('予約詳細');
    });

    it('予約情報が正しく表示される', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('detail-modal-customer')).toHaveTextContent('山田太郎');
      expect(screen.getByTestId('detail-modal-menu')).toHaveTextContent('カット');
      expect(screen.getByTestId('detail-modal-staff')).toHaveTextContent('田中');
      expect(screen.getByTestId('detail-modal-date')).toHaveTextContent('2025-01-20');
      expect(screen.getByTestId('detail-modal-time')).toHaveTextContent('14:00');
    });

    it('備考が表示される', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('detail-modal-notes')).toHaveTextContent('テスト備考');
    });

    it('備考がない場合は備考セクションが表示されない', () => {
      const reservationWithoutNotes: Reservation = {
        ...mockReservation,
        notes: undefined,
      };

      render(
        <ReservationDetailModal
          reservation={reservationWithoutNotes}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByTestId('detail-modal-notes')).not.toBeInTheDocument();
    });

    it('全てのアクションボタンが表示される', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('detail-modal-close-button')).toBeInTheDocument();
      expect(screen.getByTestId('detail-modal-edit-button')).toBeInTheDocument();
      expect(screen.getByTestId('detail-modal-cancel-button')).toBeInTheDocument();
    });
  });

  describe('ステータス表示', () => {
    it.each([
      ['CONFIRMED', '確定済み'],
      ['PENDING', '保留中'],
      ['CANCELLED', 'キャンセル済み'],
      ['COMPLETED', '完了'],
      ['NO_SHOW', '無断キャンセル'],
    ] as const)('ステータス %s が %s と表示される', (status, expectedText) => {
      const reservationWithStatus: Reservation = {
        ...mockReservation,
        status,
      };

      render(
        <ReservationDetailModal
          reservation={reservationWithStatus}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('detail-modal-status')).toHaveTextContent(expectedText);
    });
  });

  describe('ユーザーインタラクション', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByTestId('detail-modal-close-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('編集ボタンをクリックするとonEditが呼ばれる', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByTestId('detail-modal-edit-button'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
      render(
        <ReservationDetailModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByTestId('detail-modal-cancel-button'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
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
        notes: '初回来店',
      };

      render(
        <ReservationDetailModal
          reservation={anotherReservation}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByTestId('detail-modal-customer')).toHaveTextContent('佐藤花子');
      expect(screen.getByTestId('detail-modal-menu')).toHaveTextContent('カラー');
      expect(screen.getByTestId('detail-modal-staff')).toHaveTextContent('佐藤');
      expect(screen.getByTestId('detail-modal-date')).toHaveTextContent('2025-02-15');
      expect(screen.getByTestId('detail-modal-time')).toHaveTextContent('10:00');
      expect(screen.getByTestId('detail-modal-status')).toHaveTextContent('保留中');
      expect(screen.getByTestId('detail-modal-notes')).toHaveTextContent('初回来店');
    });
  });
});
