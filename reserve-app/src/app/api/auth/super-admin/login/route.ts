import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkRateLimit, loginRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/super-admin/login
 * Authenticate super administrator with Supabase Auth and verify SUPER_ADMIN role
 *
 * This endpoint is specifically for super administrators (developers).
 * It performs additional role verification after successful authentication.
 */
export async function POST(request: NextRequest) {
  // レート制限チェック
  const rateLimitResponse = await checkRateLimit(request, loginRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate request body
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        validationResult.error.issues
      );
    }

    const { email, password } = validationResult.data;

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return errorResponse('メールアドレスまたはパスワードが正しくありません', 401);
    }

    if (!authData.user || !authData.session) {
      return errorResponse('認証に失敗しました', 401);
    }

    // Get tenant ID from environment
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // Fetch user profile from database WITH role
    const user = await prisma.bookingUser.findFirst({
      where: {
        tenantId,
        authId: authData.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true, // IMPORTANT: Include role for verification
        createdAt: true,
      },
    });

    if (!user) {
      // User exists in Supabase but not in our database
      return errorResponse('ユーザーが見つかりません', 404);
    }

    // CRITICAL: Verify SUPER_ADMIN role
    if (user.role !== 'SUPER_ADMIN') {
      console.warn(
        `Unauthorized super admin login attempt: ${email} (role: ${user.role})`
      );
      return errorResponse('スーパー管理者権限が必要です', 403);
    }

    // Log successful super admin login for security audit
    console.log(`Super admin logged in: ${email} (${user.id})`);

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    return errorResponse('サーバーエラーが発生しました', 500);
  }
}
