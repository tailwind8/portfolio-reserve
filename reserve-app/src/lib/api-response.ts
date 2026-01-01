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

  // Custom error with statusCode
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'message' in error &&
    'code' in error
  ) {
    const customError = error as { statusCode: number; message: string; code: string };
    return errorResponse(customError.message, customError.statusCode, customError.code);
  }

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

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return errorResponse('Record already exists', 409, 'DUPLICATE_RECORD');
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return errorResponse('Record not found', 404, 'NOT_FOUND');
    }

    // Foreign key constraint failed
    if (prismaError.code === 'P2003') {
      return errorResponse('Related record not found', 400, 'FOREIGN_KEY_CONSTRAINT');
    }

    // Database connection error
    if (prismaError.code === 'P1001' || prismaError.code === 'P1002') {
      return errorResponse(
        'データベース接続に失敗しました。時間をおいて再度お試しください。',
        503,
        'DATABASE_CONNECTION_ERROR'
      );
    }

    // Query timeout
    if (prismaError.code === 'P2024') {
      return errorResponse(
        'リクエストの処理に時間がかかっています。しばらくお待ちください。',
        504,
        'DATABASE_TIMEOUT'
      );
    }
  }

  // Network/Timeout errors
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return errorResponse(
        'リクエストがタイムアウトしました。もう一度お試しください。',
        504,
        'REQUEST_TIMEOUT'
      );
    }

    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return errorResponse(
        'サーバーとの通信に失敗しました。時間をおいて再度お試しください。',
        502,
        'CONNECTION_REFUSED'
      );
    }

    // Generic error
    return errorResponse(error.message, 500, 'INTERNAL_ERROR');
  }

  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}

/**
 * エラーレスポンスの生成（HTTPステータスコード別）
 */
export function createErrorResponse(
  statusCode: number,
  message?: string,
  code?: string
): NextResponse<ApiResponse> {
  const errorMessages: Record<number, { message: string; code: string }> = {
    400: {
      message: message || 'リクエストが不正です。入力内容を確認してください。',
      code: code || 'BAD_REQUEST',
    },
    401: {
      message: message || '認証が必要です',
      code: code || 'UNAUTHORIZED',
    },
    403: {
      message: message || 'この操作を実行する権限がありません',
      code: code || 'FORBIDDEN',
    },
    404: {
      message: message || '指定されたリソースが見つかりませんでした',
      code: code || 'NOT_FOUND',
    },
    409: {
      message: message || 'リソースが競合しています',
      code: code || 'CONFLICT',
    },
    429: {
      message: message || 'リクエストが多すぎます。しばらく時間をおいて再度お試しください。',
      code: code || 'TOO_MANY_REQUESTS',
    },
    500: {
      message: message || 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。',
      code: code || 'INTERNAL_SERVER_ERROR',
    },
    502: {
      message: message || 'サーバーとの通信に失敗しました。時間をおいて再度お試しください。',
      code: code || 'BAD_GATEWAY',
    },
    503: {
      message: message || '現在メンテナンス中です。しばらくお待ちください。',
      code: code || 'SERVICE_UNAVAILABLE',
    },
    504: {
      message: message || 'リクエストの処理に時間がかかっています。しばらくお待ちください。',
      code: code || 'GATEWAY_TIMEOUT',
    },
  };

  const errorInfo = errorMessages[statusCode] || errorMessages[500];
  return errorResponse(errorInfo.message, statusCode, errorInfo.code);
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>> | NextResponse<ApiResponse>> {
  return handler().catch(handleApiError);
}
