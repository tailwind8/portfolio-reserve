import type { NextRequest } from 'next/server';
import { supabase } from './supabase';
import { prisma } from './prisma';
import { errorResponse } from './api-response';

type AdminRole = 'ADMIN' | 'SUPER_ADMIN';

export interface AdminAuthContext {
  userId: string;
  authId: string;
  role: AdminRole;
  tenantId: string;
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === 'ADMIN' || value === 'SUPER_ADMIN';
}

function isTestBypassEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.SKIP_AUTH_IN_TEST === 'true';
}

function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) {return null;}
  if (!authorization.startsWith('Bearer ')) {return null;}
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

/**
 * 管理者APIの認可（本番: Bearerトークン+DBロール、E2E: SKIP_AUTH_IN_TEST=true のみ簡易バイパス）
 */
export async function requireAdminApiAuth(
  request: NextRequest
): Promise<AdminAuthContext | ReturnType<typeof errorResponse>> {
  // E2E/開発時のみのバイパス（本番は不可）
  if (isTestBypassEnabled()) {
    const userId = request.headers.get('x-user-id') || 'test-admin-user';
    const roleHeader = request.headers.get('x-user-role') || 'ADMIN';
    if (roleHeader !== 'admin' && roleHeader !== 'ADMIN') {
      return errorResponse('管理者権限が必要です', 403, 'FORBIDDEN');
    }

    return {
      userId,
      authId: 'test-auth-id',
      role: 'ADMIN',
      tenantId: getTenantId(),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return errorResponse('認証が必要です', 401, 'UNAUTHORIZED');
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return errorResponse('認証が必要です', 401, 'UNAUTHORIZED');
  }

  const tenantId = getTenantId();
  const dbUser = await prisma.bookingUser.findFirst({
    where: { tenantId, authId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || !isAdminRole(dbUser.role)) {
    return errorResponse('管理者権限が必要です', 403, 'FORBIDDEN');
  }

  return {
    userId: dbUser.id,
    authId: user.id,
    role: dbUser.role,
    tenantId,
  };
}

