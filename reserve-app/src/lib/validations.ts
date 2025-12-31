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
    .optional(),
  reservedTime: z.string().regex(timeRegex, 'Time must be in HH:mm format').optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'])
    .optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
