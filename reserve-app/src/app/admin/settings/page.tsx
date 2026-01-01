'use client';

import { useState, useEffect } from 'react';

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

type FormData = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  openTime: string;
  closeTime: string;
  closedDays: string[];
  slotDuration: string;
  isPublic: boolean;
  minAdvanceBookingDays: string;
  maxAdvanceBookingDays: string;
};

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: '月曜日' },
  { value: 'TUESDAY', label: '火曜日' },
  { value: 'WEDNESDAY', label: '水曜日' },
  { value: 'THURSDAY', label: '木曜日' },
  { value: 'FRIDAY', label: '金曜日' },
  { value: 'SATURDAY', label: '土曜日' },
  { value: 'SUNDAY', label: '日曜日' },
];

const SLOT_DURATIONS = [
  { value: '15', label: '15分' },
  { value: '30', label: '30分' },
  { value: '60', label: '60分' },
  { value: '90', label: '90分' },
  { value: '120', label: '120分' },
];

export default function SettingsPage() {
  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    openTime: '09:00',
    closeTime: '20:00',
    closedDays: [],
    slotDuration: '30',
    isPublic: true,
    minAdvanceBookingDays: '0',
    maxAdvanceBookingDays: '90',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsData = data.data;
        setFormData({
          storeName: settingsData.storeName,
          storeEmail: settingsData.storeEmail || '',
          storePhone: settingsData.storePhone || '',
          openTime: settingsData.openTime,
          closeTime: settingsData.closeTime,
          closedDays: settingsData.closedDays || [],
          slotDuration: settingsData.slotDuration.toString(),
          isPublic: settingsData.isPublic ?? true,
          minAdvanceBookingDays: settingsData.minAdvanceBookingDays.toString(),
          maxAdvanceBookingDays: settingsData.maxAdvanceBookingDays.toString(),
        });
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error);
      setErrorMessage('設定の取得に失敗しました');
    }
  };

  // 設定を取得
  useEffect(() => {
    fetchSettings();
  }, []);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.storeName.trim()) {
      errors.push('店舗名は必須です');
    }

    if (formData.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.storeEmail)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    // 開店時刻が閉店時刻より前であることを検証
    const openMinutes =
      parseInt(formData.openTime.split(':')[0]) * 60 + parseInt(formData.openTime.split(':')[1]);
    const closeMinutes =
      parseInt(formData.closeTime.split(':')[0]) * 60 +
      parseInt(formData.closeTime.split(':')[1]);
    if (openMinutes >= closeMinutes) {
      errors.push('開店時刻は閉店時刻より前である必要があります');
    }

    // 予約受付期間のバリデーション
    const minDays = parseInt(formData.minAdvanceBookingDays);
    const maxDays = parseInt(formData.maxAdvanceBookingDays);

    if (isNaN(minDays) || minDays < 0) {
      errors.push('0以上の値を入力してください');
    }

    if (isNaN(maxDays) || maxDays < 0) {
      errors.push('0以上の値を入力してください');
    }

    if (!isNaN(minDays) && !isNaN(maxDays) && minDays >= maxDays) {
      errors.push('最短予約日数は最長予約日数より小さい値を設定してください');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFormErrors([]);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeName: formData.storeName,
          storeEmail: formData.storeEmail,
          storePhone: formData.storePhone,
          openTime: formData.openTime,
          closeTime: formData.closeTime,
          closedDays: formData.closedDays,
          slotDuration: parseInt(formData.slotDuration),
          isPublic: formData.isPublic,
          minAdvanceBookingDays: parseInt(formData.minAdvanceBookingDays),
          maxAdvanceBookingDays: parseInt(formData.maxAdvanceBookingDays),
        }),
      });

      if (response.ok) {
        setSuccessMessage('店舗設定を更新しました');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || '設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
      setErrorMessage('設定の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosedDayChange = (day: string) => {
    setFormData((prev) => {
      const closedDays = prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day];
      return { ...prev, closedDays };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 data-testid="page-title" className="text-2xl font-bold mb-6">
        店舗設定
      </h1>

      {/* 成功メッセージ */}
      {successMessage && (
        <div
          data-testid="success-message"
          className="mb-4 p-4 bg-green-100 text-green-700 rounded"
        >
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {errorMessage && (
        <div data-testid="error-message" className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {/* バリデーションエラー */}
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
        {/* 店舗基本情報 */}
        <section data-testid="store-info-section">
          <h2 className="text-xl font-semibold mb-4">店舗基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">店舗名 *</label>
              <input
                data-testid="store-name-input"
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="03-1234-5678"
              />
            </div>
          </div>
        </section>

        {/* 営業時間設定 */}
        <section data-testid="business-hours-section">
          <h2 className="text-xl font-semibold mb-4">営業時間</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">開店時刻</label>
              <input
                data-testid="open-time-input"
                type="time"
                value={formData.openTime}
                onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">閉店時刻</label>
              <input
                data-testid="close-time-input"
                type="time"
                value={formData.closeTime}
                onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* 定休日設定 */}
        <section data-testid="closed-days-section">
          <h2 className="text-xl font-semibold mb-4">定休日</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <label key={day.value} className="flex items-center space-x-2">
                <input
                  data-testid={`closed-day-${day.value}`}
                  type="checkbox"
                  checked={formData.closedDays.includes(day.value)}
                  onChange={() => handleClosedDayChange(day.value)}
                  className="rounded"
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* システム公開設定 */}
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
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span
                data-testid="is-public-label"
                className="ml-3 text-sm font-medium text-gray-900"
              >
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

        {/* 予約枠設定 */}
        <section data-testid="slot-duration-section">
          <h2 className="text-xl font-semibold mb-4">予約枠設定</h2>
          <div>
            <label className="block text-sm font-medium mb-1">予約枠間隔</label>
            <select
              data-testid="slot-duration-select"
              value={formData.slotDuration}
              onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}
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

        {/* 予約受付期間設定 */}
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
                onChange={(e) =>
                  setFormData({ ...formData, minAdvanceBookingDays: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = 当日予約可能、1 = 明日から予約可能
              </p>
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
                onChange={(e) =>
                  setFormData({ ...formData, maxAdvanceBookingDays: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="90"
              />
              <p className="text-xs text-gray-500 mt-1">例: 90日後まで予約可能</p>
            </div>
          </div>
        </section>

        {/* 保存ボタン */}
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
    </div>
  );
}
