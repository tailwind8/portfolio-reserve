/**
 * ShiftSettingModal.tsx のユニットテスト
 *
 * シフト設定モーダルコンポーネントのテスト
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ShiftSettingModal from '@/components/admin/staff/ShiftSettingModal';
import type { Staff, ShiftFormData, VacationFormData } from '@/components/admin/staff/types';

describe('ShiftSettingModal', () => {
  const mockOnClose = jest.fn();
  const mockOnTabChange = jest.fn();
  const mockOnShiftFormChange = jest.fn();
  const mockOnVacationFormChange = jest.fn();
  const mockOnShiftSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
  const mockOnVacationSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());

  const mockStaff: Staff = {
    id: 'staff-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    isActive: true,
  };

  const defaultShiftFormData: ShiftFormData = {
    '月曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '火曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '水曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '木曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '金曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '土曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
    '日曜日': { enabled: false, startTime: '09:00', endTime: '18:00' },
  };

  const defaultVacationFormData: VacationFormData = {
    startDate: '',
    endDate: '',
    reason: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('レンダリング - シフト設定タブ', () => {
    it('モーダルが正しく表示される', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('shift-setting-modal')).toBeInTheDocument();
      expect(screen.getByTestId('shift-modal-title')).toHaveTextContent('シフト設定 - 田中太郎');
    });

    it('全曜日のシフト設定フィールドが表示される', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      const checkboxes = screen.getAllByTestId('shift-day-checkbox');
      expect(checkboxes).toHaveLength(7);

      const startTimeInputs = screen.getAllByTestId('shift-start-time');
      expect(startTimeInputs).toHaveLength(7);

      const endTimeInputs = screen.getAllByTestId('shift-end-time');
      expect(endTimeInputs).toHaveLength(7);
    });

    it('ボタンが表示される', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('shift-modal-cancel-button')).toBeInTheDocument();
      expect(screen.getByTestId('shift-modal-submit-button')).toBeInTheDocument();
    });
  });

  describe('レンダリング - 休暇設定タブ', () => {
    it('休暇設定フォームが表示される', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="vacation"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('vacation-start-date')).toBeInTheDocument();
      expect(screen.getByTestId('vacation-end-date')).toBeInTheDocument();
    });

    it('休暇設定タブをクリックするとonTabChangeが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('vacation-tab'));
      expect(mockOnTabChange).toHaveBeenCalledWith('vacation');
    });
  });

  describe('エラー表示', () => {
    it('エラーがない場合はエラーメッセージが表示されない', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('shift-modal-validation-error')).not.toBeInTheDocument();
    });

    it('エラーがある場合はエラーメッセージが表示される', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error="退勤時間は出勤時間より後である必要があります"
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('shift-modal-validation-error')).toHaveTextContent('退勤時間は出勤時間より後である必要があります');
    });
  });

  describe('ユーザーインタラクション - シフト設定', () => {
    it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('shift-modal-cancel-button'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('曜日のチェックボックスを変更するとonShiftFormChangeが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      const checkboxes = screen.getAllByTestId('shift-day-checkbox');
      fireEvent.click(checkboxes[0]); // 月曜日
      expect(mockOnShiftFormChange).toHaveBeenCalled();
    });

    it('フォームを送信するとonShiftSubmitが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('shift-modal-submit-button'));
      expect(mockOnShiftSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('ユーザーインタラクション - 休暇設定', () => {
    it('休暇開始日を変更するとonVacationFormChangeが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="vacation"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('vacation-start-date'), { target: { value: '2025-01-25' } });
      expect(mockOnVacationFormChange).toHaveBeenCalledWith({
        ...defaultVacationFormData,
        startDate: '2025-01-25',
      });
    });

    it('休暇終了日を変更するとonVacationFormChangeが呼ばれる', () => {
      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="vacation"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.change(screen.getByTestId('vacation-end-date'), { target: { value: '2025-01-27' } });
      expect(mockOnVacationFormChange).toHaveBeenCalledWith({
        ...defaultVacationFormData,
        endDate: '2025-01-27',
      });
    });

    it('休暇設定フォームを送信するとonVacationSubmitが呼ばれる', () => {
      const filledVacationFormData: VacationFormData = {
        startDate: '2025-01-25',
        endDate: '2025-01-27',
        reason: '',
      };

      render(
        <ShiftSettingModal
          staff={mockStaff}
          activeTab="vacation"
          shiftFormData={defaultShiftFormData}
          vacationFormData={filledVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTestId('shift-modal-submit-button'));
      expect(mockOnVacationSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('異なるスタッフデータの表示', () => {
    it('別のスタッフ名がタイトルに表示される', () => {
      const anotherStaff: Staff = {
        id: 'staff-2',
        name: '佐藤花子',
        email: 'sato@example.com',
        isActive: true,
      };

      render(
        <ShiftSettingModal
          staff={anotherStaff}
          activeTab="shift"
          shiftFormData={defaultShiftFormData}
          vacationFormData={defaultVacationFormData}
          error={null}
          onTabChange={mockOnTabChange}
          onShiftFormChange={mockOnShiftFormChange}
          onVacationFormChange={mockOnVacationFormChange}
          onShiftSubmit={mockOnShiftSubmit}
          onVacationSubmit={mockOnVacationSubmit}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('shift-modal-title')).toHaveTextContent('シフト設定 - 佐藤花子');
    });
  });
});
