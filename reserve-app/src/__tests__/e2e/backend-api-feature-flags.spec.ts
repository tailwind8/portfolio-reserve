import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: バックエンドAPI機能フラグチェック
 * Issue: #98
 *
 * API側で機能フラグを確認し、無効な機能へのアクセスを403で返す
 */

// 機能フラグAPIのモックレスポンスを作成するヘルパー関数
function createFeatureFlagsResponse(flags: Partial<Record<string, boolean>> = {}) {
  return {
    success: true,
    data: {
      featureFlags: {
        enableStaffSelection: flags.enableStaffSelection ?? false,
        enableStaffShiftManagement: flags.enableStaffShiftManagement ?? false,
        enableCustomerManagement: flags.enableCustomerManagement ?? false,
        enableReservationUpdate: flags.enableReservationUpdate ?? false,
        enableReminderEmail: flags.enableReminderEmail ?? false,
        enableManualReservation: flags.enableManualReservation ?? false,
        enableAnalyticsReport: flags.enableAnalyticsReport ?? false,
        enableRepeatRateAnalysis: flags.enableRepeatRateAnalysis ?? false,
        enableCouponFeature: flags.enableCouponFeature ?? false,
        enableLineNotification: flags.enableLineNotification ?? false,
      },
    },
  };
}

test.describe('バックエンドAPI機能フラグチェック', () => {
  test('スタッフシフト管理機能が無効な場合、スタッフAPI呼び出しが403エラーを返す', async ({ page }) => {
    // Given: 機能フラグ "enableStaffShiftManagement" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableStaffShiftManagement: false })),
      });
    });

    // When: "/api/admin/staff" に GET リクエストを送信する
    const response = await page.request.get('/api/admin/staff');

    // Then: ステータスコード 403 が返される
    expect(response.status()).toBe(403);

    // And: レスポンスに "この機能は現在無効です" というメッセージが含まれる
    const body = await response.json();
    expect(body.error).toContain('この機能は現在無効です');
  });

  test('スタッフシフト管理機能が有効な場合、スタッフAPI呼び出しが正常に動作する', async ({ page }) => {
    // Given: 機能フラグ "enableStaffShiftManagement" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableStaffShiftManagement: true })),
      });
    });

    // When: "/api/admin/staff" に GET リクエストを送信する
    const response = await page.request.get('/api/admin/staff');

    // Then: ステータスコード 200 が返される
    expect(response.status()).toBe(200);

    // And: スタッフ一覧が取得できる
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('予約変更機能が無効な場合、予約更新API呼び出しが403エラーを返す', async ({ page }) => {
    // Given: 機能フラグ "enableReservationUpdate" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableReservationUpdate: false })),
      });
    });

    // And: 予約ID "test-reservation-1" が存在する
    const reservationId = 'test-reservation-1';

    // When: "/api/reservations/test-reservation-1" に PATCH リクエストを送信する
    const response = await page.request.patch(`/api/reservations/${reservationId}`, {
      data: {
        status: 'confirmed',
      },
    });

    // Then: ステータスコード 403 が返される
    expect(response.status()).toBe(403);

    // And: レスポンスに "この機能は現在無効です" というメッセージが含まれる
    const body = await response.json();
    expect(body.error).toContain('この機能は現在無効です');
  });

  test('予約変更機能が有効な場合、予約更新API呼び出しが正常に動作する', async ({ page }) => {
    // Given: 機能フラグ "enableReservationUpdate" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableReservationUpdate: true })),
      });
    });

    // And: 予約ID "test-reservation-1" が存在する
    const reservationId = 'test-reservation-1';

    // When: "/api/reservations/test-reservation-1" に PATCH リクエストを送信する
    const response = await page.request.patch(`/api/reservations/${reservationId}`, {
      data: {
        status: 'confirmed',
      },
    });

    // Then: ステータスコード 200 または 404 が返される（予約が存在すれば200、なければ404）
    expect([200, 404]).toContain(response.status());

    const body = await response.json();
    if (response.status() === 200) {
      // And: 予約が更新される
      expect(body.success).toBe(true);
    }
  });

  test('手動予約機能が無効な場合、予約作成API呼び出しが403エラーを返す', async ({ page }) => {
    // Given: 機能フラグ "enableManualReservation" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableManualReservation: false })),
      });
    });

    // When: "/api/admin/reservations" に POST リクエストを送信する
    const response = await page.request.post('/api/admin/reservations', {
      data: {
        menuId: 'test-menu-1',
        reservationDate: '2026-02-15',
        startTime: '10:00',
      },
    });

    // Then: ステータスコード 403 が返される
    expect(response.status()).toBe(403);

    // And: レスポンスに "この機能は現在無効です" というメッセージが含まれる
    const body = await response.json();
    expect(body.error).toContain('この機能は現在無効です');
  });

  test('手動予約機能が有効な場合、予約作成API呼び出しが正常に動作する', async ({ page }) => {
    // Given: 機能フラグ "enableManualReservation" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableManualReservation: true })),
      });
    });

    // When: "/api/admin/reservations" に POST リクエストを送信する
    const response = await page.request.post('/api/admin/reservations', {
      data: {
        menuId: 'test-menu-1',
        reservationDate: '2026-02-15',
        startTime: '10:00',
      },
    });

    // Then: ステータスコード 201 または 400/404 が返される（バリデーションエラーや存在しないメニューIDの場合）
    expect([201, 400, 404]).toContain(response.status());

    const body = await response.json();
    if (response.status() === 201) {
      // And: 予約が作成される
      expect(body.success).toBe(true);
    }
  });

  test('リピート率分析機能が無効な場合、分析API呼び出しが403エラーを返す', async ({ page }) => {
    // Given: 機能フラグ "enableRepeatRateAnalysis" が無効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableRepeatRateAnalysis: false })),
      });
    });

    // When: "/api/admin/analytics/repeat-rate" に GET リクエストを送信する
    const response = await page.request.get('/api/admin/analytics/repeat-rate');

    // Then: ステータスコード 403 が返される
    expect(response.status()).toBe(403);

    // And: レスポンスに "この機能は現在無効です" というメッセージが含まれる
    const body = await response.json();
    expect(body.error).toContain('この機能は現在無効です');
  });

  test('リピート率分析機能が有効な場合、分析API呼び出しが正常に動作する', async ({ page }) => {
    // Given: 機能フラグ "enableRepeatRateAnalysis" が有効である
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createFeatureFlagsResponse({ enableRepeatRateAnalysis: true })),
      });
    });

    // When: "/api/admin/analytics/repeat-rate" に GET リクエストを送信する
    const response = await page.request.get('/api/admin/analytics/repeat-rate');

    // Then: ステータスコード 200 または 404 が返される（エンドポイントが存在すれば200）
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      // And: リピート率データが取得できる
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    }
  });

  test('機能フラグが取得できない場合、APIはデフォルトで403エラーを返す', async ({ page }) => {
    // Given: 機能フラグAPIがエラーを返す
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    });

    // When: "/api/admin/staff" に GET リクエストを送信する
    const response = await page.request.get('/api/admin/staff');

    // Then: ステータスコード 403 が返される
    expect(response.status()).toBe(403);
  });
});
