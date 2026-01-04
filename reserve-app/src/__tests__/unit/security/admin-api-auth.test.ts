import { requireAdminApiAuth } from '@/lib/admin-api-auth';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    bookingUser: {
      findFirst: jest.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';

describe('requireAdminApiAuth', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_TENANT_ID = 'demo-booking';
    delete process.env.SKIP_AUTH_IN_TEST;

    (supabase.auth.getUser as jest.Mock).mockReset();
    (prisma.bookingUser.findFirst as jest.Mock).mockReset();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('productionではx-user-*ヘッダーを信用せず、Bearerが無ければ401', async () => {
    process.env.NODE_ENV = 'production';

    const req = new Request('http://localhost/api/admin/menus', {
      headers: {
        'x-user-id': 'attacker',
        'x-user-role': 'ADMIN',
      },
    }) as unknown as NextRequest;

    const result = await requireAdminApiAuth(req);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  test('productionでBearerトークンが有効かつDBロールがADMINなら通る', async () => {
    process.env.NODE_ENV = 'production';

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    (prisma.bookingUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'db-1',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost/api/admin/menus', {
      headers: {
        authorization: 'Bearer token-123',
      },
    }) as unknown as NextRequest;

    const result = await requireAdminApiAuth(req);
    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) throw new Error('unexpected Response');
    expect(result.userId).toBe('db-1');
    expect(result.authId).toBe('auth-1');
    expect(result.role).toBe('ADMIN');
  });

  test('productionでDBロールがADMIN/SUPER_ADMIN以外なら403', async () => {
    process.env.NODE_ENV = 'production';

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'auth-2' } },
      error: null,
    });
    (prisma.bookingUser.findFirst as jest.Mock).mockResolvedValue({
      id: 'db-2',
      role: 'CUSTOMER',
    });

    const req = new Request('http://localhost/api/admin/menus', {
      headers: {
        authorization: 'Bearer token-456',
      },
    }) as unknown as NextRequest;

    const result = await requireAdminApiAuth(req);
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  test('test環境でSKIP_AUTH_IN_TEST=trueならx-user-*ヘッダーでバイパスできる', async () => {
    process.env.NODE_ENV = 'test';
    process.env.SKIP_AUTH_IN_TEST = 'true';

    const req = new Request('http://localhost/api/admin/menus', {
      headers: {
        'x-user-id': 'test-admin-id',
        'x-user-role': 'ADMIN',
      },
    }) as unknown as NextRequest;

    const result = await requireAdminApiAuth(req);
    expect(result).not.toBeInstanceOf(Response);
    if (result instanceof Response) throw new Error('unexpected Response');
    expect(result.userId).toBe('test-admin-id');
    expect(result.role).toBe('ADMIN');
  });
});

