/**
 * EditReservationModal.tsx のユニットテスト
 *
 * 予約編集モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import EditReservationModal from '@/components/admin/reservations/EditReservationModal';
import type { Reservation } from '@/components/admin/reservations/types';

describe('EditReservationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

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
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('edit-reservation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-title')).toHaveTextContent('予約を編集');
    });

    it('全てのフォームフィールドが表示される', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('edit-modal-menu-select')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-staff-select')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-date-picker')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-time-select')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-status-select')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-notes')).toBeInTheDocument();
    });

    it('予約データが初期値として設定される', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('edit-modal-menu-select')).toHaveValue('カット');
      expect(screen.getByTestId('edit-modal-staff-select')).toHaveValue('田中');
      expect(screen.getByTestId('edit-modal-date-picker')).toHaveValue('2025-01-20');
      expect(screen.getByTestId('edit-modal-time-select')).toHaveValue('14:00');
      expect(screen.getByTestId('edit-modal-status-select')).toHaveValue('CONFIRMED');
      expect(screen.getByTestId('edit-modal-notes')).toHaveValue('テスト備考');
    });

    it('キャンセルと更新ボタンが表示される', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('edit-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-submit-button')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('edit-modal-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('フォームフィールドを変更できる', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('edit-modal-menu-select'), { target: { value: 'カラー' } });
      fireEvent.change(screen.getByTestId('edit-modal-staff-select'), { target: { value: '佐藤' } });
      fireEvent.change(screen.getByTestId('edit-modal-date-picker'), { target: { value: '2025-01-25' } });
      fireEvent.change(screen.getByTestId('edit-modal-time-select'), { target: { value: '10:00' } });
      fireEvent.change(screen.getByTestId('edit-modal-status-select'), { target: { value: 'PENDING' } });
      fireEvent.change(screen.getByTestId('edit-modal-notes'), { target: { value: '変更した備考' } });

      expect(screen.getByTestId('edit-modal-menu-select')).toHaveValue('カラー');
      expect(screen.getByTestId('edit-modal-staff-select')).toHaveValue('佐藤');
      expect(screen.getByTestId('edit-modal-date-picker')).toHaveValue('2025-01-25');
      expect(screen.getByTestId('edit-modal-time-select')).toHaveValue('10:00');
      expect(screen.getByTestId('edit-modal-status-select')).toHaveValue('PENDING');
      expect(screen.getByTestId('edit-modal-notes')).toHaveValue('変更した備考');
    });
  });

  describe('フォーム送信', () => {
    it('更新ボタンをクリックするとonSubmitが呼ばれる', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('edit-modal-submit-button'));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        menu: 'カット',
        staff: '田中',
        date: '2025-01-20',
        time: '14:00',
        status: 'CONFIRMED',
        notes: 'テスト備考',
      });
    });

    it('変更したデータが正しく送信される', () => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('edit-modal-menu-select'), { target: { value: 'カラー' } });
      fireEvent.change(screen.getByTestId('edit-modal-status-select'), { target: { value: 'CANCELLED' } });
      fireEvent.click(screen.getByTestId('edit-modal-submit-button'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        menu: 'カラー',
        staff: '田中',
        date: '2025-01-20',
        time: '14:00',
        status: 'CANCELLED',
        notes: 'テスト備考',
      });
    });
  });

  describe('各ステータスの表示', () => {
    it.each([
      ['PENDING', '保留'],
      ['CONFIRMED', '確定'],
      ['CANCELLED', 'キャンセル'],
    ])('ステータス %s が選択可能', (status) => {
      render(
        <EditReservationModal
          reservation={mockReservation}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const statusSelect = screen.getByTestId('edit-modal-status-select');
      fireEvent.change(statusSelect, { target: { value: status } });
      expect(statusSelect).toHaveValue(status);
    });
  });
});
