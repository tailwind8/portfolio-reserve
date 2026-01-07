'use client';

import { SettingsFormData } from './types';

type StoreInfoSectionProps = {
  formData: SettingsFormData;
  onFieldChange: <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => void;
};

/**
 * 店舗基本情報セクション
 */
export function StoreInfoSection({ formData, onFieldChange }: StoreInfoSectionProps) {
  return (
    <section data-testid="store-info-section">
      <h2 className="text-xl font-semibold mb-4">店舗基本情報</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">店舗名 *</label>
          <input
            data-testid="store-name-input"
            type="text"
            value={formData.storeName}
            onChange={(e) => onFieldChange('storeName', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="サンプル美容室"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">メールアドレス</label>
          <input
            data-testid="store-email-input"
            type="email"
            value={formData.storeEmail}
            onChange={(e) => onFieldChange('storeEmail', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="info@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">電話番号</label>
          <input
            data-testid="store-phone-input"
            type="tel"
            value={formData.storePhone}
            onChange={(e) => onFieldChange('storePhone', e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="03-1234-5678"
          />
        </div>
      </div>
    </section>
  );
}
