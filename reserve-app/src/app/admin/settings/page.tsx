'use client';

import AdminSidebar from '@/components/AdminSidebar';
import {
  StoreInfoSection,
  BusinessHoursSection,
  BookingSettingsSection,
  SystemPublicSection,
  useSettings,
} from '@/components/admin/settings';

/**
 * 店舗設定ページ
 * Issue: #24
 *
 * 機能:
 * - 店舗基本情報設定
 * - 営業時間設定
 * - 定休日設定
 * - 予約枠間隔設定
 */
export default function SettingsPage() {
  const {
    formData,
    formErrors,
    successMessage,
    errorMessage,
    isLoading,
    pageLoading,
    updateFormField,
    handleClosedDayChange,
    handleSave,
  } = useSettings();

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">
              読み込み中...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900 mb-6">
          店舗設定
        </h1>

        {successMessage && (
          <div
            data-testid="success-message"
            className="mb-4 p-4 bg-green-100 text-green-700 rounded"
          >
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div data-testid="error-message" className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        {formErrors.length > 0 && (
          <div data-testid="validation-error" className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            <ul>
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded shadow p-6 space-y-8">
          <StoreInfoSection formData={formData} onFieldChange={updateFormField} />

          <BusinessHoursSection
            formData={formData}
            onFieldChange={updateFormField}
            onClosedDayChange={handleClosedDayChange}
          />

          <SystemPublicSection formData={formData} onFieldChange={updateFormField} />

          <BookingSettingsSection formData={formData} onFieldChange={updateFormField} />

          <div className="flex justify-end">
            <button
              data-testid="save-settings-button"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {isLoading && <span data-testid="loading-indicator">保存中...</span>}
              {!isLoading && '保存'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
