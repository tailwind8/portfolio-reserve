import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/api-response';

/**
 * GET /api/feature-flags
 * 機能フラグを取得（全ユーザー向け・読み取り専用）
 *
 * 特徴:
 * - 認証不要（誰でもアクセス可能）
 * - 読み取り専用（GETのみ）
 * - エラー時は安全側に倒す（すべてfalse）
 *
 * 用途:
 * - 予約フォーム、管理者ダッシュボードなどで機能フラグを読み取る
 * - スーパー管理者が設定した機能フラグに応じてUI表示を制御
 *
 * Query Parameters:
 * - なし（テナントIDは環境変数から取得）
 */
export async function GET() {
  try {
    // テナントIDを環境変数から取得
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // FeatureFlagをDBから取得
    const featureFlag = await prisma.featureFlag.findUnique({
      where: {
        tenantId,
      },
    });

    if (!featureFlag) {
      // テナントが存在しない場合はデフォルト値を返す（すべてfalse）
      return successResponse({
        featureFlags: {
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
        },
      });
    }

    // 機能フラグを返す
    return successResponse({
      featureFlags: {
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
      },
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);

    // エラー時は安全側に倒す（すべてfalse）
    return successResponse({
      featureFlags: {
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
      },
    });
  }
}
