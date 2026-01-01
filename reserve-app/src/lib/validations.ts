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

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;

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
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

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
      if (!date) return true; // Skip validation if not provided
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Reservation date must be today or in the future')
    .optional(),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

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
      .max(100, 'パスワードは100文字以内で入力してください')
      .regex(/[a-zA-Z]/, 'パスワードには少なくとも1つの英字を含めてください')
      .regex(/[0-9]/, 'パスワードには少なくとも1つの数字を含めてください'),
    passwordConfirm: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: '利用規約に同意してください',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'パスワードが一致しません',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

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

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Request body for cancelling a reservation
 */
export const cancelReservationSchema = z.object({
  cancellationReason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

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

export type AdminCreateReservationInput = z.infer<typeof adminCreateReservationSchema>;

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

export type AdminUpdateReservationInput = z.infer<typeof adminUpdateReservationSchema>;

/**
 * 管理者用の予約一覧取得クエリパラメータ
 */
export const adminReservationsQuerySchema = z.object({
  status: z.enum(['all', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  dateRange: z.enum(['all', 'this-week', 'this-month']).optional(),
  search: z.string().optional(),
  tenantId: z.string().optional(),
});

export type AdminReservationsQuery = z.infer<typeof adminReservationsQuerySchema>;
