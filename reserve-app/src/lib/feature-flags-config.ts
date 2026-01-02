/**
 * 機能フラグの定義
 */

export type FeatureFlagKey =
  | 'enableStaffSelection'
  | 'enableStaffShiftManagement'
  | 'enableCustomerManagement'
  | 'enableReservationUpdate'
  | 'enableReminderEmail'
  | 'enableManualReservation'
  | 'enableAnalyticsReport'
  | 'enableRepeatRateAnalysis'
  | 'enableCouponFeature'
  | 'enableLineNotification';

export interface FeatureFlagConfig {
  key: FeatureFlagKey;
  name: string;
  description: string;
  price: number; // 円単位
  isImplemented: boolean; // 実装済みかどうか
  category: 'basic' | 'advanced' | 'premium'; // カテゴリ
}

/**
 * 機能フラグの設定一覧（10種類）
 * ココナラ販売時のオプション機能
 */
export const FEATURE_FLAGS_CONFIG: FeatureFlagConfig[] = [
  {
    key: 'enableStaffSelection',
    name: 'スタッフ指名機能',
    description: '予約時に担当スタッフを指名できる機能',
    price: 8000,
    isImplemented: true,
    category: 'basic',
  },
  {
    key: 'enableStaffShiftManagement',
    name: 'スタッフシフト管理',
    description: 'スタッフの勤務シフトを登録・管理する機能',
    price: 10000,
    isImplemented: true,
    category: 'basic',
  },
  {
    key: 'enableCustomerManagement',
    name: '顧客管理・メモ機能',
    description: '顧客情報とメモを管理する機能',
    price: 12000,
    isImplemented: true,
    category: 'basic',
  },
  {
    key: 'enableReservationUpdate',
    name: '予約変更機能',
    description: '顧客が予約を変更できる機能',
    price: 5000,
    isImplemented: false,
    category: 'basic',
  },
  {
    key: 'enableReminderEmail',
    name: 'リマインダーメール',
    description: '予約日の前日にリマインダーメールを送信',
    price: 8000,
    isImplemented: true,
    category: 'basic',
  },
  {
    key: 'enableManualReservation',
    name: '予約手動追加',
    description: '管理者が予約を手動で追加できる機能',
    price: 6000,
    isImplemented: true,
    category: 'basic',
  },
  {
    key: 'enableAnalyticsReport',
    name: '分析レポート',
    description: '予約・売上の詳細分析レポート',
    price: 15000,
    isImplemented: true,
    category: 'advanced',
  },
  {
    key: 'enableRepeatRateAnalysis',
    name: 'リピート率分析',
    description: '顧客のリピート率を分析する機能',
    price: 12000,
    isImplemented: false,
    category: 'advanced',
  },
  {
    key: 'enableCouponFeature',
    name: 'クーポン機能',
    description: '割引クーポンの発行・管理機能',
    price: 18000,
    isImplemented: false,
    category: 'premium',
  },
  {
    key: 'enableLineNotification',
    name: 'LINE通知連携',
    description: '予約通知をLINEで受け取れる機能',
    price: 20000,
    isImplemented: false,
    category: 'premium',
  },
];

/**
 * カテゴリ表示名
 */
export const CATEGORY_LABELS: Record<
  FeatureFlagConfig['category'],
  string
> = {
  basic: '基本機能',
  advanced: '高度な機能',
  premium: 'プレミアム機能',
};

/**
 * 合計金額を計算
 * @param flags - 有効化された機能フラグのキー配列
 * @returns 合計金額（円）
 */
export function calculateTotalPrice(flags: FeatureFlagKey[]): number {
  return FEATURE_FLAGS_CONFIG.filter((config) => flags.includes(config.key))
    .reduce((sum, config) => sum + config.price, 0);
}

/**
 * 実装済み機能のみをフィルタリング
 */
export function getImplementedFeatures(): FeatureFlagConfig[] {
  return FEATURE_FLAGS_CONFIG.filter((config) => config.isImplemented);
}

/**
 * 未実装機能のみをフィルタリング
 */
export function getNotImplementedFeatures(): FeatureFlagConfig[] {
  return FEATURE_FLAGS_CONFIG.filter((config) => !config.isImplemented);
}
