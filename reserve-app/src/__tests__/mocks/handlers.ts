import { http, HttpResponse } from 'msw';

export const handlers = [
  // 予約一覧取得のモック
  http.get('/api/reservations', () => {
    return HttpResponse.json([
      {
        id: '1',
        userId: 'user-1',
        date: '2025-01-20',
        time: '14:00',
        menuId: 'menu-1',
        menuName: 'カット',
        staffId: 'staff-1',
        staffName: '田中太郎',
        status: 'confirmed',
      },
      {
        id: '2',
        userId: 'user-1',
        date: '2025-01-25',
        time: '16:00',
        menuId: 'menu-2',
        menuName: 'カラー',
        staffId: 'staff-2',
        staffName: '佐藤花子',
        status: 'pending',
      },
    ]);
  }),

  // 予約作成のモック
  http.post('/api/reservations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '3',
        ...body,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // メニュー一覧取得のモック
  http.get('/api/menus', () => {
    return HttpResponse.json([
      {
        id: 'menu-1',
        name: 'カット',
        price: 5000,
        durationMinutes: 60,
        category: 'ヘアスタイル',
      },
      {
        id: 'menu-2',
        name: 'カラー',
        price: 8000,
        durationMinutes: 90,
        category: 'カラーリング',
      },
    ]);
  }),
];
