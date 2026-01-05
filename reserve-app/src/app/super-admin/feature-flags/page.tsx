'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import {
  FEATURE_FLAGS_CONFIG,
  FeatureFlagKey,
  calculateTotalPrice,
} from '@/lib/feature-flags-config';

/**
 * 機能フラグの状態型
 */
type FeatureFlagsState = Record<FeatureFlagKey, boolean>;

/**
 * スーパー管理者 - 機能フラグ管理ページ
 * Phase 3実装
 */
export default function FeatureFlagsPage() {
  const [tenantId, setTenantId] = useState('demo-booking');
  const [flags, setFlags] = useState<FeatureFlagsState>({} as FeatureFlagsState);
  const [originalFlags, setOriginalFlags] = useState<FeatureFlagsState>(
    {} as FeatureFlagsState
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * 機能フラグをAPIから取得
   */
  const loadFeatureFlags = useCallback(async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(
        `/api/super-admin/feature-flags?tenantId=${tenantId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load feature flags');
      }

      const data = await response.json();
      const loadedFlags = data.featureFlags || {};

      setFlags(loadedFlags);
      setOriginalFlags(loadedFlags);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      // デフォルト値を設定（Phase 1のSeedデータに基づく）
      const defaultFlags: FeatureFlagsState = {
        enableStaffSelection: true,
        enableStaffShiftManagement: true,
        enableCustomerManagement: true,
        enableReservationUpdate: false,
        enableReminderEmail: true,
        enableManualReservation: true,
        enableAnalyticsReport: true,
        enableRepeatRateAnalysis: false,
        enableCouponFeature: false,
        enableLineNotification: false,
      };
      setFlags(defaultFlags);
      setOriginalFlags(defaultFlags);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // 初期データ読み込み
  useEffect(() => {
    loadFeatureFlags();
  }, [loadFeatureFlags]);

  /**
   * 機能フラグのトグル
   */
  const toggleFeature = (key: FeatureFlagKey) => {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * すべて有効化
   */
  const enableAll = () => {
    const allEnabled: FeatureFlagsState = {} as FeatureFlagsState;
    FEATURE_FLAGS_CONFIG.forEach((config) => {
      allEnabled[config.key] = true;
    });
    setFlags(allEnabled);
  };

  /**
   * すべて無効化
   */
  const disableAll = () => {
    const allDisabled: FeatureFlagsState = {} as FeatureFlagsState;
    FEATURE_FLAGS_CONFIG.forEach((config) => {
      allDisabled[config.key] = false;
    });
    setFlags(allDisabled);
  };

  /**
   * 変更があるかチェック
   */
  const hasChanges = (): boolean => {
    return FEATURE_FLAGS_CONFIG.some(
      (config) => flags[config.key] !== originalFlags[config.key]
    );
  };

  /**
   * 保存処理
   */
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/super-admin/feature-flags', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          featureFlags: flags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feature flags');
      }

      setOriginalFlags(flags);
      setSuccessMessage('機能フラグを更新しました');
    } catch (error) {
      console.error('Failed to save feature flags:', error);
      setErrorMessage('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  // 有効化された機能の合計金額を計算
  const enabledFeatures = FEATURE_FLAGS_CONFIG.filter(
    (config) => flags[config.key]
  ).map((config) => config.key);
  const totalPrice = calculateTotalPrice(enabledFeatures);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-500 text-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <Link href="/super-admin/dashboard">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white cursor-pointer hover:bg-purple-50">
                <span className="text-xl font-bold text-purple-500">S</span>
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold">機能フラグ管理</h1>
              <p className="text-sm text-purple-100">
                オプション機能の有効化/無効化
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="rounded-full bg-purple-600 px-3 py-1 text-sm font-medium">
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Success Message */}
        {successMessage && (
          <div
            data-testid="success-message"
            className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-green-700"
          >
            ✓ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            data-testid="error-message"
            className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700"
          >
            ✗ {errorMessage}
          </div>
        )}

        {/* Tenant Selection */}
        <Card className="mb-6">
          <div className="mb-4">
            <label
              htmlFor="tenant-select"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              テナント選択
            </label>
            <select
              id="tenant-select"
              data-testid="tenant-select"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              disabled={isLoading || isSaving}
            >
              <option value="demo-booking">Demo Booking (デモ店舗)</option>
              <option value="another-tenant">Another Tenant (別店舗)</option>
            </select>
          </div>
        </Card>

        {/* Actions */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-3">
            <Button
              data-testid="enable-all"
              onClick={enableAll}
              disabled={isLoading || isSaving}
              variant="secondary"
            >
              すべて有効化
            </Button>
            <Button
              data-testid="disable-all"
              onClick={disableAll}
              disabled={isLoading || isSaving}
              variant="secondary"
            >
              すべて無効化
            </Button>
            <div className="ml-auto">
              <Button
                data-testid="save-feature-flags"
                onClick={handleSave}
                disabled={!hasChanges() || isLoading || isSaving}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Feature Flags List */}
        {isLoading ? (
          <div
            data-testid="loading-spinner"
            className="flex items-center justify-center py-12"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {FEATURE_FLAGS_CONFIG.map((config) => (
              <Card key={config.key} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        {config.name}
                      </h3>
                      {config.isImplemented ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                          実装済み
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          未実装
                        </span>
                      )}
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        +{config.price.toLocaleString()}円
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        data-testid={`toggle-${config.key}`}
                        checked={flags[config.key] || false}
                        onChange={() => toggleFeature(config.key)}
                        disabled={isLoading || isSaving}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && (
          <Card className="mt-6 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-purple-900">
                  有効化された機能の合計
                </h3>
                <p className="text-sm text-purple-700">
                  {enabledFeatures.length}個の機能が有効化されています
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-900">
                  ¥{totalPrice.toLocaleString()}
                </p>
                <p className="text-sm text-purple-700">（基準パッケージ除く）</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
