import { Page } from '@playwright/test';

/**
 * MSW Setup Helper for Playwright E2E Tests
 *
 * このヘルパーはPlaywright E2Eテストで各ページのAPIリクエストをモックします。
 * page.route()を使用して、MSWハンドラーのロジックを再利用します。
 */

export async function setupMSW(page: Page) {
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
    const today = new Date();
    const weeklyStats = [];

    // 過去7日間の統計を生成
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      weeklyStats.push({
        date: date.toISOString().split('T')[0],
        day: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
        count: Math.floor(Math.random() * 10) + 5,
      });
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          todayReservations: 8,
          monthlyReservations: 156,
          monthlyRevenue: 1248000,
          repeatRate: 68,
          todayReservationsList: [
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
          ],
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
          message: 'Registration successful. Please check your email to verify your account.',
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
    if (postData.email === 'invalid@example.com' || postData.password === 'wrongpassword') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password',
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

  // /api/reservations GET のモック
  await page.route('**/api/reservations', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      const userId = request.headers()['x-user-id'];

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

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440301',
              userId,
              menuId: '550e8400-e29b-41d4-a716-446655440001',
              staffId: '550e8400-e29b-41d4-a716-446655440011',
              reservedDate: '2025-01-20',
              reservedTime: '14:00',
              status: 'CONFIRMED',
              menu: {
                name: 'カット',
                price: 5000,
              },
              staff: {
                name: '田中太郎',
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

    // 成功レスポンス
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          date,
          slots: [
            { time: '10:00', available: true },
            { time: '11:00', available: true },
            { time: '12:00', available: false },
            { time: '14:00', available: true },
            { time: '15:00', available: true },
          ],
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });

  console.log('✓ MSW API mocks setup complete for this page');
}
