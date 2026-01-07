/**
 * 予約処理ヘルパー関数
 *
 * POST /api/reservations の複雑な処理を分離し、再利用可能にする
 */

import { prisma } from '@/lib/prisma';
import { minutesSinceStartOfDay, hasTimeOverlap } from '@/lib/time-utils';
import type { PrismaClient } from '@prisma/client';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

/**
 * スタッフ検索結果の型
 *
 * @property found - スタッフが見つかったかどうか
 * @property staffId - 見つかった場合のスタッフID
 * @property reason - 見つからなかった場合の理由
 */
export type FindAvailableStaffResult =
  | { found: true; staffId: string }
  | { found: false; reason: 'NO_ACTIVE_STAFF' | 'NO_AVAILABLE_STAFF' };

/**
 * 利用可能なスタッフを自動割り当て
 *
 * @param reservedDate - 予約日
 * @param reservedTime - 予約時刻（HH:MM形式）
 * @param menuDuration - メニュー所要時間（分）
 * @returns 検索結果（スタッフID または 見つからなかった理由）
 *
 * @example
 * const result = await findAvailableStaff('2025-01-20', '14:00', 60);
 * if (!result.found) {
 *   if (result.reason === 'NO_ACTIVE_STAFF') {
 *     // システム設定の問題（スタッフが登録されていない）
 *     return errorResponse('...', 404, 'NO_STAFF_AVAILABLE');
 *   } else {
 *     // 時間帯の問題（全スタッフが予約済み）
 *     return errorResponse('...', 409, 'NO_STAFF_AVAILABLE_FOR_TIME');
 *   }
 * }
 * const staffId = result.staffId;
 */
