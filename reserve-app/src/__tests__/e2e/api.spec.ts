import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

test.describe('API Endpoints', () => {
  test.describe('GET /api/health', () => {
    test('should return health check status', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeDefined();
    });
  });

  test.describe('GET /api/menus', () => {
    test('should return list of menus', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/menus`);
      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    test('should return menus with correct structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/menus`);
      const data = await response.json();

      if (data.data.length > 0) {
        const menu = data.data[0];
        expect(menu).toHaveProperty('id');
        expect(menu).toHaveProperty('name');
        expect(menu).toHaveProperty('price');
        expect(menu).toHaveProperty('duration');
        expect(menu).toHaveProperty('isActive');
      }
    });
  });

  test.describe('GET /api/staff', () => {
    test('should return list of staff', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/staff`);
      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.timestamp).toBeDefined();
    });

    test('should return staff with correct structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/staff`);
      const data = await response.json();

      if (data.data.length > 0) {
        const staff = data.data[0];
        expect(staff).toHaveProperty('id');
        expect(staff).toHaveProperty('name');
        expect(staff).toHaveProperty('isActive');
      }
    });
  });

  test.describe('GET /api/available-slots', () => {
    test('should return 400 without required parameters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/available-slots`);
      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 with invalid date format', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/available-slots?date=2025/01/20&menuId=123e4567-e89b-12d3-a456-426614174000`
      );
      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
    });

    test('should return 400 with invalid UUID', async ({ request }) => {
      const response = await request.get(
        `${BASE_URL}/api/available-slots?date=2025-01-20&menuId=invalid-uuid`
      );
      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
    });

    // Note: This test requires valid menu and staff IDs from the database
    test.skip('should return available slots with valid parameters', async ({ request }) => {
      const menuId = '123e4567-e89b-12d3-a456-426614174000'; // Replace with actual ID
      const response = await request.get(
        `${BASE_URL}/api/available-slots?date=2025-12-31&menuId=${menuId}`
      );
      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('date');
      expect(data.data).toHaveProperty('slots');
      expect(Array.isArray(data.data.slots)).toBe(true);
    });
  });

  test.describe('POST /api/reservations', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/reservations`, {
        data: {
          menuId: '123e4567-e89b-12d3-a456-426614174000',
          staffId: '123e4567-e89b-12d3-a456-426614174001',
          reservedDate: '2025-12-31',
          reservedTime: '14:00',
        },
      });
      const data = await response.json();

      expect(response.status()).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('UNAUTHORIZED');
    });

    test('should return 400 with invalid request body', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/reservations`, {
        headers: {
          'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
        },
        data: {
          menuId: 'invalid-uuid',
          staffId: '123e4567-e89b-12d3-a456-426614174001',
          reservedDate: '2025-12-31',
          reservedTime: '14:00',
        },
      });
      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
    });

    test('should return 400 with past date', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/reservations`, {
        headers: {
          'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
        },
        data: {
          menuId: '123e4567-e89b-12d3-a456-426614174000',
          staffId: '123e4567-e89b-12d3-a456-426614174001',
          reservedDate: '2020-01-01',
          reservedTime: '14:00',
        },
      });
      const data = await response.json();

      expect(response.status()).toBe(400);
      expect(data.success).toBe(false);
    });

    // Note: This test requires valid IDs and database setup
    test.skip('should create reservation with valid data', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/reservations`, {
        headers: {
          'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
        },
        data: {
          menuId: '123e4567-e89b-12d3-a456-426614174000',
          staffId: '123e4567-e89b-12d3-a456-426614174001',
          reservedDate: '2025-12-31',
          reservedTime: '14:00',
          notes: 'Test reservation',
        },
      });
      const data = await response.json();

      expect(response.status()).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.status).toBe('PENDING');
    });
  });

  test.describe('GET /api/reservations', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/reservations`);
      const data = await response.json();

      expect(response.status()).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('UNAUTHORIZED');
    });

    // Note: This test requires authentication and database setup
    test.skip('should return user reservations with authentication', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/reservations`, {
        headers: {
          'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
        },
      });
      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
