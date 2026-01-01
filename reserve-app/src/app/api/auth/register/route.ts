import { NextRequest } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { checkRateLimit, registerRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/auth/register
 * Register a new user with Supabase Auth and create user profile in database
 */
export async function POST(request: NextRequest) {
  // レート制限チェック
  const rateLimitResponse = await checkRateLimit(request, registerRateLimit);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', validationResult.error.issues);
    }

    const { name, email, phone, password } = validationResult.data;

    // Get tenant ID from environment
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // Check if user already exists in database
    const existingUser = await prisma.bookingUser.findFirst({
      where: {
        tenantId,
        email,
      },
    });

    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
      },
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return errorResponse(
        authError.message || 'Failed to create authentication account',
        400
      );
    }

    if (!authData.user) {
      return errorResponse('Failed to create user', 500);
    }

    // Create user profile in database
    try {
      const user = await prisma.bookingUser.create({
        data: {
          tenantId,
          authId: authData.user.id,
          email,
          name,
          phone: phone || null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });

      return successResponse(
        {
          user,
          message: 'Registration successful. Please check your email to verify your account.',
          requiresEmailVerification: !authData.session, // If no session, email verification is required
        },
        201
      );
    } catch (dbError) {
      // If database creation fails, we should ideally delete the Supabase Auth user
      // but for now we'll just log the error and return a message
      console.error('Database error:', dbError);

      // Clean up: Try to delete the auth user if profile creation fails
      try {
        const adminClient = getSupabaseAdmin();
        await adminClient.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

      return errorResponse(
        'Failed to create user profile. Please try again.',
        500
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal server error', 500);
  }
}
