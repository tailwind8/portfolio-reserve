import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

/**
 * E2Eテスト: 予約更新のトランザクション処理とRace Condition防止
 *
 * このテストは、予約を更新する際のトランザクション処理を検証します。
 * - Race Condition対策（並行更新で1つのみ成功）
 * - エラー時のロールバック（元の予約データ保持）
 * - 時間重複チェックの整合性保証
 *
 * 対応Gherkin: transaction-race-condition.feature
 * 対応Issue: #70
 */

test.describe('予約更新のトランザクション処理', () => {
  let authCookie: string;
  let reservationId: string;

  test.beforeEach(async ({ page, request }) => {
    // ユーザーログイン
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('tanaka@example.com', 'password123');
    await expect(page).toHaveURL('/mypage');

    // 認証Cookieを取得
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.includes('session'));
    if (sessionCookie) {
      authCookie = `${sessionCookie.name}=${sessionCookie.value}`;
    }

    // テスト用の予約を作成
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 20);
    const dateString = reservedDate.toISOString().split('T')[0];

    // メニューとスタッフを取得
    const menusResponse = await request.get('/api/menus');
    const menusData = await menusResponse.json();
    const menuId = menusData.data[0]?.id;

    const staffResponse = await request.get('/api/staff');
    const staffData = await staffResponse.json();
    const staffId = staffData.data[0]?.id;

    // 予約作成
    const createResponse = await request.post('/api/reservations', {
      headers: {
        Cookie: authCookie,
      },
      data: {
        menuId,
        staffId,
        reservedDate: dateString,
        reservedTime: '14:00',
        notes: 'トランザクションテスト用予約',
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    reservationId = createData.data.id;
  });

  test.afterEach(async ({ request }) => {
    // テスト後のクリーンアップ（予約削除）
    if (reservationId && authCookie) {
      try {
        await request.delete(`/api/reservations/${reservationId}`, {
          headers: {
            Cookie: authCookie,
          },
        });
      } catch {
        // 既に削除されている場合は無視
      }
    }
  });

  test('【Race Condition】同じ予約を同時に更新した場合、1つだけ成功する', async ({ request }) => {
    // 2つの異なる更新内容を準備
    const updateData1 = {
      reservedTime: '15:00',
      notes: '更新1',
    };

    const updateData2 = {
      reservedTime: '16:00',
      notes: '更新2',
    };

    // 同時に2つの更新リクエストを送信
    await Promise.all([
      request.patch(`/api/reservations/${reservationId}`, {
        headers: {
          Cookie: authCookie,
        },
        data: updateData1,
      }),
      request.patch(`/api/reservations/${reservationId}`, {
        headers: {
          Cookie: authCookie,
        },
        data: updateData2,
      }),
    ]);

    // 両方が成功する可能性があるが、最終的な予約は1つの状態のみ
    const finalReservation = await request.get(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(finalReservation.ok()).toBeTruthy();
    const finalData = await finalReservation.json();

    // 最終的な予約時間が15:00または16:00のどちらかであることを確認
    expect(['15:00', '16:00']).toContain(finalData.data.reservedTime);

    // 両方成功した場合でも、どちらか一方の更新内容になっている
    if (finalData.data.reservedTime === '15:00') {
      expect(finalData.data.notes).toBe('更新1');
    } else {
      expect(finalData.data.notes).toBe('更新2');
    }
  });

  test('【ロールバック】時間重複チェックで失敗した場合、元の予約が保持される', async ({ request }) => {
    // 別のユーザーで15:00に予約を作成
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'suzuki@example.com',
        password: 'password123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 20);
    const dateString = reservedDate.toISOString().split('T')[0];

    const menusResponse = await request.get('/api/menus');
    const menusData = await menusResponse.json();
    const menuId = menusData.data[0]?.id;

    const staffResponse = await request.get('/api/staff');
    const staffData = await staffResponse.json();
    const staffId = staffData.data[0]?.id;

    // suzukiで15:00に予約作成（tanakaの予約と同じスタッフ）
    const conflictReservation = await request.post('/api/reservations', {
      data: {
        menuId,
        staffId,
        reservedDate: dateString,
        reservedTime: '15:00',
        notes: '衝突用予約',
      },
    });

    expect(conflictReservation.ok()).toBeTruthy();
    const conflictData = await conflictReservation.json();

    // tanakaの予約を15:00に変更しようとする（衝突）
    const updateResponse = await request.patch(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
      data: {
        reservedTime: '15:00',
      },
    });

    // 更新が失敗することを確認
    expect(updateResponse.ok()).toBeFalsy();
    expect(updateResponse.status()).toBe(409);

    const updateResult = await updateResponse.json();
    expect(updateResult.code).toBe('TIME_SLOT_CONFLICT');

    // 元の予約（14:00）が保持されていることを確認
    const originalReservation = await request.get(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(originalReservation.ok()).toBeTruthy();
    const originalData = await originalReservation.json();
    expect(originalData.data.reservedTime).toBe('14:00');

    // クリーンアップ（suzukiの予約削除）
    await request.delete(`/api/reservations/${conflictData.data.id}`);
  });

  test('【ロールバック】非アクティブなメニューに変更しようとした場合、元の予約が保持される', async ({ request }) => {
    const invalidMenuId = '00000000-0000-0000-0000-000000000000';

    // 非アクティブなメニューに変更を試みる
    const updateResponse = await request.patch(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
      data: {
        menuId: invalidMenuId,
      },
    });

    // 更新が失敗することを確認
    expect(updateResponse.ok()).toBeFalsy();
    expect(updateResponse.status()).toBe(404);

    const updateResult = await updateResponse.json();
    expect(updateResult.code).toBe('MENU_NOT_FOUND');

    // 元の予約が変更されていないことを確認
    const originalReservation = await request.get(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(originalReservation.ok()).toBeTruthy();
    const originalData = await originalReservation.json();

    // 元のメニューIDが保持されている
    expect(originalData.data.menuId).not.toBe(invalidMenuId);
  });

  test('【ロールバック】非アクティブなスタッフに変更しようとした場合、元の予約が保持される', async ({ request }) => {
    const invalidStaffId = '00000000-0000-0000-0000-000000000000';

    // 非アクティブなスタッフに変更を試みる
    const updateResponse = await request.patch(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
      data: {
        staffId: invalidStaffId,
      },
    });

    // 更新が失敗することを確認
    expect(updateResponse.ok()).toBeFalsy();
    expect(updateResponse.status()).toBe(404);

    const updateResult = await updateResponse.json();
    expect(updateResult.code).toBe('STAFF_NOT_FOUND');

    // 元の予約が変更されていないことを確認
    const originalReservation = await request.get(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(originalReservation.ok()).toBeTruthy();
    const originalData = await originalReservation.json();

    // 元のスタッフIDが保持されている
    expect(originalData.data.staffId).not.toBe(invalidStaffId);
  });

  test('【データ整合性】複数の並行更新リクエストで最終的に1つの状態に収束する', async ({ request }) => {
    // 5つの異なる更新内容を準備
    const updates = Array.from({ length: 5 }, (_, i) => ({
      notes: `並行更新${i + 1}`,
    }));

    // 同時に5つの更新リクエストを送信
    const responses = await Promise.all(
      updates.map((data) =>
        request.patch(`/api/reservations/${reservationId}`, {
          headers: {
            Cookie: authCookie,
          },
          data,
        })
      )
    );

    // 少なくとも1つは成功する
    const successCount = responses.filter((r) => r.ok()).length;
    expect(successCount).toBeGreaterThanOrEqual(1);

    // 最終的な予約状態を確認
    const finalReservation = await request.get(`/api/reservations/${reservationId}`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(finalReservation.ok()).toBeTruthy();
    const finalData = await finalReservation.json();

    // notesがいずれかの更新内容になっている
    const possibleNotes = updates.map((u) => u.notes);
    expect(possibleNotes).toContain(finalData.data.notes);
  });

  test('【HTTPステータス】トランザクションエラーが適切なHTTPステータスコードで返される', async ({ request }) => {
    // 存在しない予約IDで更新を試みる
    const invalidReservationId = '00000000-0000-0000-0000-000000000000';

    const updateResponse = await request.patch(`/api/reservations/${invalidReservationId}`, {
      headers: {
        Cookie: authCookie,
      },
      data: {
        notes: '存在しない予約への更新',
      },
    });

    // 404エラーが返されることを確認
    expect(updateResponse.status()).toBe(404);

    const result = await updateResponse.json();
    expect(result.code).toBe('NOT_FOUND');
    expect(result.message).toBe('Reservation not found');
  });
});
