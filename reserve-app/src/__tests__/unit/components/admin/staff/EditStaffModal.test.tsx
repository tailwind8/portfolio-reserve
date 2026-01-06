/**
 * EditStaffModal.tsx のユニットテスト
 *
 * スタッフ編集モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import EditStaffModal from '@/components/admin/staff/EditStaffModal';
import type { StaffFormData } from '@/components/admin/staff/types';

describe('EditStaffModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
  const mockOnFormChange = jest.fn();

  const mockFormData: StaffFormData = {
    name: '田中太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-staff-modal')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-title')).toHaveTextContent('スタッフを編集');
    });

    it('全てのフォームフィールドが表示される', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-modal-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-phone-input')).toBeInTheDocument();
    });

    it('フォームデータが初期値として設定される', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-modal-name-input')).toHaveValue('田中太郎');
      expect(screen.getByTestId('edit-modal-email-input')).toHaveValue('tanaka@example.com');
      expect(screen.getByTestId('edit-modal-phone-input')).toHaveValue('090-1234-5678');
    });

    it('キャンセルと保存ボタンが表示される', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('edit-modal-submit-button')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('edit-modal-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('名前を変更するとonFormChangeが呼ばれる', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('edit-modal-name-input'), { target: { value: '佐藤花子' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...mockFormData, name: '佐藤花子' });
    });

    it('メールアドレスを変更するとonFormChangeが呼ばれる', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('edit-modal-email-input'), { target: { value: 'sato@example.com' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...mockFormData, email: 'sato@example.com' });
    });

    it('電話番号を変更するとonFormChangeが呼ばれる', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('edit-modal-phone-input'), { target: { value: '090-9999-8888' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...mockFormData, phone: '090-9999-8888' });
    });
  });

  describe('フォーム送信', () => {
    it('フォームを送信するとonSubmitが呼ばれる', () => {
      render(
        <EditStaffModal
          formData={mockFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('edit-modal-submit-button'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('異なるフォームデータの表示', () => {
    it('別のフォームデータが正しく表示される', () => {
      const anotherFormData: StaffFormData = {
        name: '山田次郎',
        email: 'yamada@example.com',
        phone: '080-1111-2222',
      };

      render(
        <EditStaffModal
          formData={anotherFormData}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-modal-name-input')).toHaveValue('山田次郎');
      expect(screen.getByTestId('edit-modal-email-input')).toHaveValue('yamada@example.com');
      expect(screen.getByTestId('edit-modal-phone-input')).toHaveValue('080-1111-2222');
    });

    it('電話番号がない場合も正しく表示される', () => {
      const formDataWithoutPhone: StaffFormData = {
        name: '鈴木一郎',
        email: 'suzuki@example.com',
        phone: '',
      };

      render(
        <EditStaffModal
          formData={formDataWithoutPhone}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('edit-modal-name-input')).toHaveValue('鈴木一郎');
      expect(screen.getByTestId('edit-modal-email-input')).toHaveValue('suzuki@example.com');
      expect(screen.getByTestId('edit-modal-phone-input')).toHaveValue('');
    });
  });
});
