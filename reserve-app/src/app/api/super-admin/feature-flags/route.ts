import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { supabase } from '@/lib/supabase';
import { FeatureFlagKey } from '@/lib/feature-flags-config';

/**
 * スーパー管理者のロールをチェック
 * @returns ユーザー情報（SUPER_ADMINの場合）またはnull
 */
async function checkSuperAdminRole(request: NextRequest) {
  try {
    // Supabaseのセッションを取得
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // データベースからユーザー情報とロールを取得
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
    const dbUser = await prisma.bookingUser.findFirst({
      where: {
        tenantId,
        authId: user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
      return null;
    }

    return dbUser;
  } catch (error) {
    console.error('Error checking super admin role:', error);
    return null;
  }
}

/**
 * GET /api/super-admin/feature-flags
 * 機能フラグを取得（スーパー管理者専用）
 *
 * Query Parameters:
 * - tenantId: テナントID（必須）
 */
export async function GET(request: NextRequest) {
  try {
    // スーパー管理者権限チェック
    const superAdmin = await checkSuperAdminRole(request);
    if (!superAdmin) {
      return errorResponse('スーパー管理者権限が必要です', 403);
    }

    // クエリパラメータからテナントIDを取得
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return errorResponse('tenantIdパラメータが必要です', 400);
    }

    // FeatureFlagをDBから取得
    const featureFlag = await prisma.featureFlag.findUnique({
      where: {
        tenantId,
      },
    });

    if (!featureFlag) {
      // テナントが存在しない場合はデフォルト値を返す
      return successResponse({
        tenantId,
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

    return successResponse({
      tenantId: featureFlag.tenantId,
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
    return errorResponse('サーバーエラーが発生しました', 500);
  }
}

/**
 * PATCH /api/super-admin/feature-flags
 * 機能フラグを更新（スーパー管理者専用）
 *
 * Request Body:
 * {
 *   tenantId: string,
 *   featureFlags: Record<FeatureFlagKey, boolean>
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // スーパー管理者権限チェック
    const superAdmin = await checkSuperAdminRole(request);
    if (!superAdmin) {
      return errorResponse('スーパー管理者権限が必要です', 403);
    }

    const body = await request.json();
    const { tenantId, featureFlags } = body;

    if (!tenantId || !featureFlags) {
      return errorResponse(
        'tenantIdとfeatureFlagsパラメータが必要です',
        400
      );
    }

    // FeatureFlagをupsert（存在しなければ作成、存在すれば更新）
    const updatedFeatureFlag = await prisma.featureFlag.upsert({
      where: {
        tenantId,
      },
      update: {
        enableStaffSelection: featureFlags.enableStaffSelection ?? false,
        enableStaffShiftManagement:
          featureFlags.enableStaffShiftManagement ?? false,
        enableCustomerManagement: featureFlags.enableCustomerManagement ?? false,
        enableReservationUpdate: featureFlags.enableReservationUpdate ?? false,
        enableReminderEmail: featureFlags.enableReminderEmail ?? false,
        enableManualReservation: featureFlags.enableManualReservation ?? false,
        enableAnalyticsReport: featureFlags.enableAnalyticsReport ?? false,
        enableRepeatRateAnalysis: featureFlags.enableRepeatRateAnalysis ?? false,
        enableCouponFeature: featureFlags.enableCouponFeature ?? false,
        enableLineNotification: featureFlags.enableLineNotification ?? false,
      },
      create: {
        tenantId,
        enableStaffSelection: featureFlags.enableStaffSelection ?? false,
        enableStaffShiftManagement:
          featureFlags.enableStaffShiftManagement ?? false,
        enableCustomerManagement: featureFlags.enableCustomerManagement ?? false,
        enableReservationUpdate: featureFlags.enableReservationUpdate ?? false,
        enableReminderEmail: featureFlags.enableReminderEmail ?? false,
        enableManualReservation: featureFlags.enableManualReservation ?? false,
        enableAnalyticsReport: featureFlags.enableAnalyticsReport ?? false,
        enableRepeatRateAnalysis: featureFlags.enableRepeatRateAnalysis ?? false,
        enableCouponFeature: featureFlags.enableCouponFeature ?? false,
        enableLineNotification: featureFlags.enableLineNotification ?? false,
      },
    });

    // 監査ログ出力
    console.log(
      `[AUDIT] Super admin ${superAdmin.email} updated feature flags for tenant ${tenantId}`
    );

    return successResponse({
      tenantId: updatedFeatureFlag.tenantId,
      featureFlags: {
        enableStaffSelection: updatedFeatureFlag.enableStaffSelection,
        enableStaffShiftManagement:
          updatedFeatureFlag.enableStaffShiftManagement,
        enableCustomerManagement: updatedFeatureFlag.enableCustomerManagement,
        enableReservationUpdate: updatedFeatureFlag.enableReservationUpdate,
        enableReminderEmail: updatedFeatureFlag.enableReminderEmail,
        enableManualReservation: updatedFeatureFlag.enableManualReservation,
        enableAnalyticsReport: updatedFeatureFlag.enableAnalyticsReport,
        enableRepeatRateAnalysis: updatedFeatureFlag.enableRepeatRateAnalysis,
        enableCouponFeature: updatedFeatureFlag.enableCouponFeature,
        enableLineNotification: updatedFeatureFlag.enableLineNotification,
      },
      message: '機能フラグを更新しました',
    });
  } catch (error) {
    console.error('Error updating feature flags:', error);
    return errorResponse('サーバーエラーが発生しました', 500);
  }
}
