'use client';

import { useState, useEffect } from 'react';
import { FeatureFlagKey } from '@/lib/feature-flags-config';

/**
 * 機能フラグの型定義
 * すべてのフラグがboolean値を持つ
 */
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

/**
 * useFeatureFlagsの戻り値の型定義
 */
export interface UseFeatureFlagsReturn {
  /** 機能フラグオブジェクト（ローディング中はnull） */
  flags: FeatureFlags | null;
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー情報（エラーがない場合はnull） */
  error: Error | null;
}

/**
 * 機能フラグを取得するカスタムフック
 *
 * 使用例:
 * ```tsx
 * const { flags, isLoading, error } = useFeatureFlags();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return (
 *   <div>
 *     {flags?.enableStaffSelection && <StaffSelector />}
 *     {flags?.enableCouponFeature && <CouponInput />}
 *   </div>
 * );
 * ```
 *
 * エラーハンドリング:
 * - API取得失敗時は安全側に倒す（すべてfalse）
 * - ネットワークエラー時も同様にすべてfalse
 * - エラー情報はerrorプロパティで参照可能
 *
 * @returns {UseFeatureFlagsReturn} 機能フラグ、ローディング状態、エラー情報
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');

        if (!response.ok) {
          throw new Error(
            `Failed to fetch feature flags: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!data.success || !data.data || !data.data.featureFlags) {
          throw new Error('Invalid response format from feature flags API');
        }

        setFlags(data.data.featureFlags);
        setError(null);
      } catch (err) {
        console.error('Error fetching feature flags:', err);
        setError(err as Error);

        // エラー時は安全側に倒す（すべてfalse）
        setFlags({
          enableStaffSelection: false,
          enableStaffShiftManagement: false,
          enableCustomerManagement: false,
          enableReservationUpdate: false,
          enableReminderEmail: false,
          enableManualReservation: false,
          enableAnalyticsReport: false,
          enableRepeatRateAnalysis: false,
          enableCouponFeature: false,
          enableLineNotification: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatureFlags();
  }, []);

  return { flags, isLoading, error };
}
