import { test, expect } from '@playwright/test';
import { setupMSW } from './msw-setup';

test.describe('API Endpoints', () => {
  test.beforeEach(async ({ page }) => {
    await setupMSW(page);
    // Navigate to a page to establish context for fetch requests
    await page.goto('/');
  });

  test.describe('GET /api/health', () => {
    test('should return health check status', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/health');
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(200);
      expect(data.data.status).toBe('ok');
      expect(data.data.timestamp).toBeDefined();
    });
  });

  test.describe('GET /api/menus', () => {
    test('should return list of menus', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/menus');
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(Array.isArray(data.data.data)).toBe(true);
      expect(data.data.timestamp).toBeDefined();
    });

    test('should return menus with correct structure', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/menus');
        return response.json();
      });

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
    test('should return list of staff', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/staff');
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(Array.isArray(data.data.data)).toBe(true);
      expect(data.data.timestamp).toBeDefined();
    });

    test('should return staff with correct structure', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/staff');
        return response.json();
      });

      if (data.data.length > 0) {
        const staff = data.data[0];
        expect(staff).toHaveProperty('id');
        expect(staff).toHaveProperty('name');
        expect(staff).toHaveProperty('isActive');
      }
    });
  });

  test.describe('GET /api/available-slots', () => {
    test('should return 400 without required parameters', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/available-slots');
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(400);
      expect(data.data.success).toBe(false);
      expect(data.data.error?.code).toBe('VALIDATION_ERROR');
    });

    test('should return 400 with invalid date format', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch(
          '/api/available-slots?date=2025/01/20&menuId=123e4567-e89b-12d3-a456-426614174000'
        );
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(400);
      expect(data.data.success).toBe(false);
    });

    test('should return 400 with invalid UUID', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch(
          '/api/available-slots?date=2025-01-20&menuId=invalid-uuid'
        );
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(400);
      expect(data.data.success).toBe(false);
    });

    test('should return available slots with valid parameters', async ({ page }) => {
      const menuId = '550e8400-e29b-41d4-a716-446655440001'; // Mock menu ID
      const data = await page.evaluate(async (menuId: string) => {
        const response = await fetch(
          `/api/available-slots?date=2025-12-31&menuId=${menuId}`
        );
        return {
          status: response.status,
          data: await response.json()
        };
      }, menuId);

      expect(data.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(data.data.data).toHaveProperty('date');
      expect(data.data.data).toHaveProperty('slots');
      expect(Array.isArray(data.data.data.slots)).toBe(true);
    });
  });

  test.describe('POST /api/reservations', () => {
    test('should return 401 without authentication', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            menuId: '123e4567-e89b-12d3-a456-426614174000',
            staffId: '123e4567-e89b-12d3-a456-426614174001',
            reservedDate: '2025-12-31',
            reservedTime: '14:00',
          }),
        });
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(401);
      expect(data.data.success).toBe(false);
      expect(data.data.error?.code).toBe('UNAUTHORIZED');
    });

    test('should return 400 with invalid request body', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
          },
          body: JSON.stringify({
            menuId: 'invalid-uuid',
            staffId: '123e4567-e89b-12d3-a456-426614174001',
            reservedDate: '2025-12-31',
            reservedTime: '14:00',
          }),
        });
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(400);
      expect(data.data.success).toBe(false);
    });

    test('should return 400 with past date', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '123e4567-e89b-12d3-a456-426614174002',
          },
          body: JSON.stringify({
            menuId: '123e4567-e89b-12d3-a456-426614174000',
            staffId: '123e4567-e89b-12d3-a456-426614174001',
            reservedDate: '2020-01-01',
            reservedTime: '14:00',
          }),
        });
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(400);
      expect(data.data.success).toBe(false);
    });

    test('should create reservation with valid data', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': '550e8400-e29b-41d4-a716-446655440201',
          },
          body: JSON.stringify({
            menuId: '550e8400-e29b-41d4-a716-446655440001',
            staffId: '550e8400-e29b-41d4-a716-446655440011',
            reservedDate: '2025-12-31',
            reservedTime: '14:00',
            notes: 'Test reservation',
          }),
        });
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(201);
      expect(data.data.success).toBe(true);
      expect(data.data.data).toHaveProperty('id');
      expect(data.data.data.status).toBe('PENDING');
    });
  });

  test.describe('GET /api/reservations', () => {
    test('should return 401 without authentication', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations');
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(401);
      expect(data.data.success).toBe(false);
      expect(data.data.error?.code).toBe('UNAUTHORIZED');
    });

    test('should return user reservations with authentication', async ({ page }) => {
      const data = await page.evaluate(async () => {
        const response = await fetch('/api/reservations', {
          headers: {
            'x-user-id': '550e8400-e29b-41d4-a716-446655440201',
          },
        });
        return {
          status: response.status,
          data: await response.json()
        };
      });

      expect(data.status).toBe(200);
      expect(data.data.success).toBe(true);
      expect(Array.isArray(data.data.data)).toBe(true);
    });
  });
});
