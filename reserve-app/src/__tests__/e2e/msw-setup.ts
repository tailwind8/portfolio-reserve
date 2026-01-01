import { Page } from '@playwright/test';

/**
 * MSW Setup Helper for Playwright E2E Tests
 *
 * このヘルパーはPlaywright E2Eテストで各ページのAPIリクエストをモックします。
 * page.route()を使用して、MSWハンドラーのロジックを再利用します。
 */

export interface MSWOptions {
  /** 管理者統計APIでエラーを返す */
  adminStatsError?: boolean;
  /** 管理者統計APIでローディング遅延を追加（ミリ秒） */
  adminStatsDelay?: number;
  /** 管理者統計APIで空データを返す */
  adminStatsEmpty?: boolean;
  /** 管理者予約一覧APIでエラーを返す */
  adminReservationsError?: boolean;
  /** 管理者予約一覧APIで空データを返す */
  adminReservationsEmpty?: boolean;
  /** 管理者予約一覧APIで大量データを返す（ページネーション用） */
  adminReservationsLarge?: boolean;
}

export async function setupMSW(page: Page, options: MSWOptions = {}) {
  // /api/health のモック
  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/menus のモック
  await page.route('**/api/menus', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'カット',
            description: 'シャンプー・ブロー込み',
            price: 5000,
            duration: 60,
            category: 'ヘアスタイル',
            isActive: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'カラー',
            description: 'フルカラー',
            price: 8000,
            duration: 90,
            category: 'カラーリング',
            isActive: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'パーマ',
            description: 'デジタルパーマ',
            price: 12000,
            duration: 120,
            category: 'パーマ',
            isActive: true,
          },
        ],
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/staff のモック
  await page.route('**/api/staff', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            name: '田中太郎',
            role: 'シニアスタイリスト',
            isActive: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440012',
            name: '佐藤花子',
            role: 'スタイリスト',
            isActive: true,
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440013',
            name: '鈴木一郎',
            role: 'アシスタント',
            isActive: true,
          },
        ],
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/admin/stats のモック
  await page.route('**/api/admin/stats**', async (route) => {
    // オプション: 遅延をシミュレート
    if (options.adminStatsDelay) {
      await new Promise(resolve => setTimeout(resolve, options.adminStatsDelay));
    }

    // オプション: エラーを返す
    if (options.adminStatsError) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'データの取得に失敗しました',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    const today = new Date();
    const weeklyStats = [];

    // 過去7日間の統計を生成
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weeklyStats.push({
        date: date.toISOString().split('T')[0],
        day: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
        count: options.adminStatsEmpty ? 0 : Math.floor(Math.random() * 10) + 5,
      });
    }

    // オプション: 空データを返す
    const todayReservationsList = options.adminStatsEmpty ? [] : [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        time: '10:00',
        customer: '山田太郎',
        email: 'yamada@example.com',
        menu: 'カット',
        staff: '田中太郎',
        status: 'CONFIRMED',
        price: 5000,
        duration: 60,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        time: '11:30',
        customer: '佐藤花子',
        email: 'sato@example.com',
        menu: 'カラー',
        staff: '佐藤花子',
        status: 'CONFIRMED',
        price: 8000,
        duration: 90,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        time: '14:00',
        customer: '鈴木一郎',
        email: 'suzuki@example.com',
        menu: 'パーマ',
        staff: '田中太郎',
        status: 'PENDING',
        price: 12000,
        duration: 120,
      },
    ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          todayReservations: options.adminStatsEmpty ? 0 : 8,
          monthlyReservations: options.adminStatsEmpty ? 0 : 156,
          monthlyRevenue: options.adminStatsEmpty ? 0 : 1248000,
          repeatRate: options.adminStatsEmpty ? 0 : 68,
          todayReservationsList,
          weeklyStats,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/auth/register のモック
  await page.route('**/api/auth/register', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // バリデーションエラー
    if (!postData?.email || !postData?.password || !postData?.name) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // パスワード強度チェック
    if (postData.password.length < 8) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // 成功レスポンス
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440201',
            email: postData.email,
            name: postData.name,
            phone: postData.phone || null,
            createdAt: new Date().toISOString(),
          },
          message: 'Registration successful',
          requiresEmailVerification: true,
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/auth/login のモック
  await page.route('**/api/auth/login', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // バリデーションエラー
    if (!postData?.email || !postData?.password) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // 認証失敗のシミュレーション
    if (postData.email === 'nonexistent@example.com' || postData.password === 'wrongpassword') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'メールアドレスまたはパスワードが正しくありません',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // 成功レスポンス
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: {
            id: '550e8400-e29b-41d4-a716-446655440201',
            email: postData.email,
            name: 'テストユーザー',
            phone: '090-1234-5678',
            createdAt: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/reservations/:id PATCH/DELETE のモック
  await page.route('**/api/reservations/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const reservationId = url.split('/').pop()?.split('?')[0];

    if (request.method() === 'PATCH') {
      const postData = request.postDataJSON();

      // 成功レスポンス
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: reservationId,
            ...postData,
            updatedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } else if (request.method() === 'DELETE') {
      // 成功レスポンス
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: reservationId,
            status: 'CANCELLED',
            cancelledAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      await route.continue();
    }
  });

  // /api/reservations GET/POST のモック
  await page.route('**/api/reservations', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      const userId = request.headers()['x-user-id'];

      // userIdチェックは緩和（テスト環境用）
      const effectiveUserId = userId || 'test-user-id';

      // 将来の日付を生成（テストで編集・キャンセル可能にするため）
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 14);
      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 21);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440301',
              userId: effectiveUserId,
              menuId: '550e8400-e29b-41d4-a716-446655440001',
              staffId: '550e8400-e29b-41d4-a716-446655440011',
              reservedDate: futureDate1.toISOString().split('T')[0],
              reservedTime: '14:00',
              status: 'CONFIRMED',
              menu: {
                name: 'カット',
                price: 5000,
                duration: 60,
              },
              staff: {
                name: '田中太郎',
              },
              notes: 'よろしくお願いします',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440302',
              userId: effectiveUserId,
              menuId: '550e8400-e29b-41d4-a716-446655440002',
              staffId: '550e8400-e29b-41d4-a716-446655440012',
              reservedDate: futureDate2.toISOString().split('T')[0],
              reservedTime: '11:00',
              status: 'PENDING',
              menu: {
                name: 'カラー',
                price: 8000,
                duration: 90,
              },
              staff: {
                name: '佐藤花子',
              },
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440303',
              userId: effectiveUserId,
              menuId: '550e8400-e29b-41d4-a716-446655440003',
              staffId: '550e8400-e29b-41d4-a716-446655440013',
              reservedDate: futureDate3.toISOString().split('T')[0],
              reservedTime: '10:00',
              status: 'CONFIRMED',
              menu: {
                name: 'パーマ',
                price: 12000,
                duration: 120,
              },
              staff: {
                name: '鈴木一郎',
              },
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      });
    } else if (request.method() === 'POST') {
      const userId = request.headers()['x-user-id'];
      const postData = request.postDataJSON();

      if (!userId) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      // UUID検証
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (postData.menuId && !uuidRegex.test(postData.menuId)) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid menu ID format',
            },
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      // 過去日付チェック
      if (postData.reservedDate) {
        const reservedDate = new Date(postData.reservedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (reservedDate < today) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Cannot book past dates',
              },
              timestamp: new Date().toISOString(),
            }),
          });
          return;
        }
      }

      // 成功レスポンス
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '550e8400-e29b-41d4-a716-446655440302',
            userId,
            ...postData,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      await route.continue();
    }
  });

  // /api/available-slots のモック
  await page.route('**/api/available-slots**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const date = url.searchParams.get('date');
    const menuId = url.searchParams.get('menuId');

    // パラメータ検証
    if (!date || !menuId) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date and menuId are required',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // 日付形式検証
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date format. Expected YYYY-MM-DD',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // UUID検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(menuId)) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid UUID format for menuId',
          },
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    // 成功レスポンス（30分単位のスロット）
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          date,
          slots: [
            { time: '10:00', available: true },
            { time: '10:30', available: true },
            { time: '11:00', available: true },
            { time: '11:30', available: false }, // 予約済み
            { time: '12:00', available: false }, // 予約済み
            { time: '12:30', available: true },
            { time: '13:00', available: true },
            { time: '13:30', available: true },
            { time: '14:00', available: true },
            { time: '14:30', available: true },
            { time: '15:00', available: true },
            { time: '15:30', available: true },
            { time: '16:00', available: true },
            { time: '16:30', available: true },
            { time: '17:00', available: true },
            { time: '17:30', available: true },
            { time: '18:00', available: true },
            { time: '18:30', available: true },
            { time: '19:00', available: true },
            { time: '19:30', available: true },
          ],
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  // /api/admin/menus のモック
  await page.route('**/api/admin/menus**', async (route) => {
    const request = route.request();
    const url = request.url();

    // 個別メニューの操作（/:id）
    if (url.match(/\/api\/admin\/menus\/[^/]+$/)) {
      const menuId = url.split('/').pop();

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: menuId,
              name: 'カット',
              description: 'シャンプー・ブロー込み',
              price: 5000,
              duration: 60,
              category: 'ヘアケア',
              isActive: true,
              _count: {
                reservations: 0,
              },
            },
            timestamp: new Date().toISOString(),
          }),
        });
      } else if (request.method() === 'PATCH') {
        const postData = request.postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: menuId,
              ...postData,
              updatedAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          }),
        });
      } else if (request.method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
          }),
        });
      }
      return;
    }

    // メニュー一覧の取得と作成
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'カット',
              description: 'シャンプー・ブロー込み',
              price: 5000,
              duration: 60,
              category: 'ヘアケア',
              isActive: true,
              _count: {
                reservations: 0,
              },
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'カラー',
              description: 'フルカラー',
              price: 8000,
              duration: 90,
              category: 'カラーリング',
              isActive: true,
              _count: {
                reservations: 0,
              },
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440003',
              name: 'パーマ',
              description: 'デジタルパーマ',
              price: 12000,
              duration: 120,
              category: 'パーマ',
              isActive: true,
              _count: {
                reservations: 0,
              },
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      });
    } else if (request.method() === 'POST') {
      const postData = request.postDataJSON();

      // バリデーション
      if (!postData?.name || !postData?.price || !postData?.duration) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
            },
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '550e8400-e29b-41d4-a716-446655440004',
            ...postData,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      });
    }
  });

  // /api/admin/reservations のモック
  await page.route('**/api/admin/reservations**', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      // オプション: エラーを返す
      if (options.adminReservationsError) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'データの取得に失敗しました',
            },
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      // オプション: 空データを返す
      if (options.adminReservationsEmpty) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      // オプション: 大量データを返す（ページネーション用）
      if (options.adminReservationsLarge) {
        const largeData = [];
        for (let i = 1; i <= 25; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          largeData.push({
            id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
            reservedDate: futureDate.toISOString().split('T')[0],
            reservedTime: `${10 + (i % 8)}:00`,
            customerName: `顧客${i}`,
            menuName: ['カット', 'カラー', 'パーマ'][i % 3],
            staffName: ['田中太郎', '佐藤花子', '鈴木一郎'][i % 3],
            status: ['CONFIRMED', 'PENDING', 'CONFIRMED'][i % 3] as 'CONFIRMED' | 'PENDING',
            notes: i % 5 === 0 ? `備考${i}` : undefined,
          });
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: largeData,
            timestamp: new Date().toISOString(),
          }),
        });
        return;
      }

      // 通常のデータを返す（5件）
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 7);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 10);
      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 14);
      const futureDate4 = new Date();
      futureDate4.setDate(futureDate4.getDate() + 21);
      const futureDate5 = new Date();
      futureDate5.setDate(futureDate5.getDate() + 28);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440501',
              reservedDate: '2025-01-20',
              reservedTime: '10:00',
              customerName: '山田太郎',
              menuName: 'カット',
              staffName: '田中',
              status: 'CONFIRMED',
              notes: 'よろしくお願いします',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440502',
              reservedDate: futureDate2.toISOString().split('T')[0],
              reservedTime: '11:30',
              customerName: '佐藤花子',
              menuName: 'カラー',
              staffName: '佐藤',
              status: 'PENDING',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440503',
              reservedDate: futureDate3.toISOString().split('T')[0],
              reservedTime: '14:00',
              customerName: '鈴木一郎',
              menuName: 'パーマ',
              staffName: '鈴木',
              status: 'CONFIRMED',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440504',
              reservedDate: futureDate4.toISOString().split('T')[0],
              reservedTime: '15:30',
              customerName: '高橋美咲',
              menuName: 'カット',
              staffName: '田中',
              status: 'CONFIRMED',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440505',
              reservedDate: futureDate5.toISOString().split('T')[0],
              reservedTime: '16:00',
              customerName: '伊藤健太',
              menuName: 'カラー',
              staffName: '佐藤',
              status: 'PENDING',
            },
          ],
          timestamp: new Date().toISOString(),
        }),
      });
    } else {
      await route.continue();
    }
  });

  console.log('✓ MSW API mocks setup complete for this page');
}
