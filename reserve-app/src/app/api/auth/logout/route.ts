import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkRateLimit, logoutRateLimit } from '@/lib/rate-limit';
import { logSecurityEvent, getClientIp, getUserAgent } from '@/lib/security-logger';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
export async function POST(request: NextRequest) {
  // レート制限チェック
  const rateLimitResponse = await checkRateLimit(request, logoutRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // クライアント情報を取得
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);

  try {
    // 現在のユーザー情報を取得（ログアウト前に）
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let userId: string | undefined;

    if (authUser) {
      const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
      const user = await prisma.bookingUser.findFirst({
        where: {
          tenantId,
          authId: authUser.id,
        },
        select: {
          id: true,
        },
      });
      userId = user?.id;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
      return errorResponse('Failed to logout', 500);
    }

    // ログアウトをログに記録
    await logSecurityEvent({
      eventType: 'LOGOUT',
      userId,
      ipAddress,
      userAgent,
    });

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
