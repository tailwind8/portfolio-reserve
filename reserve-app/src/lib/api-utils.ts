import { NextResponse } from 'next/server';
import type { ZodIssue } from 'zod';
import { errorResponse } from './api-response';

/**
 * テナントIDを取得
 * マルチテナント対応のための共通関数
 */
export function getTenantId(): string {
  return process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';
}

/**
 * テナントIDフィルタを含むwhere条件を作成
 */
function withTenantId<T extends object>(where: T): T & { tenantId: string } {
  return {
    ...where,
    tenantId: getTenantId(),
  };
}

/**
 * バリデーションエラーレスポンスを作成
 */
export function validationErrorResponse(issues: ZodIssue[]): NextResponse {
  return errorResponse('バリデーションエラー', 400, 'VALIDATION_ERROR', issues);
}

/**
 * リソースが見つからない場合のエラーレスポンス
 */
export function notFoundResponse(resourceName: string): NextResponse {
  return errorResponse(`${resourceName}が見つかりません`, 404, 'NOT_FOUND');
}

/**
 * 削除不可エラーレスポンス（関連レコードが存在する場合）
 */
function cannotDeleteResponse(reason: string): NextResponse {
  return errorResponse(reason, 400, 'CANNOT_DELETE');
}
