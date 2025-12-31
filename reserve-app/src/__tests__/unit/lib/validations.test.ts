import {
  availableSlotsQuerySchema,
  createReservationSchema,
  updateReservationSchema,
} from '@/lib/validations';

describe('validations', () => {
  describe('availableSlotsQuerySchema', () => {
    it('should validate correct query parameters', () => {
      const validData = {
        date: '2025-01-20',
        menuId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = availableSlotsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with optional staffId', () => {
      const validData = {
        date: '2025-01-20',
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = availableSlotsQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        date: '2025/01/20',
        menuId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = availableSlotsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid menuId UUID', () => {
      const invalidData = {
        date: '2025-01-20',
        menuId: 'not-a-uuid',
      };

      const result = availableSlotsQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createReservationSchema', () => {
    it('should validate correct reservation data', () => {
      const validData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2025-12-31',
        reservedTime: '14:00',
        notes: 'Window seat preferred',
      };

      const result = createReservationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept reservation without notes', () => {
      const validData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2025-12-31',
        reservedTime: '14:00',
      };

      const result = createReservationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject past dates', () => {
      const invalidData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2020-01-01',
        reservedTime: '14:00',
      };

      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2025-12-31',
        reservedTime: '2:00 PM',
      };

      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject notes longer than 500 characters', () => {
      const invalidData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2025-12-31',
        reservedTime: '14:00',
        notes: 'a'.repeat(501),
      };

      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid hour in time (>23)', () => {
      const invalidData = {
        menuId: '123e4567-e89b-12d3-a456-426614174000',
        staffId: '123e4567-e89b-12d3-a456-426614174001',
        reservedDate: '2025-12-31',
        reservedTime: '24:00',
      };

      const result = createReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateReservationSchema', () => {
    it('should validate partial update', () => {
      const validData = {
        status: 'CONFIRMED' as const,
      };

      const result = updateReservationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate multiple fields update', () => {
      const validData = {
        reservedDate: '2025-12-31',
        reservedTime: '15:00',
        notes: 'Updated notes',
      };

      const result = updateReservationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status value', () => {
      const invalidData = {
        status: 'INVALID_STATUS',
      };

      const result = updateReservationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all valid status values', () => {
      const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

      for (const status of statuses) {
        const result = updateReservationSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });
  });
});
