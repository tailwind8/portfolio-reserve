import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for E2E Testing
 *
 * このファイルはPlaywright E2Eテスト用のAPIモックハンドラーを定義します。
 * 実際のSupabaseデータベースに接続せずにAPIレスポンスをシミュレートします。
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// ===========================
// Health Check API
// ===========================
const healthHandler = http.get(`${BASE_URL}/api/health`, () => {
  return HttpResponse.json({
    status: 'ok',
    message: 'Database connection successful',
    timestamp: new Date().toISOString(),
  });
});

// ===========================
// Menus API
// ===========================
const menusHandler = http.get(`${BASE_URL}/api/menus`, () => {
  return HttpResponse.json({
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
  });
});

// ===========================
// Staff API
// ===========================
const staffHandler = http.get(`${BASE_URL}/api/staff`, () => {
  return HttpResponse.json({
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
  });
});

// ===========================
// Admin Stats API
// ===========================
const adminStatsHandler = http.get(`${BASE_URL}/api/admin/stats`, () => {
  const today = new Date();
  const weeklyStats = [];

  // 過去7日間の統計を生成
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    weeklyStats.push({
      date: date.toISOString().split('T')[0],
      day: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
      count: Math.floor(Math.random() * 10) + 5, // 5-14件のランダムな予約数
    });
  }

  return HttpResponse.json({
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
  });
});

// ===========================
// Auth - Register API
// ===========================
const registerHandler = http.post(`${BASE_URL}/api/auth/register`, async ({ request }) => {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    passwordConfirm?: string;
  };

  // バリデーションエラーのシミュレーション
  if (!body.email || !body.password || !body.name) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'email',
              message: 'Email is required',
            },
          ],
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // パスワードの強度チェック
  if (body.password && body.password.length < 8) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 成功レスポンス
  return HttpResponse.json(
    {
      success: true,
      data: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440201',
          email: body.email,
          name: body.name,
          phone: body.phone || null,
          createdAt: new Date().toISOString(),
        },
        message: 'Registration successful. Please check your email to verify your account.',
        requiresEmailVerification: true,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
});

// ===========================
// Auth - Login API
// ===========================
const loginHandler = http.post(`${BASE_URL}/api/auth/login`, async ({ request }) => {
  const body = (await request.json()) as { email?: string; password?: string };

  // バリデーションエラー
  if (!body.email || !body.password) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 認証失敗のシミュレーション（テスト用の特定メールアドレス）
  if (body.email === 'invalid@example.com' || body.password === 'wrongpassword') {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  // 成功レスポンス
  return HttpResponse.json(
    {
      success: true,
      data: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440201',
          email: body.email,
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
    },
    { status: 200 }
  );
});

// ===========================
// Reservations API
// ===========================
const reservationsHandler = http.get(`${BASE_URL}/api/reservations`, ({ request }) => {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  return HttpResponse.json({
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
  });
});

const createReservationHandler = http.post(`${BASE_URL}/api/reservations`, async ({ request }) => {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }

  const body = (await request.json()) as {
    menuId?: string;
    staffId?: string;
    reservedDate?: string;
    reservedTime?: string;
    notes?: string;
  };

  // UUID検証
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (body.menuId && !uuidRegex.test(body.menuId)) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid menu ID format',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 過去日付チェック
  if (body.reservedDate) {
    const reservedDate = new Date(body.reservedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservedDate < today) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot book past dates',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  }

  // 成功レスポンス
  return HttpResponse.json(
    {
      success: true,
      data: {
        id: '550e8400-e29b-41d4-a716-446655440302',
        userId,
        ...body,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
});

// ===========================
// Available Slots API
// ===========================
const availableSlotsHandler = http.get(`${BASE_URL}/api/available-slots`, ({ request }) => {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const menuId = url.searchParams.get('menuId');

  // パラメータ検証
  if (!date || !menuId) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date and menuId are required',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 日付形式検証
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid date format. Expected YYYY-MM-DD',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // UUID検証
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(menuId)) {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid UUID format for menuId',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // 成功レスポンス
  return HttpResponse.json({
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
  });
});

// ===========================
// Admin Analytics API
// ===========================
const adminAnalyticsHandler = http.get(`${BASE_URL}/api/admin/analytics`, () => {
  const today = new Date();

  // 日別データ（過去30日分）
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyData.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 10) + 3,
    });
  }

  // 週別データ（過去8週間分）
  const weeklyData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeklyData.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      count: Math.floor(Math.random() * 30) + 20,
    });
  }

  // 月別データ（過去12ヶ月分）
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthlyData.push({
      month: `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      count: Math.floor(Math.random() * 100) + 80,
    });
  }

  // 月別リピート率推移（過去6ヶ月）
  const monthlyRepeatTrends = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthlyRepeatTrends.push({
      month: `${monthDate.getFullYear()}/${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      rate: Math.floor(Math.random() * 20) + 50, // 50-70%
    });
  }

  return HttpResponse.json({
    success: true,
    data: {
      reservationTrends: {
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
      },
      repeatRate: {
        overall: 65,
        newCustomers: 45,
        repeatCustomers: 83,
        monthlyTrends: monthlyRepeatTrends,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ===========================
// Export all handlers
// ===========================
export const handlers = [
  healthHandler,
  menusHandler,
  staffHandler,
  adminStatsHandler,
  adminAnalyticsHandler,
  registerHandler,
  loginHandler,
  reservationsHandler,
  createReservationHandler,
  availableSlotsHandler,
];
