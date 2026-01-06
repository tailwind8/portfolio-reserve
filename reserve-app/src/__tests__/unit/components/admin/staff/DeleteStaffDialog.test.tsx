/**
 * DeleteStaffDialog.tsx のユニットテスト
 *
 * スタッフ削除確認ダイアログコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import DeleteStaffDialog from '@/components/admin/staff/DeleteStaffDialog';
import type { Staff } from '@/components/admin/staff/types';

describe('DeleteStaffDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  const mockStaff: Staff = {
    id: 'staff-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('ダイアログが正しく表示される', () => {
      render(
        <DeleteStaffDialog
          staff={mockStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-title')).toHaveTextContent('スタッフを削除しますか？');
    });

    it('スタッフ名を含むメッセージが表示される', () => {
      render(
        <DeleteStaffDialog
          staff={mockStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('delete-dialog-message')).toHaveTextContent('田中太郎を削除します');
      expect(screen.getByTestId('delete-dialog-message')).toHaveTextContent('この操作は取り消せません');
    });

    it('キャンセルと削除ボタンが表示される', () => {
      render(
        <DeleteStaffDialog
          staff={mockStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('delete-dialog-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('delete-dialog-confirm-button')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <DeleteStaffDialog
          staff={mockStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('delete-dialog-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('削除ボタンをクリックするとonConfirmが呼ばれる', () => {
      render(
        <DeleteStaffDialog
          staff={mockStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('delete-dialog-confirm-button'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('異なるスタッフデータの表示', () => {
    it('別のスタッフ名が正しく表示される', () => {
      const anotherStaff: Staff = {
        id: 'staff-2',
        name: '佐藤花子',
        email: 'sato@example.com',
        isActive: true,
      };

      render(
        <DeleteStaffDialog
          staff={anotherStaff}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('delete-dialog-message')).toHaveTextContent('佐藤花子を削除します');
    });
  });
});
