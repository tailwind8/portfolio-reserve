'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { Staff, ShiftFormData, VacationFormData } from './types';
import { DAYS } from './types';

interface ShiftSettingModalProps {
  staff: Staff;
  activeTab: 'shift' | 'vacation';
  shiftFormData: ShiftFormData;
  vacationFormData: VacationFormData;
  error: string | null;
  onTabChange: (tab: 'shift' | 'vacation') => void;
  onShiftFormChange: (data: ShiftFormData) => void;
  onVacationFormChange: (data: VacationFormData) => void;
  onShiftSubmit: (e: React.FormEvent) => void;
  onVacationSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function ShiftSettingModal({
  staff,
  activeTab,
  shiftFormData,
  vacationFormData,
  error,
  onTabChange,
  onShiftFormChange,
  onVacationFormChange,
  onShiftSubmit,
  onVacationSubmit,
  onClose,
}: ShiftSettingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="shift-setting-modal">
        <h2 data-testid="shift-modal-title" className="mb-4 text-xl font-semibold">
          シフト設定 - {staff.name}
        </h2>

        {/* タブ */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => onTabChange('shift')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'shift'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            シフト設定
          </button>
          <button
            data-testid="vacation-tab"
            onClick={() => onTabChange('vacation')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'vacation'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            休暇設定
          </button>
        </div>

        {/* シフト設定タブ */}
        {activeTab === 'shift' && (
          <form onSubmit={onShiftSubmit}>
            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      data-testid="shift-day-checkbox"
                      data-day={day}
                      checked={shiftFormData[day]?.enabled || false}
                      onChange={(e) =>
                        onShiftFormChange({
                          ...shiftFormData,
                          [day]: {
                            ...shiftFormData[day],
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 w-16 text-sm font-medium text-gray-700">{day}</label>
                  </div>

                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="time"
                      data-testid="shift-start-time"
                      data-day={day}
                      value={shiftFormData[day]?.startTime || '09:00'}
                      onChange={(e) =>
                        onShiftFormChange({
                          ...shiftFormData,
                          [day]: {
                            ...shiftFormData[day],
                            startTime: e.target.value,
                          },
                        })
                      }
                      disabled={!shiftFormData[day]?.enabled}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                    />
                    <span className="text-gray-500">〜</span>
                    <input
                      type="time"
                      data-testid="shift-end-time"
                      data-day={day}
                      value={shiftFormData[day]?.endTime || '18:00'}
                      onChange={(e) =>
                        onShiftFormChange({
                          ...shiftFormData,
                          [day]: {
                            ...shiftFormData[day],
                            endTime: e.target.value,
                          },
                        })
                      }
                      disabled={!shiftFormData[day]?.enabled}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div data-testid="shift-modal-validation-error" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                data-testid="shift-modal-cancel-button"
                onClick={onClose}
                variant="outline"
                size="md"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                data-testid="shift-modal-submit-button"
                variant="primary"
                size="md"
              >
                保存
              </Button>
            </div>
          </form>
        )}

        {/* 休暇設定タブ */}
        {activeTab === 'vacation' && (
          <form onSubmit={onVacationSubmit}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">開始日</label>
                <input
                  type="date"
                  data-testid="vacation-start-date"
                  value={vacationFormData.startDate}
                  onChange={(e) =>
                    onVacationFormChange({ ...vacationFormData, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">終了日</label>
                <input
                  type="date"
                  data-testid="vacation-end-date"
                  value={vacationFormData.endDate}
                  onChange={(e) =>
                    onVacationFormChange({ ...vacationFormData, endDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">理由（任意）</label>
                <textarea
                  value={vacationFormData.reason}
                  onChange={(e) =>
                    onVacationFormChange({ ...vacationFormData, reason: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                size="md"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                data-testid="shift-modal-submit-button"
                variant="primary"
                size="md"
              >
                保存
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