export async function findAvailableStaff(
  reservedDate: string,
  reservedTime: string,
  menuDuration: number
): Promise<FindAvailableStaffResult> {
  // 利用可能なスタッフを検索
  const availableStaff = await prisma.bookingStaff.findMany({
    where: {
      tenantId: TENANT_ID,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (availableStaff.length === 0) {
    return { found: false, reason: 'NO_ACTIVE_STAFF' };
  }

  // 予約時間帯を計算
  const reservedStartMinutes = minutesSinceStartOfDay(reservedTime);
  const reservedEndMinutes = reservedStartMinutes + menuDuration;

  // 【パフォーマンス改善】全スタッフの予約を1回のクエリでバッチ取得（N+1クエリ解消）
  const staffIds = availableStaff.map((s) => s.id);
  const allReservations = await prisma.bookingReservation.findMany({
    where: {
      tenantId: TENANT_ID,
      staffId: { in: staffIds },
      reservedDate: new Date(reservedDate),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      menu: { select: { duration: true } },
    },
  });

  // スタッフIDごとに予約をグループ化（O(n)で処理）
  const reservationsByStaff = new Map<string, typeof allReservations>();
  for (const staffId of staffIds) {
    reservationsByStaff.set(staffId, []);
  }
  for (const reservation of allReservations) {
    if (reservation.staffId) {
      reservationsByStaff.get(reservation.staffId)?.push(reservation);
    }
  }

  // 各スタッフの予約状況を確認し、空いているスタッフを見つける
  for (const staff of availableStaff) {
    const staffReservations = reservationsByStaff.get(staff.id) || [];

    // 時間重複チェック
    let isAvailable = true;
    for (const res of staffReservations) {
      const resStartMinutes = minutesSinceStartOfDay(res.reservedTime);
      const resEndMinutes = resStartMinutes + res.menu.duration;

      // 時間が重複している場合
      if (hasTimeOverlap(reservedStartMinutes, reservedEndMinutes, resStartMinutes, resEndMinutes)) {
        isAvailable = false;
        break;
      }
    }

    // 空いているスタッフが見つかった
    if (isAvailable) {
      return { found: true, staffId: staff.id };
    }
  }

  // スタッフは存在するが、指定時間帯は全員予約済み
  return { found: false, reason: 'NO_AVAILABLE_STAFF' };
}

/**
 * ユーザーの予約時間重複チェック
 *
 * トランザクション内で使用する。
 * 同じユーザーが同じ時間帯に既に予約している場合はエラーをスロー。
 *
 * @param tx - Prismaトランザクションクライアント
 * @param userId - ユーザーID
 * @param reservedDate - 予約日
 * @param reservedTime - 予約時刻（HH:MM形式）
 * @param menuDuration - メニュー所要時間（分）
 * @throws {Error} 既にこの時間帯に予約がある場合
 *
 * @example
 * await prisma.$transaction(async (tx) => {
 *   await checkUserReservationConflicts(tx, userId, '2025-01-20', '14:00', 60);
 *   // 予約作成処理...
 * });
 */
export async function checkUserReservationConflicts(
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  userId: string,
  reservedDate: string,
  reservedTime: string,
  menuDuration: number
): Promise<void> {
  // ユーザー自身の既存予約を取得
  const userReservations = await tx.bookingReservation.findMany({
    where: {
      tenantId: TENANT_ID,
      userId,
      reservedDate: new Date(reservedDate),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      menu: { select: { duration: true } },
    },
  });

  const newStartMinutes = minutesSinceStartOfDay(reservedTime);
  const newEndMinutes = newStartMinutes + menuDuration;

  // 時間重複チェック
  for (const userRes of userReservations) {
    const resStartMinutes = minutesSinceStartOfDay(userRes.reservedTime);
    const resEndMinutes = resStartMinutes + userRes.menu.duration;

    if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
      throw new Error('既にこの時間帯に予約があります');
    }
  }
}

/**
 * スタッフの予約時間重複チェック
 *
 * トランザクション内で使用する。
 * 指定されたスタッフが同じ時間帯に既に予約を受けている場合はエラーをスロー。
 *
 * @param tx - Prismaトランザクションクライアント
 * @param staffId - スタッフID
 * @param reservedDate - 予約日
 * @param reservedTime - 予約時刻（HH:MM形式）
 * @param menuDuration - メニュー所要時間（分）
 * @throws {Error} スタッフが指定時間帯に対応できない場合
 *
 * @example
 * await prisma.$transaction(async (tx) => {
 *   await checkStaffReservationConflicts(tx, staffId, '2025-01-20', '14:00', 60);
 *   // 予約作成処理...
 * });
 */
export async function checkStaffReservationConflicts(
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  staffId: string,
  reservedDate: string,
  reservedTime: string,
  menuDuration: number
): Promise<void> {
  // スタッフの既存予約を取得
  const staffReservations = await tx.bookingReservation.findMany({
    where: {
      tenantId: TENANT_ID,
      staffId,
      reservedDate: new Date(reservedDate),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      menu: { select: { duration: true } },
    },
  });

  const newStartMinutes = minutesSinceStartOfDay(reservedTime);
  const newEndMinutes = newStartMinutes + menuDuration;

  // 時間重複チェック
  for (const staffRes of staffReservations) {
    const resStartMinutes = minutesSinceStartOfDay(staffRes.reservedTime);
    const resEndMinutes = resStartMinutes + staffRes.menu.duration;

    if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
      throw new Error('選択されたスタッフは指定時間帯に対応できません');
    }
  }
}

/**
 * 全体の予約時間重複チェック（スタッフ指定なしの場合）
 *
 * トランザクション内で使用する。
 * スタッフ指定なしの予約で、同じ時間帯に既に予約がある場合はエラーをスロー。
 *
 * @param tx - Prismaトランザクションクライアント
 * @param reservedDate - 予約日
 * @param reservedTime - 予約時刻（HH:MM形式）
 * @param menuDuration - メニュー所要時間（分）
 * @throws {Error} この時間は既に予約済みの場合
 *
 * @example
 * await prisma.$transaction(async (tx) => {
 *   await checkGeneralReservationConflicts(tx, '2025-01-20', '14:00', 60);
 *   // 予約作成処理...
 * });
 */
export async function checkGeneralReservationConflicts(
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  reservedDate: string,
  reservedTime: string,
  menuDuration: number
): Promise<void> {
  // スタッフ指定なしの既存予約を取得
  const allReservations = await tx.bookingReservation.findMany({
    where: {
      tenantId: TENANT_ID,
      staffId: null,
      reservedDate: new Date(reservedDate),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      menu: { select: { duration: true } },
    },
  });

  const newStartMinutes = minutesSinceStartOfDay(reservedTime);
  const newEndMinutes = newStartMinutes + menuDuration;

  // 時間重複チェック
  for (const res of allReservations) {
    const resStartMinutes = minutesSinceStartOfDay(res.reservedTime);
    const resEndMinutes = resStartMinutes + res.menu.duration;

    if (hasTimeOverlap(newStartMinutes, newEndMinutes, resStartMinutes, resEndMinutes)) {
      throw new Error('この時間は既に予約済みです');
    }
  }
}

/**
 * 予約データの整形済みレスポンス型（管理者用）
 */
export interface FormattedReservation {
  id: string;
  reservedDate: string;
  reservedTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  menuName: string;
  menuPrice: number;
  menuDuration?: number;
  staffName: string;
  staffRole?: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  message?: string;
}

/**
 * 予約データを整形してレスポンス用に変換（管理者用）
 */
export function formatReservationForAdmin(
  reservation: {
    id: string;
    reservedDate: Date;
    reservedTime: string;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: { name: string | null; email: string; phone: string | null } | null;
    menu?: { name: string; price: number; duration: number } | null;
    staff?: { name: string; role: string | null } | null;
  },
  message?: string
): FormattedReservation {
  return {
    id: reservation.id,
    reservedDate: reservation.reservedDate.toISOString().split('T')[0],
    reservedTime: reservation.reservedTime,
    customerName: reservation.user?.name || '名前未設定',
    customerEmail: reservation.user?.email || '',
    customerPhone: reservation.user?.phone || '',
    menuName: reservation.menu?.name || 'メニュー未設定',
    menuPrice: reservation.menu?.price || 0,
    menuDuration: reservation.menu?.duration,
    staffName: reservation.staff?.name || 'スタッフ未設定',
    staffRole: reservation.staff?.role || undefined,
    status: reservation.status,
    notes: reservation.notes || '',
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
    ...(message && { message }),
  };
}

/**
 * ステータスに応じた成功メッセージを取得（管理者用）
 */
export function getStatusChangeMessage(status: string | undefined): string {
  if (!status) {return '予約を更新しました';}

  const messages: Record<string, string> = {
    CONFIRMED: '予約を確定しました',
    COMPLETED: '予約を完了しました',
    CANCELLED: '予約をキャンセルしました',
    NO_SHOW: '無断キャンセルとして記録しました',
  };

  return messages[status] || '予約を更新しました';
}

/**
 * Prismaの予約データ取得用のincludeオブジェクト（管理者用詳細）
 */
export const reservationIncludeForAdmin = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  menu: {
    select: {
      id: true,
      name: true,
      price: true,
      duration: true,
    },
  },
  staff: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

/**
 * 更新データの構築（undefined以外の値のみを含める）
 */
export function buildReservationUpdateData(params: {
  menuId?: string;
  staffId?: string;
  reservedDate?: string;
  reservedTime?: string;
  notes?: string;
  status?: string;
}): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};

  if (params.menuId !== undefined) {updateData.menuId = params.menuId;}
  if (params.staffId !== undefined) {updateData.staffId = params.staffId;}
  if (params.reservedDate !== undefined) {updateData.reservedDate = new Date(params.reservedDate);}
  if (params.reservedTime !== undefined) {updateData.reservedTime = params.reservedTime;}
  if (params.notes !== undefined) {updateData.notes = params.notes;}
  if (params.status !== undefined) {updateData.status = params.status;}

  return updateData;
}
