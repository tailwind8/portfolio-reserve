import { NextRequest } from 'next/server';
import { loginSchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkRateLimit, loginRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/login
 * Authenticate user with Supabase Auth
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
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', validationResult.error.issues);
    }

    const { email, password } = validationResult.data;

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return errorResponse(
        'Invalid email or password',
        401
      );
    }

    if (!authData.user || !authData.session) {
      return errorResponse('Authentication failed', 401);
    }

    // Get tenant ID from environment
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // Fetch user profile from database
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
        createdAt: true,
      },
    });

    if (!user) {
      // User exists in Supabase but not in our database
      // This shouldn't happen, but we'll create a profile if it doesn't exist
      try {
        const newUser = await prisma.bookingUser.create({
          data: {
            tenantId,
            authId: authData.user.id,
            email: authData.user.email || email,
            name: authData.user.user_metadata?.name || null,
            phone: authData.user.user_metadata?.phone || null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        });

        return successResponse({
          user: newUser,
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at,
          },
        });
      } catch (dbError) {
        console.error('Failed to create user profile:', dbError);
        return errorResponse('Failed to create user profile', 500);
      }
    }

    return successResponse({
      user,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
