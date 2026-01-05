/**
 * BlockedTimeForm.tsx のユニットテスト
 *
 * 予約ブロック追加・編集フォームコンポーネントのテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BlockedTimeForm from '@/components/admin/BlockedTimeForm';

// BlockedTime型の定義（テスト用）
interface BlockedTime {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string | null;
  description: string | null;
}

describe('BlockedTimeForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const mockBlockedTime: BlockedTime = {
    id: 'test-id-1',
    startDateTime: '2025-01-20T10:00:00',
    endDateTime: '2025-01-20T12:00:00',
    reason: 'ホットペッパー予約',
    description: 'テスト説明',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('should render add mode when blockedTime is null', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('form-heading')).toHaveTextContent('予約ブロック追加');
      expect(screen.getByTestId('submit-button')).toHaveTextContent('追加');
    });

    it('should render edit mode when blockedTime is provided', () => {
      render(
        <BlockedTimeForm
          blockedTime={mockBlockedTime}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('form-heading')).toHaveTextContent('予約ブロック編集');
      expect(screen.getByTestId('submit-button')).toHaveTextContent('更新');
    });

    it('should render all form fields', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('start-date-time-input')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-time-input')).toBeInTheDocument();
      expect(screen.getByTestId('reason-select')).toBeInTheDocument();
      expect(screen.getByTestId('description-textarea')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('close-button')).toBeInTheDocument();
    });

    it('should render modal container', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('blocked-time-form-modal')).toBeInTheDocument();
    });

    it('should render reason select with all options', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const select = screen.getByTestId('reason-select');
      expect(select).toContainHTML('選択してください');
      expect(select).toContainHTML('ホットペッパー予約');
      expect(select).toContainHTML('電話予約');
      expect(select).toContainHTML('臨時休業');
      expect(select).toContainHTML('メンテナンス');
      expect(select).toContainHTML('その他');
    });
  });

  describe('編集モード: フォーム初期値', () => {
    it('should pre-fill form with existing data in edit mode', () => {
      render(
        <BlockedTimeForm
          blockedTime={mockBlockedTime}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input') as HTMLInputElement;
      const endInput = screen.getByTestId('end-date-time-input') as HTMLInputElement;
      const reasonSelect = screen.getByTestId('reason-select') as HTMLSelectElement;
      const descTextarea = screen.getByTestId('description-textarea') as HTMLTextAreaElement;

      expect(startInput.value).toBe('2025-01-20T10:00');
      expect(endInput.value).toBe('2025-01-20T12:00');
      expect(reasonSelect.value).toBe('ホットペッパー予約');
      expect(descTextarea.value).toBe('テスト説明');
    });

    it('should clear form when switching from edit to add mode', async () => {
      const { rerender } = render(
        <BlockedTimeForm
          blockedTime={mockBlockedTime}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      // 再レンダリング（新規モード）
      rerender(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const startInput = screen.getByTestId('start-date-time-input') as HTMLInputElement;
        const endInput = screen.getByTestId('end-date-time-input') as HTMLInputElement;
        const reasonSelect = screen.getByTestId('reason-select') as HTMLSelectElement;
        const descTextarea = screen.getByTestId('description-textarea') as HTMLTextAreaElement;

        expect(startInput.value).toBe('');
        expect(endInput.value).toBe('');
        expect(reasonSelect.value).toBe('');
        expect(descTextarea.value).toBe('');
      });
    });
  });

  describe('入力操作', () => {
    it('should update start date time when changed', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input') as HTMLInputElement;
      fireEvent.change(startInput, { target: { value: '2025-02-15T09:00' } });

      expect(startInput.value).toBe('2025-02-15T09:00');
    });

    it('should update end date time when changed', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const endInput = screen.getByTestId('end-date-time-input') as HTMLInputElement;
      fireEvent.change(endInput, { target: { value: '2025-02-15T11:00' } });

      expect(endInput.value).toBe('2025-02-15T11:00');
    });

    it('should update reason when changed', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const reasonSelect = screen.getByTestId('reason-select') as HTMLSelectElement;
      fireEvent.change(reasonSelect, { target: { value: '電話予約' } });

      expect(reasonSelect.value).toBe('電話予約');
    });

    it('should update description when changed', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const descTextarea = screen.getByTestId('description-textarea') as HTMLTextAreaElement;
      fireEvent.change(descTextarea, { target: { value: '新しい説明' } });

      expect(descTextarea.value).toBe('新しい説明');
    });
  });

  describe('バリデーション', () => {
    // 注: 空フィールドのバリデーションはHTML5のrequired属性で処理されるため、
    // ブラウザがフォーム送信を防止します。そのため、required属性の存在を確認するテストを実施。

    it('should have required attribute on start date time input (HTML5 validation)', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      expect(startInput).toHaveAttribute('required');
    });

    it('should have required attribute on end date time input (HTML5 validation)', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const endInput = screen.getByTestId('end-date-time-input');
      expect(endInput).toHaveAttribute('required');
    });

    it('should show error when end date time is equal to start', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');

      fireEvent.change(startInput, { target: { value: '2025-02-15T09:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T09:00' } });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(screen.getByTestId('error-message')).toHaveTextContent('終了日時は開始日時より後にしてください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show error when end date time is before start', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');

      fireEvent.change(startInput, { target: { value: '2025-02-15T12:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T09:00' } });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(screen.getByTestId('error-message')).toHaveTextContent('終了日時は開始日時より後にしてください');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear error when form is re-validated successfully', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');
      const submitButton = screen.getByTestId('submit-button');

      // 最初にエラーを発生させる（終了日時が開始日時より前）
      fireEvent.change(startInput, { target: { value: '2025-02-15T12:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T09:00' } });
      fireEvent.click(submitButton);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // 有効なデータに修正
      fireEvent.change(endInput, { target: { value: '2025-02-15T15:00' } });
      fireEvent.click(submitButton);

      // エラーがクリアされている
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('フォーム送信', () => {
    it('should call onSubmit with correct data when form is valid', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');
      const reasonSelect = screen.getByTestId('reason-select');
      const descTextarea = screen.getByTestId('description-textarea');

      fireEvent.change(startInput, { target: { value: '2025-02-15T09:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T11:00' } });
      fireEvent.change(reasonSelect, { target: { value: '電話予約' } });
      fireEvent.change(descTextarea, { target: { value: 'テスト説明' } });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        startDateTime: '2025-02-15T09:00',
        endDateTime: '2025-02-15T11:00',
        reason: '電話予約',
        description: 'テスト説明',
      });
    });

    it('should send null for reason when not selected', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');

      fireEvent.change(startInput, { target: { value: '2025-02-15T09:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T11:00' } });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        startDateTime: '2025-02-15T09:00',
        endDateTime: '2025-02-15T11:00',
        reason: null,
        description: null,
      });
    });

    it('should send null for description when empty', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');
      const reasonSelect = screen.getByTestId('reason-select');

      fireEvent.change(startInput, { target: { value: '2025-02-15T09:00' } });
      fireEvent.change(endInput, { target: { value: '2025-02-15T11:00' } });
      fireEvent.change(reasonSelect, { target: { value: '臨時休業' } });

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        startDateTime: '2025-02-15T09:00',
        endDateTime: '2025-02-15T11:00',
        reason: '臨時休業',
        description: null,
      });
    });
  });

  describe('クローズ操作', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('close-button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', () => {
      const { container } = render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      // オーバーレイ要素（最外側のdiv）をクリック
      const overlay = container.querySelector('.fixed.inset-0');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const modal = screen.getByTestId('blocked-time-form-modal');
      fireEvent.click(modal);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('should have correct labels for form fields', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByLabelText(/開始日時/)).toBeInTheDocument();
      expect(screen.getByLabelText(/終了日時/)).toBeInTheDocument();
      expect(screen.getByLabelText(/理由/)).toBeInTheDocument();
      expect(screen.getByLabelText(/詳細説明/)).toBeInTheDocument();
    });

    it('should have required attribute on datetime inputs', () => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input');
      const endInput = screen.getByTestId('end-date-time-input');

      expect(startInput).toHaveAttribute('required');
      expect(endInput).toHaveAttribute('required');
    });
  });

  describe('日時フォーマット', () => {
    it('should format datetime correctly for input', () => {
      const blockedTimeWithDifferentFormat: BlockedTime = {
        id: 'test-id-2',
        startDateTime: '2025-06-15T08:30:00',
        endDateTime: '2025-06-15T17:45:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeForm
          blockedTime={blockedTimeWithDifferentFormat}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const startInput = screen.getByTestId('start-date-time-input') as HTMLInputElement;
      const endInput = screen.getByTestId('end-date-time-input') as HTMLInputElement;

      expect(startInput.value).toBe('2025-06-15T08:30');
      expect(endInput.value).toBe('2025-06-15T17:45');
    });
  });

  describe('理由選択', () => {
    it.each([
      ['ホットペッパー予約'],
      ['電話予約'],
      ['臨時休業'],
      ['メンテナンス'],
      ['その他'],
    ])('should allow selecting %s as reason', (reason) => {
      render(
        <BlockedTimeForm
          blockedTime={null}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      );

      const reasonSelect = screen.getByTestId('reason-select') as HTMLSelectElement;
      fireEvent.change(reasonSelect, { target: { value: reason } });

      expect(reasonSelect.value).toBe(reason);
    });
  });
});
