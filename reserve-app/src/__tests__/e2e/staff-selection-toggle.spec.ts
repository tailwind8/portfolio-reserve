import { test, expect } from '@playwright/test';
import { BookingPage } from './pages/BookingPage';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage';
import { FeatureFlagsPage } from './pages/FeatureFlagsPage';
import { prisma } from '@/lib/prisma';

/**
 * Issue #77: スタッフ指名機能のON/OFF設定
 *
 * Gherkinシナリオ: documents/spec/issue-77-78-gherkin-scenarios.md
 *
 * 目的:
 * - 機能フラグ enableStaffSelection に応じて予約フローが動的に変わることを検証
 * - スタッフ指名ON: スタッフ選択欄が表示され、指名あり/なし選択可能
 * - スタッフ指名OFF: スタッフ選択欄が非表示、システムが自動割り当て
 */

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

test.describe('Issue #77: スタッフ指名機能のON/OFF設定', () => {
  let bookingPage: BookingPage;
  let superAdminLoginPage: SuperAdminLoginPage;
  let featureFlagsPage: FeatureFlagsPage;

  test.beforeEach(async ({ page }) => {
    bookingPage = new BookingPage(page);
    superAdminLoginPage = new SuperAdminLoginPage(page);
    featureFlagsPage = new FeatureFlagsPage(page);
  });

  test.afterEach(async () => {
    // テスト後に機能フラグをデフォルト値（true）にリセット
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: true },
    });
  });

  // ========================================
  // シナリオ1: スタッフ指名機能ON（デフォルト）
  // ========================================
  test('スタッフ指名機能がONの場合、予約フォームにスタッフ選択欄が表示される', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: true },
    });

    // When: 一般ユーザーとして予約ページにアクセス
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択欄が表示される
    await bookingPage.expectStaffSelectVisible();

    // And: スタッフ選択肢に「指名なし」が含まれる
    const staffSelect = page.locator('select#staff');
    const options = await staffSelect.locator('option').allTextContents();
    expect(options.some(text => text.includes('指名なし'))).toBe(true);
  });

  test('スタッフ指名機能がONの場合、スタッフを指名して予約できる', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: true },
    });

    // スタッフを取得
    const staff = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    expect(staff).toBeDefined();

    // When: 一般ユーザーとして予約フォームで入力
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // メニュー選択
    await bookingPage.selectMenu(1);

    // 日付選択（明日）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-day="${tomorrowDay}"]`);

    // 時間選択（空き時間API取得完了まで待機）
    const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
    await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
    await firstTimeSlot.click();

    // 時間が選択されたことを確認（少し待機）
    await page.waitForTimeout(500);

    // スタッフ選択欄が表示されるまで待機（機能フラグ取得完了を待つ）
    await bookingPage.expectStaffSelectVisible();

    // スタッフ選択
    if (staff) {
      await page.locator('select#staff').selectOption(staff.id);
    }

    // 予約ボタンが有効になるまで待つ（React状態更新の完了を待つ）
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });

    // 予約確定
    await page.click('[data-testid="submit-button"]');

    // Then: 予約が正常に登録される
    await page.waitForURL('**/mypage**');
    await expect(page.locator('text=予約が完了しました')).toBeVisible();

    // 予約詳細に担当スタッフが表示される
    if (staff) {
      await expect(page.locator(`text=${staff.name}`)).toBeVisible();
    }
  });

  test('スタッフ指名機能がONの場合、指名なしで予約できる', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: true },
    });

    // When: 一般ユーザーとして予約フォームで入力
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // メニュー選択
    await bookingPage.selectMenu(1);

    // 日付選択（明日）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-day="${tomorrowDay}"]`);

    // 時間選択（空き時間API取得完了まで待機）
    const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
    await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
    await firstTimeSlot.click();

    // 時間が選択されたことを確認（少し待機）
    await page.waitForTimeout(500);

    // スタッフ選択欄が表示されるまで待機（機能フラグ取得完了を待つ）
    await bookingPage.expectStaffSelectVisible();

    // スタッフ選択（指名なし）
    await page.locator('select#staff').selectOption('');

    // 予約ボタンが有効になるまで待つ（React状態更新の完了を待つ）
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });

    // 予約確定
    await page.click('[data-testid="submit-button"]');

    // Then: 予約が正常に登録される
    await page.waitForURL('**/mypage**');
    await expect(page.locator('text=予約が完了しました')).toBeVisible();

    // システムがスタッフを自動的に割り当てる
    const reservation = await prisma.bookingReservation.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { createdAt: 'desc' },
    });
    expect(reservation).toBeDefined();
    expect(reservation?.staffId).toBeDefined(); // スタッフが自動割り当てされている
  });

  // ========================================
  // シナリオ2: スタッフ指名機能OFF
  // ========================================
  test('スタッフ指名機能がOFFの場合、予約フォームにスタッフ選択欄が表示されない', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: false },
    });

    // When: 一般ユーザーとして予約ページにアクセス
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択欄が表示されない
    const staffSelect = page.locator('select#staff');
    await expect(staffSelect).not.toBeVisible();

    // And: 空き時間スロットが表示される
    await bookingPage.selectMenu(1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-day="${tomorrowDay}"]`);
    await expect(page.locator('[data-testid="time-slot"]').first()).toBeVisible();
  });

  test('スタッフ指名機能がOFFの場合、スタッフが自動割り当てされる', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: false },
    });

    // When: 一般ユーザーとして予約フォームで入力
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // メニュー選択
    await bookingPage.selectMenu(1);

    // 日付選択（明日）
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-day="${tomorrowDay}"]`);

    // 時間選択（空き時間API取得完了まで待機）
    const firstTimeSlot = page.locator('[data-testid="time-slot"]').first();
    await firstTimeSlot.waitFor({ state: 'visible', timeout: 10000 });
    await firstTimeSlot.click();

    // 時間が選択されたことを確認（少し待機）
    await page.waitForTimeout(500);

    // 予約ボタンが有効になるまで待つ（React状態更新の完了を待つ）
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled({ timeout: 5000 });

    // 予約確定（スタッフ選択なし）
    await page.click('[data-testid="submit-button"]');

    // Then: 予約が正常に登録される
    await page.waitForURL('**/mypage**');
    await expect(page.locator('text=予約が完了しました')).toBeVisible();

    // システムが自動的にスタッフを割り当てる
    const reservation = await prisma.bookingReservation.findFirst({
      where: { tenantId: TENANT_ID },
      orderBy: { createdAt: 'desc' },
    });
    expect(reservation).toBeDefined();
    expect(reservation?.staffId).toBeDefined(); // スタッフが自動割り当てされている

    // 予約詳細に担当スタッフが表示される
    const staff = await prisma.bookingStaff.findUnique({
      where: { id: reservation?.staffId || '' },
    });
    if (staff) {
      await expect(page.locator(`text=${staff.name}`)).toBeVisible();
    }
  });

  test('スタッフ指名機能がOFFの場合、空き時間APIは全スタッフの空き状況を統合して返す', async ({ request }) => {
    // Given: 機能フラグ enableStaffSelection が false
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: false },
    });

    // Given: スタッフ1の特定時間に予約が入っている
    const staff1 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true },
    });
    const staff2 = await prisma.bookingStaff.findFirst({
      where: { tenantId: TENANT_ID, isActive: true, NOT: { id: staff1?.id } },
    });
    const menu = await prisma.bookingMenu.findFirst({
      where: { tenantId: TENANT_ID },
    });
    const user = await prisma.bookingUser.findFirst({
      where: { tenantId: TENANT_ID },
    });

    expect(staff1).toBeDefined();
    expect(staff2).toBeDefined();
    expect(menu).toBeDefined();
    expect(user).toBeDefined();

    // スタッフ1の2026-01-10 10:00に予約を作成
    const reservationDate = new Date('2026-01-10T00:00:00Z');
    await prisma.bookingReservation.create({
      data: {
        tenantId: TENANT_ID,
        userId: user!.id,
        staffId: staff1!.id,
        menuId: menu!.id,
        reservedDate: reservationDate,
        reservedTime: '10:00',
        status: 'CONFIRMED',
      },
    });

    // When: 空き時間APIを呼び出す（スタッフ指定なし）
    const response = await request.get(
      `/api/available-slots?date=2026-01-10&menuId=${menu!.id}`
    );

    // Then: 10:00 のスロットが available: true として返される（スタッフ2が空いているため）
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const slot10 = body.data.slots.find((s: { time: string }) => s.time === '10:00');
    expect(slot10).toBeDefined();
    expect(slot10.available).toBe(true);
    expect(slot10.staffId).toBe(staff2!.id); // スタッフ2が割り当てられる
  });

  // ========================================
  // シナリオ3: 動的な切り替え
  // ========================================
  test('スーパー管理者が機能フラグをOFFに変更すると、即座に反映される', async ({ page }) => {
    // Given: 機能フラグ enableStaffSelection が true
    await prisma.featureFlag.update({
      where: { tenantId: TENANT_ID },
      data: { enableStaffSelection: true },
    });

    // 初期状態: スタッフ選択欄が表示される
    await bookingPage.goto();
    await bookingPage.waitForLoad();
    await bookingPage.expectStaffSelectVisible();

    // When: スーパー管理者が機能フラグをfalseに変更
    if (process.env.SKIP_AUTH_IN_TEST !== 'true') {
      await superAdminLoginPage.goto();
      await superAdminLoginPage.login();
    }

    await featureFlagsPage.goto();
    await featureFlagsPage.waitForLoad();
    await featureFlagsPage.toggleFeatureFlag('enableStaffSelection');
    await featureFlagsPage.save();
    await featureFlagsPage.expectSuccessMessage();

    // And: 一般ユーザーとして予約ページを開き直す
    await bookingPage.goto();
    await bookingPage.waitForLoad();

    // Then: スタッフ選択欄が表示されない
    const staffSelect = page.locator('select#staff');
    await expect(staffSelect).not.toBeVisible();
  });
});
