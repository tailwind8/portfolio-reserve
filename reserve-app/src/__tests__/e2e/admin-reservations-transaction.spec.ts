import { test, expect } from '@playwright/test';

/**
 * E2Eテスト: 管理者予約作成のトランザクション処理とRace Condition防止
 *
 * このテストは、管理者が予約を作成する際のトランザクション処理を検証します。
 * - Race Condition対策（並行リクエストで1つのみ成功）
 * - エラー時のロールバック（データ整合性保証）
 * - トランザクション内の検証エラー処理
 *
 * 対応Gherkin: transaction-race-condition.feature
 * 対応Issue: #70
 */

test.describe('管理者予約作成のトランザクション処理', () => {
  let userId1: string;
  let userId2: string;
  let menuId: string;
  let staffId: string;

  // 管理者認証ヘッダー（E2Eテスト用）
  const adminHeaders = {
    'x-user-id': 'test-admin-user',
    'x-user-role': 'ADMIN',
  };

  test.beforeAll(async ({ request }) => {
    // テストデータのセットアップ
    // ユーザー1を取得（tanaka@example.com）
    const users = await request.get('/api/admin/customers', {
      headers: adminHeaders,
    });

    if (!users.ok()) {
      throw new Error('Failed to fetch customers');
    }

    const usersData = await users.json();
    const user1 = usersData.data.find((u: { email: string }) => u.email === 'tanaka@example.com');
    userId1 = user1?.id;

    const user2 = usersData.data.find((u: { email: string }) => u.email === 'suzuki@example.com');
    userId2 = user2?.id;

    // メニュー取得
    const menus = await request.get('/api/menus');
    if (!menus.ok()) {
      throw new Error('Failed to fetch menus');
    }
    const menusData = await menus.json();
    menuId = menusData.data[0]?.id;

    // スタッフ取得
    const staff = await request.get('/api/staff');
    if (!staff.ok()) {
      throw new Error('Failed to fetch staff');
    }
    const staffData = await staff.json();
    staffId = staffData.data[0]?.id;
  });

  test('【Race Condition】同時に同じ時間帯の予約を作成した場合、1つだけ成功する', async ({ request }) => {
    // 予約日時を設定（未来の日付）
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 10);
    const dateString = reservedDate.toISOString().split('T')[0];

    // 予約データ
    const reservationData1 = {
      userId: userId1,
      menuId,
      staffId,
      reservedDate: dateString,
      reservedTime: '14:00',
      notes: 'テスト予約1（Race Condition）',
    };

    const reservationData2 = {
      userId: userId2,
      menuId,
      staffId,
      reservedDate: dateString,
      reservedTime: '14:00',
      notes: 'テスト予約2（Race Condition）',
    };

    // 同時に2つのリクエストを送信（Promise.allで並行実行）
    const [response1, response2] = await Promise.all([
      request.post('/api/admin/reservations', {
        headers: adminHeaders,
        data: reservationData1,
      }),
      request.post('/api/admin/reservations', {
        headers: adminHeaders,
        data: reservationData2,
      }),
    ]);

    const result1 = await response1.json();
    const result2 = await response2.json();

    // どちらか一方のみ成功することを確認
    const successCount = [response1.ok(), response2.ok()].filter(Boolean).length;
    expect(successCount).toBe(1);

    // 失敗したリクエストのエラーコードを確認
    if (!response1.ok()) {
      expect(result1.code).toBe('TIME_SLOT_CONFLICT');
      expect(response1.status()).toBe(409);
    } else {
      expect(result2.code).toBe('TIME_SLOT_CONFLICT');
      expect(response2.status()).toBe(409);
    }

    // 成功した予約をクリーンアップ
    const successResponse = response1.ok() ? response1 : response2;
    const successData = response1.ok() ? result1 : result2;
    if (successResponse.ok() && successData.data?.id) {
      await request.delete(`/api/admin/reservations/${successData.data.id}`, {
        headers: adminHeaders,
      });
    }
  });

  test('【ロールバック】存在しないユーザーIDで予約作成した場合、エラーでロールバックされる', async ({ request }) => {
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 11);
    const dateString = reservedDate.toISOString().split('T')[0];

    // 存在しないユーザーIDで予約を試みる
    const invalidReservationData = {
      userId: '00000000-0000-0000-0000-000000000000', // 存在しないUUID
      menuId,
      staffId,
      reservedDate: dateString,
      reservedTime: '15:00',
      notes: 'テスト予約（無効なユーザー）',
    };

    const response = await request.post('/api/admin/reservations', {
      headers: adminHeaders,
      data: invalidReservationData,
    });

    // エラーレスポンスを確認
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);

    const result = await response.json();
    expect(result.code).toBe('USER_NOT_FOUND');
    expect(result.message).toBe('User not found');

    // データベースに予約が作成されていないことを確認
    const reservations = await request.get('/api/admin/reservations', {
      headers: adminHeaders,
    });
    const reservationsData = await reservations.json();
    const created = reservationsData.data.find(
      (r: { notes: string }) => r.notes === 'テスト予約（無効なユーザー）'
    );
    expect(created).toBeUndefined();
  });

  test('【ロールバック】非アクティブなメニューIDで予約作成した場合、エラーでロールバックされる', async ({ request }) => {
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 12);
    const dateString = reservedDate.toISOString().split('T')[0];

    // 非アクティブなメニューIDを取得（存在しないIDでテスト）
    const invalidMenuId = '00000000-0000-0000-0000-000000000000';

    const invalidReservationData = {
      userId: userId1,
      menuId: invalidMenuId,
      staffId,
      reservedDate: dateString,
      reservedTime: '16:00',
      notes: 'テスト予約（無効なメニュー）',
    };

    const response = await request.post('/api/admin/reservations', {
      headers: adminHeaders,
      data: invalidReservationData,
    });

    // エラーレスポンスを確認
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);

    const result = await response.json();
    expect(result.code).toBe('MENU_NOT_FOUND');
    expect(result.message).toBe('Menu not found or inactive');

    // データベースに予約が作成されていないことを確認
    const reservations = await request.get('/api/admin/reservations', {
      headers: adminHeaders,
    });
    const reservationsData = await reservations.json();
    const created = reservationsData.data.find(
      (r: { notes: string }) => r.notes === 'テスト予約（無効なメニュー）'
    );
    expect(created).toBeUndefined();
  });

  test('【ロールバック】非アクティブなスタッフIDで予約作成した場合、エラーでロールバックされる', async ({ request }) => {
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 13);
    const dateString = reservedDate.toISOString().split('T')[0];

    const invalidStaffId = '00000000-0000-0000-0000-000000000000';

    const invalidReservationData = {
      userId: userId1,
      menuId,
      staffId: invalidStaffId,
      reservedDate: dateString,
      reservedTime: '17:00',
      notes: 'テスト予約（無効なスタッフ）',
    };

    const response = await request.post('/api/admin/reservations', {
      headers: adminHeaders,
      data: invalidReservationData,
    });

    // エラーレスポンスを確認
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404);

    const result = await response.json();
    expect(result.code).toBe('STAFF_NOT_FOUND');
    expect(result.message).toBe('Staff not found or inactive');

    // データベースに予約が作成されていないことを確認
    const reservations = await request.get('/api/admin/reservations', {
      headers: adminHeaders,
    });
    const reservationsData = await reservations.json();
    const created = reservationsData.data.find(
      (r: { notes: string }) => r.notes === 'テスト予約（無効なスタッフ）'
    );
    expect(created).toBeUndefined();
  });

  test('【データ整合性】複数の並行リクエストで1つのみ成功し、他はすべて失敗する', async ({ request }) => {
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 14);
    const dateString = reservedDate.toISOString().split('T')[0];

    // 5つの並行リクエストを送信
    const requests = Array.from({ length: 5 }, (_, i) => ({
      userId: i % 2 === 0 ? userId1 : userId2,
      menuId,
      staffId,
      reservedDate: dateString,
      reservedTime: '18:00',
      notes: `並行テスト予約${i + 1}`,
    }));

    const responses = await Promise.all(
      requests.map((data) =>
        request.post('/api/admin/reservations', {
          headers: adminHeaders,
          data,
        })
      )
    );

    // 成功したリクエストは1つのみ
    const successCount = responses.filter((r) => r.ok()).length;
    expect(successCount).toBe(1);

    // 失敗したリクエストはすべて409エラー
    const failedResponses = await Promise.all(
      responses.filter((r) => !r.ok()).map((r) => r.json())
    );

    failedResponses.forEach((result) => {
      expect(result.code).toBe('TIME_SLOT_CONFLICT');
    });

    // 成功した予約をクリーンアップ
    const successResponse = responses.find((r) => r.ok());
    if (successResponse) {
      const successData = await successResponse.json();
      if (successData.data?.id) {
        await request.delete(`/api/admin/reservations/${successData.data.id}`, {
          headers: adminHeaders,
        });
      }
    }
  });

  test('【HTTPステータス】トランザクションエラーが適切なHTTPステータスコードで返される', async ({ request }) => {
    // 既存の予約を作成
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + 15);
    const dateString = reservedDate.toISOString().split('T')[0];

    const firstReservation = await request.post('/api/admin/reservations', {
      headers: adminHeaders,
      data: {
        userId: userId1,
        menuId,
        staffId,
        reservedDate: dateString,
        reservedTime: '19:00',
        notes: '先行予約',
      },
    });

    expect(firstReservation.ok()).toBeTruthy();
    const firstData = await firstReservation.json();

    // 同じ時間帯に予約を試みる
    const conflictResponse = await request.post('/api/admin/reservations', {
      headers: adminHeaders,
      data: {
        userId: userId2,
        menuId,
        staffId,
        reservedDate: dateString,
        reservedTime: '19:00',
        notes: '衝突予約',
      },
    });

    // HTTPステータスコード409が返されることを確認
    expect(conflictResponse.status()).toBe(409);

    const conflictData = await conflictResponse.json();
    expect(conflictData.code).toBe('TIME_SLOT_CONFLICT');
    expect(conflictData.message).toBe('This time slot is already booked for the selected staff');

    // クリーンアップ
    if (firstData.data?.id) {
      await request.delete(`/api/admin/reservations/${firstData.data.id}`, {
        headers: adminHeaders,
      });
    }
  });
});
