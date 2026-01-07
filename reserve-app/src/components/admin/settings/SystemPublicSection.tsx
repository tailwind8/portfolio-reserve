'use client';

import { SettingsFormData } from './types';

type SystemPublicSectionProps = {
  formData: SettingsFormData;
  onFieldChange: <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => void;
};

/**
 * システム公開設定セクション
 */
export function SystemPublicSection({ formData, onFieldChange }: SystemPublicSectionProps) {
  return (
    <section data-testid="system-public-section">
      <h2 className="text-xl font-semibold mb-4">システム公開設定</h2>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
        <p className="text-sm text-yellow-800 mb-2">
          <strong>注意:</strong> 非公開に設定すると、一般ユーザーはメンテナンス画面が表示されます。
          管理画面は引き続きアクセス可能です。
        </p>
      </div>

      <div className="flex items-center space-x-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            data-testid="is-public-toggle"
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => onFieldChange('isPublic', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span data-testid="is-public-label" className="ml-3 text-sm font-medium text-gray-900">
            {formData.isPublic ? 'システム公開中' : 'メンテナンス中（非公開）'}
          </span>
        </label>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p data-testid="is-public-status-text">
          現在の状態:{' '}
          <span className={`font-semibold ${formData.isPublic ? 'text-green-600' : 'text-red-600'}`}>
            {formData.isPublic ? '公開中' : '非公開（メンテナンス中）'}
          </span>
        </p>
      </div>
    </section>
  );
}
