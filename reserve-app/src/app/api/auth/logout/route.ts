import { supabase } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * POST /api/auth/logout
 * Sign out the current user
 */
export async function POST() {
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
