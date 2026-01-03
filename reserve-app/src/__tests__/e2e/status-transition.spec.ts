import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminReservationsPage } from './pages/AdminReservationsPage';
import { BookingPage } from './pages/BookingPage';

/**
 * E2Eテスト: 予約ステータス遷移の制御
 *
 * このテストは、予約ステータスの状態遷移が適切に制御されることを検証します。
 * - 正常な状態遷移（PENDING → CONFIRMED → COMPLETED など）
 * - 不正な状態遷移の防止（COMPLETED → PENDING など）
 * - ステータスに応じた編集・削除制限
 *
 * 対応Gherkin: reserve-app/features/booking/status-transition.feature
 */

// E2E用の管理者認証情報を環境変数から取得
const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@example.com';
const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123';

test.describe('予約ステータス遷移の制御', () => {
  let adminReservationsPage: AdminReservationsPage;

  test.beforeEach(async ({ page }) => {
    // 管理者でログイン（環境変数から認証情報を取得）
    const loginPage = new LoginPage(page);
    await loginPage.goto('/admin/login');
    await loginPage.login(E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD);
    await expect(page).toHaveURL('/admin/dashboard');

    // 予約管理ページに移動
    adminReservationsPage = new AdminReservationsPage(page);
    await adminReservationsPage.goto();
  });

  // ===== 正常な状態遷移 =====

  test('PENDING から CONFIRMED への遷移（正常）', async () => {
    await adminReservationsPage.expectTableVisible();

    // PENDING状態の予約を編集
    await adminReservationsPage.clickEdit(0);
    await adminReservationsPage.expectEditModalVisible();

    // ステータスをCONFIRMEDに変更
    await adminReservationsPage.changeStatus('CONFIRMED');
    await adminReservationsPage.submitEditReservation();

    // 成功メッセージを確認
    await adminReservationsPage.expectSuccessMessage('予約を確定しました');
  });

  test('CONFIRMED から COMPLETED への遷移（正常）', async () => {
    await adminReservationsPage.expectTableVisible();

    // CONFIRMED状態の予約を編集
    await adminReservationsPage.clickEdit(0);
    await adminReservationsPage.expectEditModalVisible();

    // ステータスをCOMPLETEDに変更
    await adminReservationsPage.changeStatus('COMPLETED');
    await adminReservationsPage.submitEditReservation();

    // 成功メッセージを確認
    await adminReservationsPage.expectSuccessMessage('予約を完了しました');
  });

  test('CONFIRMED から CANCELLED への遷移（正常）', async () => {
    await adminReservationsPage.expectTableVisible();

    // CONFIRMED状態の予約を編集
    await adminReservationsPage.clickEdit(0);
    await adminReservationsPage.expectEditModalVisible();

    // ステータスをCANCELLEDに変更
    await adminReservationsPage.changeStatus('CANCELLED');
    await adminReservationsPage.submitEditReservation();

    // 成功メッセージを確認
    await adminReservationsPage.expectSuccessMessage('予約をキャンセルしました');
  });

  test('CONFIRMED から NO_SHOW への遷移（正常）', async () => {
    await adminReservationsPage.expectTableVisible();

    // CONFIRMED状態の予約を編集
    await adminReservationsPage.clickEdit(0);
    await adminReservationsPage.expectEditModalVisible();

    // ステータスをNO_SHOWに変更
    await adminReservationsPage.changeStatus('NO_SHOW');
    await adminReservationsPage.submitEditReservation();

    // 成功メッセージを確認
    await adminReservationsPage.expectSuccessMessage('無断キャンセルとして記録しました');
  });

  // ===== 不正な状態遷移の防止 =====

  test('COMPLETED から PENDING への遷移を防止', async ({ page }) => {
    await adminReservationsPage.expectTableVisible();

    // COMPLETED状態の予約を編集しようとする
    const response = await page.request.patch('/api/reservations/reservation-completed-123', {
      data: {
        status: 'PENDING',
      },
    });

    // 400エラーが返される
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('完了済みの予約は保留状態に戻せません');
  });

  test('COMPLETED から CONFIRMED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-completed-123', {
      data: {
        status: 'CONFIRMED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('完了済みの予約は確定状態に戻せません');
  });

  test('COMPLETED から CANCELLED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-completed-123', {
      data: {
        status: 'CANCELLED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('完了済みの予約はキャンセルできません');
  });

  test('CANCELLED から PENDING への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-cancelled-123', {
      data: {
        status: 'PENDING',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('キャンセル済みの予約は保留状態に戻せません');
  });

  test('CANCELLED から CONFIRMED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-cancelled-123', {
      data: {
        status: 'CONFIRMED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('キャンセル済みの予約は確定状態に戻せません');
  });

  test('CANCELLED から COMPLETED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-cancelled-123', {
      data: {
        status: 'COMPLETED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('キャンセル済みの予約は完了状態にできません');
  });

  test('NO_SHOW から PENDING への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-noshow-123', {
      data: {
        status: 'PENDING',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('無断キャンセルの予約は保留状態に戻せません');
  });

  test('NO_SHOW から CONFIRMED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-noshow-123', {
      data: {
        status: 'CONFIRMED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('無断キャンセルの予約は確定状態に戻せません');
  });

  test('NO_SHOW から COMPLETED への遷移を防止', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-noshow-123', {
      data: {
        status: 'COMPLETED',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('無断キャンセルの予約は完了状態にできません');
  });

  // ===== APIレベルでの防止 =====

  test('APIで不正な状態遷移を試みた場合の防止', async ({ page }) => {
    // COMPLETED状態の予約をPENDINGに変更しようとする
    const response = await page.request.patch('/api/reservations/reservation-completed-123', {
      data: {
        status: 'PENDING',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('不正な状態遷移です');
  });

  // ===== 一般ユーザーによるステータス変更の防止 =====

  test('一般ユーザーは予約ステータスを変更できない', async ({ page }) => {
    // ログアウトして一般ユーザーでログイン
    await page.locator('[data-testid="logout-button"]').click();

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 自分の予約のステータスを変更しようとする
    const response = await page.request.patch('/api/reservations/reservation-tanaka-123', {
      data: {
        status: 'COMPLETED',
      },
    });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('この操作を実行する権限がありません');
  });

  // ===== ステータスに応じた編集制限 =====

  test('COMPLETED ステータスの予約は編集できない', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-completed-123', {
      data: {
        date: '2025-02-01',
        time: '10:00',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('完了済みの予約は編集できません');
  });

  test('CANCELLED ステータスの予約は編集できない', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-cancelled-123', {
      data: {
        date: '2025-02-01',
        time: '10:00',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('キャンセル済みの予約は編集できません');
  });

  test('NO_SHOW ステータスの予約は編集できない', async ({ page }) => {
    const response = await page.request.patch('/api/reservations/reservation-noshow-123', {
      data: {
        date: '2025-02-01',
        time: '10:00',
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('無断キャンセルの予約は編集できません');
  });

  // ===== 削除制限 =====

  test('COMPLETED ステータスの予約は削除できない', async ({ page }) => {
    const response = await page.request.delete('/api/reservations/reservation-completed-123');

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('完了済みの予約は削除できません');
  });

  test('PENDING と CONFIRMED ステータスの予約は削除できる（キャンセルに変更）', async ({ page }) => {
    // CONFIRMED状態の予約を削除
    const response = await page.request.delete('/api/reservations/reservation-confirmed-123');

    // 200 OKが返される（実際には削除ではなくCANCELLED状態に変更）
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toContain('予約をキャンセルしました');

    // ステータスがCANCELLEDに変更されていることを確認
    const getResponse = await page.request.get('/api/reservations/reservation-confirmed-123');
    const reservation = await getResponse.json();
    expect(reservation.status).toBe('CANCELLED');
  });
});
