import { z } from 'zod';

/**
 * Date format validation (YYYY-MM-DD)
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Time format validation (HH:mm)
 */
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Query parameters for available slots endpoint
 */
export const availableSlotsQuerySchema = z.object({
  date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  menuId: z.string().uuid('Invalid menu ID'),
  staffId: z.string().uuid('Invalid staff ID').nullable().optional(),
});

type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;

/**
 * Request body for creating a reservation
 */
export const createReservationSchema = z.object({
  menuId: z.string().uuid('Invalid menu ID'),
  staffId: z.string().uuid('Invalid staff ID').nullable().optional(), // 指名なし可
  reservedDate: z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Reservation date must be today or in the future'),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  notes: z.string().max(500, '備考は500文字以内で入力してください').optional(),
  guestCount: z
    .number()
    .int('予約人数は整数で入力してください')
    .min(1, '予約人数は1名以上で入力してください')
    .max(10, '予約人数は10名以下で入力してください')
    .optional()
    .default(1),
});

type CreateReservationInput = z.infer<typeof createReservationSchema>;

/**
 * Request body for updating a reservation
 */
export const updateReservationSchema = z.object({
  menuId: z.string().uuid('Invalid menu ID').optional(),
  staffId: z.string().uuid('Invalid staff ID').optional(),
  reservedDate: z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      if (!date) {return true;} // Skip validation if not provided
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Reservation date must be today or in the future')
    .optional(),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

/**
 * 認証関連のバリデーション
 */

/**
 * 日本の電話番号形式のバリデーション
 * 対応形式: 090-1234-5678, 09012345678, 03-1234-5678 など
 */
const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/;

/**
 * ユーザー登録フォーム
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, '名前を入力してください')
      .max(100, '名前は100文字以内で入力してください'),
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    phone: z
      .string()
      .regex(phoneRegex, '有効な電話番号を入力してください（例: 090-1234-5678）')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(72, 'パスワードは72文字以内で入力してください')
      .regex(/[a-z]/, 'パスワードには少なくとも1つの小文字英字を含めてください')
      .regex(/[A-Z]/, 'パスワードには少なくとも1つの大文字英字を含めてください')
      .regex(/[0-9]/, 'パスワードには少なくとも1つの数字を含めてください')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'パスワードには少なくとも1つの記号（!@#$%^&*など）を含めてください'
      ),
    passwordConfirm: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: '利用規約に同意してください',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'パスワードが一致しません',
    path: ['passwordConfirm'],
  });

type RegisterInput = z.infer<typeof registerSchema>;

/**
 * ログインフォーム
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  remember: z.boolean().optional(),
});

type LoginInput = z.infer<typeof loginSchema>;

/**
 * Request body for cancelling a reservation
 */
export const cancelReservationSchema = z.object({
  cancellationReason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

/**
 * 管理者用の予約作成スキーマ
 */
export const adminCreateReservationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  menuId: z.string().uuid('Invalid menu ID'),
  staffId: z.string().uuid('Invalid staff ID'),
  reservedDate: z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

type AdminCreateReservationInput = z.infer<typeof adminCreateReservationSchema>;

/**
 * 管理者用の予約更新スキーマ
 */
export const adminUpdateReservationSchema = z.object({
  menuId: z.string().uuid('Invalid menu ID').optional(),
  staffId: z.string().uuid('Invalid staff ID').optional(),
  reservedDate: z
    .string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .optional(),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

type AdminUpdateReservationInput = z.infer<typeof adminUpdateReservationSchema>;

/**
 * 管理者用の予約一覧取得クエリパラメータ
 */
export const adminReservationsQuerySchema = z.object({
  status: z.enum(['all', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  dateRange: z.enum(['all', 'this-week', 'this-month']).optional(),
  search: z.string().optional(),
  tenantId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

type AdminReservationsQuery = z.infer<typeof adminReservationsQuerySchema>;

/**
 * メニュー作成スキーマ（管理者用）
 */
const createMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'メニュー名を入力してください')
    .max(100, 'メニュー名は100文字以内で入力してください'),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  price: z
    .number()
    .int('価格は整数で入力してください')
    .min(0, '価格は0以上の整数で入力してください')
    .max(9999999, '価格は9999999円以下で入力してください'),
  duration: z
    .number()
    .int('所要時間は整数で入力してください')
    .min(1, '所要時間は1分以上で入力してください')
    .max(480, '所要時間は480分以内で入力してください'),
  category: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

type CreateMenuInput = z.infer<typeof createMenuSchema>;

/**
 * メニュー更新スキーマ（管理者用）
 */
const updateMenuSchema = z.object({
  name: z
    .string()
    .min(1, 'メニュー名を入力してください')
    .max(100, 'メニュー名は100文字以内で入力してください')
    .optional(),
  description: z
    .string()
    .max(500, '説明は500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  price: z
    .number()
    .int('価格は整数で入力してください')
    .min(0, '価格は0以上の整数で入力してください')
    .max(9999999, '価格は9999999円以下で入力してください')
    .optional(),
  duration: z
    .number()
    .int('所要時間は整数で入力してください')
    .min(1, '所要時間は1分以上で入力してください')
    .max(480, '所要時間は480分以内で入力してください')
    .optional(),
  category: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type UpdateMenuInput = z.infer<typeof updateMenuSchema>;

/**
 * 予約ステータス遷移のバリデーション
 *
 * 許可される遷移:
 * - PENDING → CONFIRMED
 * - CONFIRMED → COMPLETED
 * - CONFIRMED → CANCELLED
 * - CONFIRMED → NO_SHOW
 *
 * 禁止される遷移（全て）:
 * - COMPLETED → *（COMPLETEDからの遷移は全て禁止）
 * - CANCELLED → *（CANCELLEDからの遷移は全て禁止）
 * - NO_SHOW → *（NO_SHOWからの遷移は全て禁止）
 */
export function validateStatusTransition(
  currentStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
  newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
): { valid: boolean; error?: string } {
  // 同じステータスへの遷移は許可
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // COMPLETED からの遷移は全て禁止
  if (currentStatus === 'COMPLETED') {
    if (newStatus === 'PENDING') {
      return { valid: false, error: '完了済みの予約は保留状態に戻せません' };
    } else if (newStatus === 'CONFIRMED') {
      return { valid: false, error: '完了済みの予約は確定状態に戻せません' };
    } else if (newStatus === 'CANCELLED') {
      return { valid: false, error: '完了済みの予約はキャンセルできません' };
    }
    return { valid: false, error: '完了済みの予約のステータスは変更できません' };
  }

  // CANCELLED からの遷移は全て禁止
  if (currentStatus === 'CANCELLED') {
    if (newStatus === 'PENDING') {
      return { valid: false, error: 'キャンセル済みの予約は保留状態に戻せません' };
    } else if (newStatus === 'CONFIRMED') {
      return { valid: false, error: 'キャンセル済みの予約は確定状態に戻せません' };
    } else if (newStatus === 'COMPLETED') {
      return { valid: false, error: 'キャンセル済みの予約は完了状態にできません' };
    }
    return { valid: false, error: 'キャンセル済みの予約のステータスは変更できません' };
  }

  // NO_SHOW からの遷移は全て禁止
  if (currentStatus === 'NO_SHOW') {
    if (newStatus === 'PENDING') {
      return { valid: false, error: '無断キャンセルの予約は保留状態に戻せません' };
    } else if (newStatus === 'CONFIRMED') {
      return { valid: false, error: '無断キャンセルの予約は確定状態に戻せません' };
    } else if (newStatus === 'COMPLETED') {
      return { valid: false, error: '無断キャンセルの予約は完了状態にできません' };
    }
    return { valid: false, error: '無断キャンセルの予約のステータスは変更できません' };
  }

  // PENDING からの遷移は CONFIRMED のみ許可
  if (currentStatus === 'PENDING') {
    if (newStatus === 'CONFIRMED') {
      return { valid: true };
    }
    return { valid: false, error: '不正な状態遷移です' };
  }

  // CONFIRMED からの遷移は COMPLETED, CANCELLED, NO_SHOW のみ許可
  if (currentStatus === 'CONFIRMED') {
    if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED' || newStatus === 'NO_SHOW') {
      return { valid: true };
    }
    return { valid: false, error: '不正な状態遷移です' };
  }

  return { valid: false, error: '不正な状態遷移です' };
}

/**
 * ステータスに応じた編集可否チェック
 */
export function canEditReservation(
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
): { canEdit: boolean; error?: string } {
  if (status === 'COMPLETED') {
    return { canEdit: false, error: '完了済みの予約は編集できません' };
  } else if (status === 'CANCELLED') {
    return { canEdit: false, error: 'キャンセル済みの予約は編集できません' };
  } else if (status === 'NO_SHOW') {
    return { canEdit: false, error: '無断キャンセルの予約は編集できません' };
  }
  return { canEdit: true };
}

/**
 * ステータスに応じた削除可否チェック
 */
export function canDeleteReservation(
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
): { canDelete: boolean; error?: string } {
  if (status === 'COMPLETED') {
    return { canDelete: false, error: '完了済みの予約は削除できません' };
  }
  return { canDelete: true };
}
