/**
 * AddReservationModal.tsx のユニットテスト
 *
 * 予約追加モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AddReservationModal from '@/components/admin/reservations/AddReservationModal';

describe('AddReservationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('add-reservation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-title')).toHaveTextContent('新規予約を追加');
    });

    it('全てのフォームフィールドが表示される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('add-modal-customer-select')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-menu-select')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-staff-select')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-date-picker')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-time-select')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-notes')).toBeInTheDocument();
    });

    it('キャンセルと作成ボタンが表示される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByTestId('add-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-submit-button')).toBeInTheDocument();
    });

    it('prefilledDateとprefilledTimeが設定される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          prefilledDate="2025-01-20"
          prefilledTime="14:00"
        />
      );

      expect(screen.getByTestId('add-modal-date-picker')).toHaveValue('2025-01-20');
      expect(screen.getByTestId('add-modal-time-select')).toHaveValue('14:00');
    });
  });

  describe('ユーザーインタラクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('add-modal-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('フォームフィールドに入力できる', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-customer-select'), { target: { value: '山田太郎' } });
      fireEvent.change(screen.getByTestId('add-modal-menu-select'), { target: { value: 'カット' } });
      fireEvent.change(screen.getByTestId('add-modal-staff-select'), { target: { value: '田中' } });
      fireEvent.change(screen.getByTestId('add-modal-date-picker'), { target: { value: '2025-01-20' } });
      fireEvent.change(screen.getByTestId('add-modal-time-select'), { target: { value: '14:00' } });
      fireEvent.change(screen.getByTestId('add-modal-notes'), { target: { value: 'テスト備考' } });

      expect(screen.getByTestId('add-modal-customer-select')).toHaveValue('山田太郎');
      expect(screen.getByTestId('add-modal-menu-select')).toHaveValue('カット');
      expect(screen.getByTestId('add-modal-staff-select')).toHaveValue('田中');
      expect(screen.getByTestId('add-modal-date-picker')).toHaveValue('2025-01-20');
      expect(screen.getByTestId('add-modal-time-select')).toHaveValue('14:00');
      expect(screen.getByTestId('add-modal-notes')).toHaveValue('テスト備考');
    });
  });

  describe('バリデーション', () => {
    it('必須項目が未入力の場合、バリデーションエラーが表示される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByTestId('add-modal-submit-button'));

      expect(screen.getByTestId('add-modal-validation-error')).toHaveTextContent('必須項目を入力してください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('顧客のみ入力した場合、バリデーションエラーが表示される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-customer-select'), { target: { value: '山田太郎' } });
      fireEvent.click(screen.getByTestId('add-modal-submit-button'));

      expect(screen.getByTestId('add-modal-validation-error')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('フォーム送信', () => {
    it('全ての必須項目を入力すると、onSubmitが呼ばれる', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-customer-select'), { target: { value: '山田太郎' } });
      fireEvent.change(screen.getByTestId('add-modal-menu-select'), { target: { value: 'カット' } });
      fireEvent.change(screen.getByTestId('add-modal-staff-select'), { target: { value: '田中' } });
      fireEvent.change(screen.getByTestId('add-modal-date-picker'), { target: { value: '2025-01-20' } });
      fireEvent.change(screen.getByTestId('add-modal-time-select'), { target: { value: '14:00' } });

      fireEvent.click(screen.getByTestId('add-modal-submit-button'));

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        customer: '山田太郎',
        menu: 'カット',
        staff: '田中',
        date: '2025-01-20',
        time: '14:00',
        notes: '',
      });
    });

    it('備考を含めたフォームデータが正しく送信される', () => {
      render(
        <AddReservationModal
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-customer-select'), { target: { value: '佐藤花子' } });
      fireEvent.change(screen.getByTestId('add-modal-menu-select'), { target: { value: 'カラー' } });
      fireEvent.change(screen.getByTestId('add-modal-staff-select'), { target: { value: '佐藤' } });
      fireEvent.change(screen.getByTestId('add-modal-date-picker'), { target: { value: '2025-01-25' } });
      fireEvent.change(screen.getByTestId('add-modal-time-select'), { target: { value: '10:00' } });
      fireEvent.change(screen.getByTestId('add-modal-notes'), { target: { value: '初回のお客様' } });

      fireEvent.click(screen.getByTestId('add-modal-submit-button'));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        customer: '佐藤花子',
        menu: 'カラー',
        staff: '佐藤',
        date: '2025-01-25',
        time: '10:00',
        notes: '初回のお客様',
      });
    });
  });
});
