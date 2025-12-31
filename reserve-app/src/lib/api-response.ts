import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Create a successful API response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  // Zod validation error
  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }))
    );
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown };

    if (prismaError.code === 'P2002') {
      return errorResponse('Record already exists', 409, 'DUPLICATE_RECORD');
    }

    if (prismaError.code === 'P2025') {
      return errorResponse('Record not found', 404, 'NOT_FOUND');
    }
  }

  // Generic error
  if (error instanceof Error) {
    return errorResponse(error.message, 500, 'INTERNAL_ERROR');
  }

  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>> | NextResponse<ApiResponse>> {
  return handler().catch(handleApiError);
}
