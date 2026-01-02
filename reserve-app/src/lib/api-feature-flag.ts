import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 機能フラグ名の型定義
 */
export type FeatureFlagName =
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

/**
 * 機能フラグをデータベースから直接取得する
 */
async function getFeatureFlags(): Promise<Record<FeatureFlagName, boolean> | null> {
  try {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // データベースから機能フラグを取得
    const featureFlag = await prisma.featureFlag.findUnique({
      where: {
        tenantId,
      },
    });

    if (!featureFlag) {
      console.error('機能フラグが見つかりませんでした');
      return null;
    }

    // FeatureFlagモデルのフィールドをマッピング
    return {
      enableStaffSelection: featureFlag.enableStaffSelection,
      enableStaffShiftManagement: featureFlag.enableStaffShiftManagement,
      enableCustomerManagement: featureFlag.enableCustomerManagement,
      enableReservationUpdate: featureFlag.enableReservationUpdate,
      enableReminderEmail: featureFlag.enableReminderEmail,
      enableManualReservation: featureFlag.enableManualReservation,
      enableAnalyticsReport: featureFlag.enableAnalyticsReport,
      enableRepeatRateAnalysis: featureFlag.enableRepeatRateAnalysis,
      enableCouponFeature: featureFlag.enableCouponFeature,
      enableLineNotification: featureFlag.enableLineNotification,
    };
  } catch (error) {
    console.error('機能フラグの取得中にエラーが発生しました:', error);
    return null;
  }
}

/**
 * API routeで機能フラグをチェックするミドルウェア
 *
 * @param flagName - チェックする機能フラグ名
 * @param handler - フラグが有効な場合に実行するハンドラー関数
 * @returns NextResponse
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return requireFeatureFlag('enableStaffShiftManagement', async () => {
 *     // 実際の処理
 *     return NextResponse.json({ success: true, data: [] });
 *   });
 * }
 */
export async function requireFeatureFlag(
  flagName: FeatureFlagName,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // 機能フラグを取得
  const featureFlags = await getFeatureFlags();

  // 機能フラグの取得に失敗した場合は403を返す
  if (!featureFlags) {
    return NextResponse.json(
      {
        success: false,
        error: 'この機能は現在無効です（機能フラグの取得に失敗しました）',
      },
      { status: 403 }
    );
  }

  // 機能フラグが無効な場合は403を返す
  if (!featureFlags[flagName]) {
    return NextResponse.json(
      {
        success: false,
        error: 'この機能は現在無効です',
      },
      { status: 403 }
    );
  }

  // 機能フラグが有効な場合はハンドラーを実行
  return handler();
}
