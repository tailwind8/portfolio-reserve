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
  staffId: z.string().uuid('Invalid staff ID').optional(),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;

/**
 * Request body for creating a reservation
 */
export const createReservationSchema = z.object({
  menuId: z.string().uuid('Invalid menu ID'),
  staffId: z.string().uuid('Invalid staff ID'),
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
 * Japanese phone number format validation
 * Accepts: 090-1234-5678, 09012345678, 03-1234-5678, etc.
 */
const phoneRegex = /^(0\d{1,4}-?\d{1,4}-?\d{4}|0\d{9,10})$/;

/**
 * User registration schema
 */
export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .regex(phoneRegex, 'Invalid phone number format')
      .optional()
      .or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be 100 characters or less')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    passwordConfirm: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
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
