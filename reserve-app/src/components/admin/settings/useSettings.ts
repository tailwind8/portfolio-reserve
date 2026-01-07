'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthFetch, extractErrorMessage } from '@/hooks/useAuthFetch';
import { SettingsFormData, INITIAL_FORM_DATA } from './types';

/**
 * 店舗設定のカスタムフック
 */
export function useSettings() {
  const { authFetch } = useAuthFetch();
  const [formData, setFormData] = useState<SettingsFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setPageLoading(true);
      const response = await authFetch('/api/admin/settings');
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
          cancellationDeadlineHours: settingsData.cancellationDeadlineHours?.toString() || '24',
        });
      } else {
        const result = await response.json();
        setErrorMessage(extractErrorMessage(result.error) || '設定の取得に失敗しました');
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error);
      setErrorMessage(error instanceof Error ? error.message : '設定の取得に失敗しました');
    } finally {
      setPageLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const validateForm = useCallback((): boolean => {
    const errors: string[] = [];

    if (!formData.storeName.trim()) {
      errors.push('店舗名は必須です');
    }

    if (formData.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.storeEmail)) {
      errors.push('有効なメールアドレスを入力してください');
    }

    const openMinutes =
      parseInt(formData.openTime.split(':')[0]) * 60 + parseInt(formData.openTime.split(':')[1]);
    const closeMinutes =
      parseInt(formData.closeTime.split(':')[0]) * 60 + parseInt(formData.closeTime.split(':')[1]);
    if (openMinutes >= closeMinutes) {
      errors.push('開店時刻は閉店時刻より前である必要があります');
    }

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

    const cancellationHours = parseInt(formData.cancellationDeadlineHours);
    if (isNaN(cancellationHours) || cancellationHours < 0) {
      errors.push('キャンセル期限は0以上の値を入力してください');
    }

    setFormErrors(errors);
    return errors.length === 0;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFormErrors([]);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await authFetch('/api/admin/settings', {
        method: 'PATCH',
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
          cancellationDeadlineHours: parseInt(formData.cancellationDeadlineHours),
        }),
      });

      if (response.ok) {
        setSuccessMessage('店舗設定を更新しました');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const result = await response.json();
        setErrorMessage(extractErrorMessage(result.error) || '設定の更新に失敗しました');
      }
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
      setErrorMessage(error instanceof Error ? error.message : '設定の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, formData, validateForm]);

  const handleClosedDayChange = useCallback((day: string) => {
    setFormData((prev) => {
      const closedDays = prev.closedDays.includes(day)
        ? prev.closedDays.filter((d) => d !== day)
        : [...prev.closedDays, day];
      return { ...prev, closedDays };
    });
  }, []);

  const updateFormField = useCallback(
    <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  return {
    formData,
    formErrors,
    successMessage,
    errorMessage,
    isLoading,
    pageLoading,
    updateFormField,
    handleClosedDayChange,
    handleSave,
  };
}
