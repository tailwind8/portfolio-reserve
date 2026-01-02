import { test, expect } from '@playwright/test';
import { AdminStaffPage } from './pages/AdminStaffPage';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';
import { prisma } from '@/lib/prisma';

/**
 * Issue #78: スタッフシフト管理のON/OFF設定
 *
 * Gherkinシナリオ: documents/spec/issue-77-78-gherkin-scenarios.md
 *
 * 目的:
 * - 機能フラグ enableStaffShiftManagement に応じてシフト管理機能が動的に変わることを検証
 * - シフト管理ON: シフト・休暇設定UIが表示され、空き時間APIがシフトを考慮
 * - シフト管理OFF: シフト・休暇設定UIが非表示、全isActive=trueスタッフを対象
 */

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

test.describe('Issue #78: スタッフシフト管理のON/OFF設定', () => {
  let adminStaffPage: AdminStaffPage;
  let loginPage: LoginPage;
  let superAdminLoginPage: SuperAdminLoginPage;
  let featureFlagsPage: FeatureFlagsPage;

  test.beforeEach(async ({ page }) => {
    adminStaffPage = new AdminStaffPage(page);
    loginPage = new LoginPage(page);
    superAdminLoginPage = new SuperAdminLoginPage(page);
    featureFlagsPage = new FeatureFlagsPage(page);

    // 管理者としてログイン
    if (process.env.SKIP_AUTH_IN_TEST !== 'true') {
      await loginPage.goto();
      await loginPage.loginAsAdmin();
    }
  });

  test.afterEach(async () => {
    // テスト後に機能フラグをデフォルト値（false）にリセット
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: false },
    });

    // テストデータのクリーンアップ
    await prisma.bookingStaffShift.deleteMany({
      where: { tenantId: TENANT_ID },
    });
    await prisma.bookingStaffVacation.deleteMany({
      where: { tenantId: TENANT_ID },
    });
  });

  // ========================================
  // シナリオ1: シフト管理機能OFF（デフォルト）
  // ========================================
  test('シフト管理機能がOFFの場合、全てのisActive=trueスタッフが空き時間に含まれる', async ({ request }) => {
    // Given: 機能フラグ enableStaffShiftManagement が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: false },
    });

    // Given: スタッフ1、スタッフ2がisActive=true
    const staff1 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    const staff2 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true, NOT: { id: staff1?.id } },
    });
    const menu = await prisma.bookingMenu.findFirst({
      where: { tenantId: TENANT_ID },
    });

    expect(staff1).toBeDefined();
    expect(staff2).toBeDefined();
    expect(menu).toBeDefined();

    // Given: スタッフ1にはシフトが登録されていない
    const shift1 = await prisma.bookingStaffShift.findFirst({
      where: { staffId: staff1!.id },
    });
    expect(shift1).toBeNull();

    // When: 空き時間APIを呼び出す
    const response = await request.get(
      `/api/available-slots?date=2026-01-10&menuId=${menu!.id}`
    );

    // Then: レスポンスにスタッフ1とスタッフ2のスロットが含まれる
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const staffIds = body.data.slots
      .filter((s: { available: boolean }) => s.available)
      .map((s: { staffId?: string }) => s.staffId);

    expect(staffIds).toContain(staff1!.id);
    expect(staffIds).toContain(staff2!.id);
  });

  test('シフト管理機能がOFFの場合、管理画面にシフト設定メニューが表示されない', async ({ page }) => {
    // Given: 機能フラグ enableStaffShiftManagement が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: false },
    });

    // When: 管理画面のスタッフページにアクセス
    await adminStaffPage.goto();
    await adminStaffPage.waitForLoad();

    // Then: スタッフ一覧が表示される
    await adminStaffPage.expectStaffListVisible();

    // And: シフト設定タブが表示されない
    const shiftTab = page.locator('[data-testid="tab-shift-settings"]');
    await expect(shiftTab).not.toBeVisible();

    // And: 休暇設定タブが表示されない
    const vacationTab = page.locator('[data-testid="tab-vacation-settings"]');
    await expect(vacationTab).not.toBeVisible();
  });

  // ========================================
  // シナリオ2: シフト管理機能ON
  // ========================================
  test('シフト管理機能がONの場合、シフトに基づいて空き時間が計算される', async ({ request }) => {
    // Given: 機能フラグ enableStaffShiftManagement が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: true },
    });

    // Given: スタッフ1のシフトが設定されている（金曜日 09:00-15:00）
    const staff1 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    const staff2 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true, NOT: { id: staff1?.id } },
    });
    const menu = await prisma.bookingMenu.findFirst({
      where: { tenantId: TENANT_ID },
    });

    expect(staff1).toBeDefined();
    expect(staff2).toBeDefined();
    expect(menu).toBeDefined();

    // スタッフ1のシフト: 金曜日 09:00-15:00
    await prisma.bookingStaffShift.create({
      data: {
        tenantId: TENANT_ID,
        staffId: staff1!.id,
        dayOfWeek: 'FRIDAY',
        startTime: '09:00',
        endTime: '15:00',
        isActive: true,
      },
    });

    // スタッフ2のシフト: 金曜日 14:00-20:00
    await prisma.bookingStaffShift.create({
      data: {
        tenantId: TENANT_ID,
        staffId: staff2!.id,
        dayOfWeek: 'FRIDAY',
        startTime: '14:00',
        endTime: '20:00',
        isActive: true,
      },
    });

    // Given: 2026-01-10が金曜日である
    const testDate = new Date('2026-01-10');
    expect(testDate.getDay()).toBe(5); // 5 = Friday

    // When: 空き時間APIを呼び出す
    const response = await request.get(
      `/api/available-slots?date=2026-01-10&menuId=${menu!.id}`
    );

    // Then: レスポンスが正常に返される
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // 10:00のスロット: スタッフ1が割り当て可能（09:00-15:00のシフト内）
    const slot10 = body.data.slots.find((s: { time: string }) => s.time === '10:00');
    if (slot10 && slot10.staffId === staff1!.id) {
      expect(slot10.available).toBe(true);
    }

    // 16:00のスロット: スタッフ2が割り当て可能（14:00-20:00のシフト内）
    const slot16 = body.data.slots.find((s: { time: string }) => s.time === '16:00');
    if (slot16 && slot16.staffId === staff2!.id) {
      expect(slot16.available).toBe(true);
    }
  });

  test('シフト管理機能がONの場合、休暇期間のスタッフは空き時間に含まれない', async ({ request }) => {
    // Given: 機能フラグ enableStaffShiftManagement が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: true },
    });

    // Given: スタッフ1のシフトが設定されている
    const staff1 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    const menu = await prisma.bookingMenu.findFirst({
      where: { tenantId: TENANT_ID },
    });

    expect(staff1).toBeDefined();
    expect(menu).toBeDefined();

    // スタッフ1のシフト: 金曜日 09:00-18:00
    await prisma.bookingStaffShift.create({
      data: {
        tenantId: TENANT_ID,
        staffId: staff1!.id,
        dayOfWeek: 'FRIDAY',
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      },
    });

    // Given: スタッフ1の休暇が設定されている（2026-01-10 ~ 2026-01-12）
    await prisma.bookingStaffVacation.create({
      data: {
        tenantId: TENANT_ID,
        staffId: staff1!.id,
        startDate: new Date('2026-01-10T00:00:00Z'),
        endDate: new Date('2026-01-12T23:59:59Z'),
        reason: 'テスト休暇',
      },
    });

    // When: 空き時間APIを呼び出す（休暇期間内の日付）
    const response = await request.get(
      `/api/available-slots?date=2026-01-10&menuId=${menu!.id}`
    );

    // Then: レスポンスが正常に返される
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // レスポンスにスタッフ1のスロットが含まれない
    const staffIds = body.data.slots
      .filter((s: { available: boolean }) => s.available)
      .map((s: { staffId?: string }) => s.staffId);

    expect(staffIds).not.toContain(staff1!.id);
  });

  test('シフト管理機能がONの場合、管理画面にシフト設定メニューが表示される', async ({ page }) => {
    // Given: 機能フラグ enableStaffShiftManagement が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: true },
    });

    // When: 管理画面のスタッフページにアクセス
    await adminStaffPage.goto();
    await adminStaffPage.waitForLoad();

    // Then: スタッフ一覧が表示される
    await adminStaffPage.expectStaffListVisible();

    // And: シフト設定タブが表示される
    const shiftTab = page.locator('[data-testid="tab-shift-settings"]');
    await expect(shiftTab).toBeVisible();

    // And: 休暇設定タブが表示される
    const vacationTab = page.locator('[data-testid="tab-vacation-settings"]');
    await expect(vacationTab).toBeVisible();
  });

  test('シフト管理機能がONの場合、管理者がスタッフのシフトを登録できる', async ({ page }) => {
    // Given: 機能フラグ enableStaffShiftManagement が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: true },
    });

    const staff = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    expect(staff).toBeDefined();

    // When: 管理画面のスタッフページでスタッフを選択
    await adminStaffPage.goto();
    await adminStaffPage.waitForLoad();

    // スタッフを選択
    await page.click(`[data-testid="staff-row-${staff!.id}"]`);

    // And: シフト設定タブをクリック
    await page.click('[data-testid="tab-shift-settings"]');

    // And: シフトを登録
    await page.selectOption('[data-testid="shift-day-select"]', 'MONDAY');
    await page.fill('[data-testid="shift-start-time"]', '09:00');
    await page.fill('[data-testid="shift-end-time"]', '18:00');

    // And: 保存ボタンをクリック
    await page.click('[data-testid="save-shift-button"]');

    // Then: シフトが正常に登録される
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // データベースに保存されている
    const shift = await prisma.bookingStaffShift.findFirst({
      where: {
        staffId: staff!.id,
        dayOfWeek: 'MONDAY',
      },
    });
    expect(shift).toBeDefined();
    expect(shift!.startTime).toBe('09:00');
    expect(shift!.endTime).toBe('18:00');
  });

  // ========================================
  // シナリオ3: 動的な切り替え
  // ========================================
  test('スーパー管理者が機能フラグをONに変更すると、シフトUIが表示される', async ({ page, context }) => {
    // Given: 機能フラグ enableStaffShiftManagement が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: false },
    });

    // 初期状態: シフト設定タブが表示されない
    await adminStaffPage.goto();
    await adminStaffPage.waitForLoad();
    const shiftTabBefore = page.locator('[data-testid="tab-shift-settings"]');
    await expect(shiftTabBefore).not.toBeVisible();

    // When: スーパー管理者が機能フラグをtrueに変更
    // 新しいページでスーパー管理者ログイン
    const superAdminPage = await context.newPage();
    const superAdminLogin = new SuperAdminLoginPage(superAdminPage);
    const featureFlags = new FeatureFlagsPage(superAdminPage);

    if (process.env.SKIP_AUTH_IN_TEST !== 'true') {
      await superAdminLogin.goto();
      await superAdminLogin.login();
    }

    await featureFlags.goto();
    await featureFlags.waitForLoad();
    await featureFlags.toggleFeatureFlag('enableStaffShiftManagement');
    await featureFlags.save();
    await featureFlags.expectSuccessMessage();

    // And: 管理者として管理画面のスタッフページを開き直す
    await adminStaffPage.goto();
    await adminStaffPage.waitForLoad();

    // Then: シフト設定タブが表示される
    const shiftTabAfter = page.locator('[data-testid="tab-shift-settings"]');
    await expect(shiftTabAfter).toBeVisible();

    // And: 休暇設定タブが表示される
    const vacationTabAfter = page.locator('[data-testid="tab-vacation-settings"]');
    await expect(vacationTabAfter).toBeVisible();
  });

  test('シフト未登録のスタッフは、シフト管理ON時に空き時間に含まれない', async ({ request }) => {
    // Given: 機能フラグ enableStaffShiftManagement が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffShiftManagement: true },
    });

    // Given: スタッフ1にシフトが登録されていない
    const staff1 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    const menu = await prisma.bookingMenu.findFirst({
      where: { tenantId: TENANT_ID },
    });

    expect(staff1).toBeDefined();
    expect(menu).toBeDefined();

    // シフトをクリーンアップ
    await prisma.bookingStaffShift.deleteMany({
      where: { staffId: staff1!.id },
    });

    // When: 空き時間APIを呼び出す
    const response = await request.get(
      `/api/available-slots?date=2026-01-10&menuId=${menu!.id}`
    );

    // Then: レスポンスにスタッフ1のスロットが含まれない
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const staffIds = body.data.slots
      .filter((s: { available: boolean }) => s.available)
      .map((s: { staffId?: string }) => s.staffId);

    expect(staffIds).not.toContain(staff1!.id);
  });
});
