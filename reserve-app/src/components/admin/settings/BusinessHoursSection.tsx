'use client';

import { SettingsFormData, DAYS_OF_WEEK } from './types';

type BusinessHoursSectionProps = {
  formData: SettingsFormData;
  onFieldChange: <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => void;
  onClosedDayChange: (day: string) => void;
};

/**
 * 営業時間・定休日セクション
 */
export function BusinessHoursSection({
  formData,
  onFieldChange,
  onClosedDayChange,
}: BusinessHoursSectionProps) {
  return (
    <>
      <section data-testid="business-hours-section">
        <h2 className="text-xl font-semibold mb-4">営業時間</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">開店時刻</label>
            <input
              data-testid="open-time-input"
              type="time"
              value={formData.openTime}
              onChange={(e) => onFieldChange('openTime', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">閉店時刻</label>
            <input
              data-testid="close-time-input"
              type="time"
              value={formData.closeTime}
              onChange={(e) => onFieldChange('closeTime', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section data-testid="closed-days-section">
        <h2 className="text-xl font-semibold mb-4">定休日</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <label key={day.value} className="flex items-center space-x-2">
              <input
                data-testid={`closed-day-${day.value}`}
                type="checkbox"
                checked={formData.closedDays.includes(day.value)}
                onChange={() => onClosedDayChange(day.value)}
                className="rounded"
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
