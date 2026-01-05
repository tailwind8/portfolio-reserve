/**
 * api-feature-flag.ts のユニットテスト
 *
 * フィーチャーフラグAPI関数のテスト
 */

import { NextResponse } from 'next/server';

// Prismaをモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getFeatureFlags, requireFeatureFlag, type FeatureFlagName } from '@/lib/api-feature-flag';

// console.error をモック
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('api-feature-flag', () => {
  const mockFeatureFlags = {
    enableStaffSelection: true,
    enableStaffShiftManagement: false,
    enableCustomerManagement: true,
    enableReservationUpdate: false,
    enableReminderEmail: true,
    enableManualReservation: true,
    enableAnalyticsReport: false,
    enableRepeatRateAnalysis: false,
    enableCouponFeature: false,
    enableLineNotification: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_TENANT_ID = 'demo-booking';
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('getFeatureFlags', () => {
    it('should return feature flags when found', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      const result = await getFeatureFlags();

      expect(result).toEqual(mockFeatureFlags);
      expect(prisma.featureFlag.findUnique).toHaveBeenCalledWith({
        where: { tenantId: 'demo-booking' },
      });
    });

    it('should return null when feature flags not found', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getFeatureFlags();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('機能フラグが見つかりませんでした');
    });

    it('should return null when database error occurs', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await getFeatureFlags();

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '機能フラグの取得中にエラーが発生しました:',
        expect.any(Error)
      );
    });

    it('should use default tenant ID when env not set', async () => {
      delete process.env.NEXT_PUBLIC_TENANT_ID;
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      await getFeatureFlags();

      expect(prisma.featureFlag.findUnique).toHaveBeenCalledWith({
        where: { tenantId: 'demo-booking' },
      });
    });

    it('should map all feature flag fields correctly', async () => {
      const dbFlags = {
        enableStaffSelection: true,
        enableStaffShiftManagement: true,
        enableCustomerManagement: true,
        enableReservationUpdate: true,
        enableReminderEmail: true,
        enableManualReservation: true,
        enableAnalyticsReport: true,
        enableRepeatRateAnalysis: true,
        enableCouponFeature: true,
        enableLineNotification: true,
      };
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(dbFlags);

      const result = await getFeatureFlags();

      expect(result).toEqual(dbFlags);
      expect(Object.keys(result!)).toHaveLength(10);
    });
  });

  describe('requireFeatureFlag', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockResolvedValue(NextResponse.json({ success: true, data: [] }));
    });

    it('should call handler when feature flag is enabled', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      const response = await requireFeatureFlag('enableStaffSelection', mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      const body = await response.json();
      expect(body).toEqual({ success: true, data: [] });
    });

    it('should return 403 when feature flag is disabled', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      const response = await requireFeatureFlag('enableStaffShiftManagement', mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: 'この機能は現在無効です',
      });
    });

    it('should return 403 when feature flags cannot be fetched', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await requireFeatureFlag('enableStaffSelection', mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: 'この機能は現在無効です（機能フラグの取得に失敗しました）',
      });
    });

    it('should return 403 when database error occurs', async () => {
      (prisma.featureFlag.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const response = await requireFeatureFlag('enableStaffSelection', mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it.each([
      ['enableStaffSelection', true, true],
      ['enableStaffShiftManagement', false, false],
      ['enableCustomerManagement', true, true],
      ['enableReservationUpdate', false, false],
      ['enableReminderEmail', true, true],
      ['enableManualReservation', true, true],
      ['enableAnalyticsReport', false, false],
      ['enableRepeatRateAnalysis', false, false],
      ['enableCouponFeature', false, false],
      ['enableLineNotification', false, false],
    ])(
      'should handle %s flag (enabled: %s) correctly',
      async (flagName, isEnabled, expectHandlerCalled) => {
        (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

        const response = await requireFeatureFlag(flagName as FeatureFlagName, mockHandler);

        if (expectHandlerCalled) {
          expect(mockHandler).toHaveBeenCalled();
          expect(response.status).toBe(200);
        } else {
          expect(mockHandler).not.toHaveBeenCalled();
          expect(response.status).toBe(403);
        }
      }
    );

    it('should propagate handler response correctly', async () => {
      const customResponse = NextResponse.json(
        { success: true, data: { id: '123' } },
        { status: 201 }
      );
      mockHandler.mockResolvedValue(customResponse);
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      const response = await requireFeatureFlag('enableStaffSelection', mockHandler);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({ success: true, data: { id: '123' } });
    });

    it('should handle handler errors gracefully', async () => {
      mockHandler.mockRejectedValue(new Error('Handler error'));
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(mockFeatureFlags);

      await expect(
        requireFeatureFlag('enableStaffSelection', mockHandler)
      ).rejects.toThrow('Handler error');
    });
  });
});
