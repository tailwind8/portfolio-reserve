/**
 * BlockedTimeList.tsx のユニットテスト
 *
 * 予約ブロック一覧表示コンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import BlockedTimeList from '@/components/admin/BlockedTimeList';

// BlockedTime型の定義（テスト用）
interface BlockedTime {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string | null;
  description: string | null;
}

describe('BlockedTimeList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockBlockedTimes: BlockedTime[] = [
    {
      id: 'test-id-1',
      startDateTime: '2025-01-20T10:00:00',
      endDateTime: '2025-01-20T12:00:00',
      reason: 'ホットペッパー予約',
      description: 'テスト説明1',
    },
    {
      id: 'test-id-2',
      startDateTime: '2025-01-21T14:00:00',
      endDateTime: '2025-01-21T16:30:00',
      reason: '電話予約',
      description: null,
    },
    {
      id: 'test-id-3',
      startDateTime: '2025-01-22T09:00:00',
      endDateTime: '2025-01-22T18:00:00',
      reason: '臨時休業',
      description: '店舗メンテナンスのため終日休業',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('should render all blocked time cards', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const cards = screen.getAllByTestId('blocked-time-card');
      expect(cards).toHaveLength(3);
    });

    it('should render empty list when no blocked times', () => {
      render(
        <BlockedTimeList
          blockedTimes={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const cards = screen.queryAllByTestId('blocked-time-card');
      expect(cards).toHaveLength(0);
    });

    it('should render edit button for each card', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButtons = screen.getAllByTestId('edit-button');
      expect(editButtons).toHaveLength(3);
    });

    it('should render delete button for each card', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTestId('delete-button');
      expect(deleteButtons).toHaveLength(3);
    });
  });

  describe('日時表示', () => {
    it('should format and display start date time correctly', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const startDateTime = screen.getByTestId('start-date-time');
      expect(startDateTime).toHaveTextContent('2025-01-20 10:00');
    });

    it('should format and display end date time correctly', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const endDateTime = screen.getByTestId('end-date-time');
      expect(endDateTime).toHaveTextContent('2025-01-20 12:00');
    });

    it('should display times with half hour correctly', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[1]]} // 14:00 - 16:30
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const startDateTime = screen.getByTestId('start-date-time');
      const endDateTime = screen.getByTestId('end-date-time');

      expect(startDateTime).toHaveTextContent('2025-01-21 14:00');
      expect(endDateTime).toHaveTextContent('2025-01-21 16:30');
    });
  });

  describe('理由ラベル', () => {
    it.each([
      ['ホットペッパー予約', 'ホットペッパー予約'],
      ['電話予約', '電話予約'],
      ['臨時休業', '臨時休業'],
      ['メンテナンス', 'メンテナンス'],
      ['その他', 'その他'],
    ])('should display %s label correctly', (reason, expectedLabel) => {
      const blockedTime: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: reason,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTime]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reasonElement = screen.getByTestId('reason');
      expect(reasonElement).toHaveTextContent(expectedLabel);
    });

    it('should display 未設定 when reason is null', () => {
      const blockedTimeWithoutReason: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeWithoutReason]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reasonElement = screen.getByTestId('reason');
      expect(reasonElement).toHaveTextContent('未設定');
    });

    it('should display reason as-is when not in predefined list', () => {
      const blockedTimeWithCustomReason: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: 'カスタム理由',
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeWithCustomReason]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reasonElement = screen.getByTestId('reason');
      expect(reasonElement).toHaveTextContent('カスタム理由');
    });
  });

  describe('理由カラー', () => {
    it.each([
      ['ホットペッパー予約', 'bg-purple-100', 'text-purple-800'],
      ['電話予約', 'bg-blue-100', 'text-blue-800'],
      ['臨時休業', 'bg-red-100', 'text-red-800'],
      ['メンテナンス', 'bg-yellow-100', 'text-yellow-800'],
      ['その他', 'bg-gray-100', 'text-gray-800'],
    ])('should apply correct color for %s', (reason, bgColor, textColor) => {
      const blockedTime: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: reason,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTime]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reasonElement = screen.getByTestId('reason');
      expect(reasonElement.className).toContain(bgColor);
      expect(reasonElement.className).toContain(textColor);
    });

    it('should apply default gray color when reason is null', () => {
      const blockedTimeWithoutReason: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeWithoutReason]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const reasonElement = screen.getByTestId('reason');
      expect(reasonElement.className).toContain('bg-gray-100');
      expect(reasonElement.className).toContain('text-gray-800');
    });
  });

  describe('説明表示', () => {
    it('should display description when provided', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[0]]} // テスト説明1
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descElement = screen.getByTestId('description');
      expect(descElement).toHaveTextContent('テスト説明1');
    });

    it('should not render description element when description is null', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[1]]} // description: null
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descElement = screen.queryByTestId('description');
      expect(descElement).not.toBeInTheDocument();
    });

    it('should display long description correctly', () => {
      const blockedTimeWithLongDesc: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T10:00:00',
        endDateTime: '2025-01-20T12:00:00',
        reason: '臨時休業',
        description: '店舗メンテナンスのため終日休業。電気工事および空調設備の点検を行います。',
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeWithLongDesc]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const descElement = screen.getByTestId('description');
      expect(descElement).toHaveTextContent('店舗メンテナンスのため終日休業。電気工事および空調設備の点検を行います。');
    });
  });

  describe('編集操作', () => {
    it('should call onEdit with correct blocked time when edit button is clicked', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButtons = screen.getAllByTestId('edit-button');
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockBlockedTimes[0]);
    });

    it('should call onEdit with second item when second edit button is clicked', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButtons = screen.getAllByTestId('edit-button');
      fireEvent.click(editButtons[1]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockBlockedTimes[1]);
    });
  });

  describe('削除操作', () => {
    it('should call onDelete with correct id when delete button is clicked', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTestId('delete-button');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith('test-id-1');
    });

    it('should call onDelete with second id when second delete button is clicked', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButtons = screen.getAllByTestId('delete-button');
      fireEvent.click(deleteButtons[1]);

      expect(mockOnDelete).toHaveBeenCalledWith('test-id-2');
    });
  });

  describe('複数アイテム操作', () => {
    it('should handle clicking different buttons independently', () => {
      render(
        <BlockedTimeList
          blockedTimes={mockBlockedTimes}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButtons = screen.getAllByTestId('edit-button');
      const deleteButtons = screen.getAllByTestId('delete-button');

      fireEvent.click(editButtons[0]);
      fireEvent.click(deleteButtons[2]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockBlockedTimes[0]);
      expect(mockOnDelete).toHaveBeenCalledWith('test-id-3');
    });
  });

  describe('日時フォーマット', () => {
    it('should format single digit month correctly', () => {
      const blockedTimeJanuary: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-05T10:00:00',
        endDateTime: '2025-01-05T12:00:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeJanuary]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const startDateTime = screen.getByTestId('start-date-time');
      expect(startDateTime).toHaveTextContent('2025-01-05 10:00');
    });

    it('should format double digit month correctly', () => {
      const blockedTimeDecember: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-12-25T10:00:00',
        endDateTime: '2025-12-25T12:00:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeDecember]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const startDateTime = screen.getByTestId('start-date-time');
      expect(startDateTime).toHaveTextContent('2025-12-25 10:00');
    });

    it('should format midnight correctly', () => {
      const blockedTimeMidnight: BlockedTime = {
        id: 'test-id',
        startDateTime: '2025-01-20T00:00:00',
        endDateTime: '2025-01-20T06:00:00',
        reason: null,
        description: null,
      };

      render(
        <BlockedTimeList
          blockedTimes={[blockedTimeMidnight]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const startDateTime = screen.getByTestId('start-date-time');
      expect(startDateTime).toHaveTextContent('2025-01-20 00:00');
    });
  });

  describe('ボタンテキスト', () => {
    it('should display 編集 text on edit button', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByTestId('edit-button');
      expect(editButton).toHaveTextContent('編集');
    });

    it('should display 削除 text on delete button', () => {
      render(
        <BlockedTimeList
          blockedTimes={[mockBlockedTimes[0]]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-button');
      expect(deleteButton).toHaveTextContent('削除');
    });
  });
});
