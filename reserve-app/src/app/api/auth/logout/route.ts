import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkRateLimit, logoutRateLimit } from '@/lib/rate-limit';

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

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
      return errorResponse('Failed to logout', 500);
    }

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse('Internal server error', 500);
  }
}
