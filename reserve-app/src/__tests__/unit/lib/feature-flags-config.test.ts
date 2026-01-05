/**
 * feature-flags-config.ts のユニットテスト
 *
 * フィーチャーフラグの設定定義と価格計算関数のテスト
 */

import {
  FEATURE_FLAGS_CONFIG,
  CATEGORY_LABELS,
  calculateTotalPrice,
  getImplementedFeatures,
  getNotImplementedFeatures,
  type FeatureFlagKey,
  type FeatureFlagConfig,
} from '@/lib/feature-flags-config';

describe('feature-flags-config', () => {
  describe('FEATURE_FLAGS_CONFIG', () => {
    it('should have exactly 10 feature flags', () => {
      expect(FEATURE_FLAGS_CONFIG).toHaveLength(10);
    });

    it('should have unique keys for all flags', () => {
      const keys = FEATURE_FLAGS_CONFIG.map((f) => f.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have all required fields for each flag', () => {
      FEATURE_FLAGS_CONFIG.forEach((flag) => {
        expect(flag).toHaveProperty('key');
        expect(flag).toHaveProperty('name');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('price');
        expect(flag).toHaveProperty('isImplemented');
        expect(flag).toHaveProperty('category');
      });
    });

    it('should have positive integer prices', () => {
      FEATURE_FLAGS_CONFIG.forEach((flag) => {
        expect(typeof flag.price).toBe('number');
        expect(flag.price).toBeGreaterThan(0);
        expect(Number.isInteger(flag.price)).toBe(true);
      });
    });

    it('should have valid categories', () => {
      const validCategories = ['basic', 'advanced', 'premium'];
      FEATURE_FLAGS_CONFIG.forEach((flag) => {
        expect(validCategories).toContain(flag.category);
      });
    });

    it('should have boolean isImplemented values', () => {
      FEATURE_FLAGS_CONFIG.forEach((flag) => {
        expect(typeof flag.isImplemented).toBe('boolean');
      });
    });

    it('should have non-empty names and descriptions', () => {
      FEATURE_FLAGS_CONFIG.forEach((flag) => {
        expect(flag.name.length).toBeGreaterThan(0);
        expect(flag.description.length).toBeGreaterThan(0);
      });
    });

    it('should contain expected flag keys', () => {
      const keys = FEATURE_FLAGS_CONFIG.map((f) => f.key);
      expect(keys).toContain('enableStaffSelection');
      expect(keys).toContain('enableStaffShiftManagement');
      expect(keys).toContain('enableCustomerManagement');
      expect(keys).toContain('enableReservationUpdate');
      expect(keys).toContain('enableReminderEmail');
      expect(keys).toContain('enableManualReservation');
      expect(keys).toContain('enableAnalyticsReport');
      expect(keys).toContain('enableRepeatRateAnalysis');
      expect(keys).toContain('enableCouponFeature');
      expect(keys).toContain('enableLineNotification');
    });

    describe('specific flag prices', () => {
      it.each([
        ['enableStaffSelection', 8000],
        ['enableStaffShiftManagement', 10000],
        ['enableCustomerManagement', 12000],
        ['enableReservationUpdate', 5000],
        ['enableReminderEmail', 8000],
        ['enableManualReservation', 6000],
        ['enableAnalyticsReport', 15000],
        ['enableRepeatRateAnalysis', 12000],
        ['enableCouponFeature', 18000],
        ['enableLineNotification', 20000],
      ])('%s should have price %d', (key, expectedPrice) => {
        const flag = FEATURE_FLAGS_CONFIG.find((f) => f.key === key);
        expect(flag?.price).toBe(expectedPrice);
      });
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('should have label for basic category', () => {
      expect(CATEGORY_LABELS.basic).toBe('基本機能');
    });

    it('should have label for advanced category', () => {
      expect(CATEGORY_LABELS.advanced).toBe('高度な機能');
    });

    it('should have label for premium category', () => {
      expect(CATEGORY_LABELS.premium).toBe('プレミアム機能');
    });

    it('should have labels for all three categories', () => {
      expect(Object.keys(CATEGORY_LABELS)).toHaveLength(3);
    });
  });

  describe('calculateTotalPrice', () => {
    it('should return 0 for empty array', () => {
      expect(calculateTotalPrice([])).toBe(0);
    });

    it('should return correct price for single flag', () => {
      expect(calculateTotalPrice(['enableStaffSelection'])).toBe(8000);
    });

    it('should return correct price for multiple flags', () => {
      const total = calculateTotalPrice([
        'enableStaffSelection', // 8,000
        'enableStaffShiftManagement', // 10,000
        'enableCustomerManagement', // 12,000
      ]);
      expect(total).toBe(30000);
    });

    it('should calculate all basic features correctly', () => {
      const basicFlags: FeatureFlagKey[] = [
        'enableStaffSelection', // 8,000
        'enableStaffShiftManagement', // 10,000
        'enableCustomerManagement', // 12,000
        'enableReservationUpdate', // 5,000
        'enableReminderEmail', // 8,000
        'enableManualReservation', // 6,000
      ];
      expect(calculateTotalPrice(basicFlags)).toBe(49000);
    });

    it('should calculate all flags correctly', () => {
      const allFlags: FeatureFlagKey[] = FEATURE_FLAGS_CONFIG.map((f) => f.key);
      // 8000 + 10000 + 12000 + 5000 + 8000 + 6000 + 15000 + 12000 + 18000 + 20000
      expect(calculateTotalPrice(allFlags)).toBe(114000);
    });

    it('should ignore non-existent flag keys', () => {
      const flags = [
        'enableStaffSelection',
        'nonExistentFlag' as FeatureFlagKey,
      ];
      expect(calculateTotalPrice(flags)).toBe(8000);
    });

    it('should handle duplicate flags (count only once)', () => {
      // filter + includes で重複は自動的に1回のみカウントされる
      const flags: FeatureFlagKey[] = [
        'enableStaffSelection',
        'enableStaffSelection',
      ];
      // 実装上は重複があっても1回のみカウントされる（filter + includes の動作）
      expect(calculateTotalPrice(flags)).toBe(8000);
    });

    it.each([
      [['enableStaffSelection'], 8000],
      [['enableAnalyticsReport'], 15000],
      [['enableLineNotification'], 20000],
      [['enableStaffSelection', 'enableReminderEmail'], 16000],
      [['enableCouponFeature', 'enableLineNotification'], 38000],
    ])('calculateTotalPrice(%j) should return %d', (flags, expected) => {
      expect(calculateTotalPrice(flags as FeatureFlagKey[])).toBe(expected);
    });
  });

  describe('getImplementedFeatures', () => {
    let implementedFeatures: FeatureFlagConfig[];

    beforeAll(() => {
      implementedFeatures = getImplementedFeatures();
    });

    it('should return only implemented features', () => {
      expect(implementedFeatures.every((f) => f.isImplemented)).toBe(true);
    });

    it('should return 6 implemented features', () => {
      expect(implementedFeatures).toHaveLength(6);
    });

    it('should include enableStaffSelection', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableStaffSelection');
    });

    it('should include enableStaffShiftManagement', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableStaffShiftManagement');
    });

    it('should include enableCustomerManagement', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableCustomerManagement');
    });

    it('should include enableReminderEmail', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableReminderEmail');
    });

    it('should include enableManualReservation', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableManualReservation');
    });

    it('should include enableAnalyticsReport', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableAnalyticsReport');
    });

    it('should not include unimplemented features', () => {
      const keys = implementedFeatures.map((f) => f.key);
      expect(keys).not.toContain('enableReservationUpdate');
      expect(keys).not.toContain('enableRepeatRateAnalysis');
      expect(keys).not.toContain('enableCouponFeature');
      expect(keys).not.toContain('enableLineNotification');
    });

    it('should return features with all required fields', () => {
      implementedFeatures.forEach((flag) => {
        expect(flag).toHaveProperty('key');
        expect(flag).toHaveProperty('name');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('price');
        expect(flag).toHaveProperty('isImplemented');
        expect(flag).toHaveProperty('category');
      });
    });
  });

  describe('getNotImplementedFeatures', () => {
    let notImplementedFeatures: FeatureFlagConfig[];

    beforeAll(() => {
      notImplementedFeatures = getNotImplementedFeatures();
    });

    it('should return only not implemented features', () => {
      expect(notImplementedFeatures.every((f) => !f.isImplemented)).toBe(true);
    });

    it('should return 4 not implemented features', () => {
      expect(notImplementedFeatures).toHaveLength(4);
    });

    it('should include enableReservationUpdate', () => {
      const keys = notImplementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableReservationUpdate');
    });

    it('should include enableRepeatRateAnalysis', () => {
      const keys = notImplementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableRepeatRateAnalysis');
    });

    it('should include enableCouponFeature', () => {
      const keys = notImplementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableCouponFeature');
    });

    it('should include enableLineNotification', () => {
      const keys = notImplementedFeatures.map((f) => f.key);
      expect(keys).toContain('enableLineNotification');
    });

    it('should not include implemented features', () => {
      const keys = notImplementedFeatures.map((f) => f.key);
      expect(keys).not.toContain('enableStaffSelection');
      expect(keys).not.toContain('enableStaffShiftManagement');
      expect(keys).not.toContain('enableCustomerManagement');
      expect(keys).not.toContain('enableReminderEmail');
      expect(keys).not.toContain('enableManualReservation');
      expect(keys).not.toContain('enableAnalyticsReport');
    });

    it('should return features with all required fields', () => {
      notImplementedFeatures.forEach((flag) => {
        expect(flag).toHaveProperty('key');
        expect(flag).toHaveProperty('name');
        expect(flag).toHaveProperty('description');
        expect(flag).toHaveProperty('price');
        expect(flag).toHaveProperty('isImplemented');
        expect(flag).toHaveProperty('category');
      });
    });
  });

  describe('implemented and not implemented features are complete', () => {
    it('should have all flags accounted for', () => {
      const implemented = getImplementedFeatures();
      const notImplemented = getNotImplementedFeatures();
      expect(implemented.length + notImplemented.length).toBe(
        FEATURE_FLAGS_CONFIG.length
      );
    });

    it('should have no overlap between implemented and not implemented', () => {
      const implementedKeys = getImplementedFeatures().map((f) => f.key);
      const notImplementedKeys = getNotImplementedFeatures().map((f) => f.key);
      const intersection = implementedKeys.filter((k) =>
        notImplementedKeys.includes(k)
      );
      expect(intersection).toHaveLength(0);
    });
  });
});
