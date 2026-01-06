/**
 * AddStaffModal.tsx のユニットテスト
 *
 * スタッフ追加モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import AddStaffModal from '@/components/admin/staff/AddStaffModal';
import type { StaffFormData } from '@/components/admin/staff/types';

describe('AddStaffModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
  const mockOnFormChange = jest.fn();

  const defaultFormData: StaffFormData = {
    name: '',
    email: '',
    phone: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('add-staff-modal')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-title')).toHaveTextContent('スタッフを追加');
    });

    it('全てのフォームフィールドが表示される', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('add-modal-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-email-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-phone-input')).toBeInTheDocument();
    });

    it('キャンセルと追加ボタンが表示される', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('add-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-modal-submit-button')).toBeInTheDocument();
    });

    it('フォームデータが初期値として設定される', () => {
      const formDataWithValues: StaffFormData = {
        name: '佐藤花子',
        email: 'sato@example.com',
        phone: '090-1234-5678',
      };

      render(
        <AddStaffModal
          formData={formDataWithValues}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('add-modal-name-input')).toHaveValue('佐藤花子');
      expect(screen.getByTestId('add-modal-email-input')).toHaveValue('sato@example.com');
      expect(screen.getByTestId('add-modal-phone-input')).toHaveValue('090-1234-5678');
    });
  });

  describe('エラー表示', () => {
    it('エラーがない場合はエラーメッセージが表示されない', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('add-modal-validation-error')).not.toBeInTheDocument();
    });

    it('エラーがある場合はエラーメッセージが表示される', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error="名前を入力してください"
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('add-modal-validation-error')).toHaveTextContent('名前を入力してください');
    });
  });

  describe('ユーザーインタラクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('add-modal-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('名前を入力するとonFormChangeが呼ばれる', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-name-input'), { target: { value: '田中太郎' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...defaultFormData, name: '田中太郎' });
    });

    it('メールアドレスを入力するとonFormChangeが呼ばれる', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-email-input'), { target: { value: 'tanaka@example.com' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...defaultFormData, email: 'tanaka@example.com' });
    });

    it('電話番号を入力するとonFormChangeが呼ばれる', () => {
      render(
        <AddStaffModal
          formData={defaultFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('add-modal-phone-input'), { target: { value: '090-9999-8888' } });
      expect(mockOnFormChange).toHaveBeenCalledWith({ ...defaultFormData, phone: '090-9999-8888' });
    });
  });

  describe('フォーム送信', () => {
    it('必須項目を入力してフォームを送信するとonSubmitが呼ばれる', () => {
      const filledFormData: StaffFormData = {
        name: '田中太郎',
        email: 'tanaka@example.com',
        phone: '',
      };

      render(
        <AddStaffModal
          formData={filledFormData}
          error={null}
          onFormChange={mockOnFormChange}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('add-modal-submit-button'));
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
