'use client';

import { SettingsFormData, SLOT_DURATIONS } from './types';

type BookingSettingsSectionProps = {
  formData: SettingsFormData;
  onFieldChange: <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => void;
};

/**
 * 予約設定セクション（予約枠・予約受付期間・キャンセル期限）
 */
export function BookingSettingsSection({ formData, onFieldChange }: BookingSettingsSectionProps) {
  return (
    <>
      <section data-testid="slot-duration-section">
        <h2 className="text-xl font-semibold mb-4">予約枠設定</h2>
        <div>
          <label className="block text-sm font-medium mb-1">予約枠間隔</label>
          <select
            data-testid="slot-duration-select"
            value={formData.slotDuration}
            onChange={(e) => onFieldChange('slotDuration', e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {SLOT_DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section data-testid="booking-period-section">
        <h2 className="text-xl font-semibold mb-4">予約受付期間設定</h2>
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>説明:</strong> 予約を受け付ける期間を設定します。
            例えば、最短1日・最長30日と設定すると、明日から30日後までの予約が可能になります。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              最短予約日数（何日後から予約可能）
            </label>
            <input
              data-testid="min-advance-booking-days-input"
              type="number"
              min="0"
              value={formData.minAdvanceBookingDays}
              onChange={(e) => onFieldChange('minAdvanceBookingDays', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">0 = 当日予約可能、1 = 明日から予約可能</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              最長予約日数（何日後まで予約可能）
            </label>
            <input
              data-testid="max-advance-booking-days-input"
              type="number"
              min="1"
              value={formData.maxAdvanceBookingDays}
              onChange={(e) => onFieldChange('maxAdvanceBookingDays', e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="90"
            />
            <p className="text-xs text-gray-500 mt-1">例: 90日後まで予約可能</p>
          </div>
        </div>
      </section>

      <section data-testid="cancellation-deadline-section">
        <h2 className="text-xl font-semibold mb-4">キャンセル期限設定</h2>
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <p className="text-sm text-blue-800 mb-2">
            <strong>説明:</strong> 予約日時の何時間前までキャンセル可能かを設定します。
            例えば、24時間と設定すると、予約日時の24時間前までキャンセルできます。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            キャンセル可能期限（予約日時の何時間前まで）
          </label>
          <input
            data-testid="cancellation-deadline-hours-input"
            type="number"
            min="0"
            value={formData.cancellationDeadlineHours}
            onChange={(e) => onFieldChange('cancellationDeadlineHours', e.target.value)}
            className="w-full md:w-1/2 border rounded px-3 py-2"
            placeholder="24"
          />
          <p className="text-xs text-gray-500 mt-1">
            例: 24時間 = 予約日時の24時間前までキャンセル可能
          </p>
        </div>
      </section>
    </>
  );
}
