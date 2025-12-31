import { successResponse, errorResponse, handleApiError } from '@/lib/api-response';
import { z } from 'zod';

describe('api-response utilities', () => {
  describe('successResponse', () => {
    it('should create a successful response with data', async () => {
      const data = { id: '1', name: 'Test' };
      const response = successResponse(data);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(data);
      expect(json.timestamp).toBeDefined();
    });

    it('should accept custom status code', async () => {
      const data = { id: '1' };
      const response = successResponse(data, 201);

      expect(response.status).toBe(201);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with message', async () => {
      const response = errorResponse('Test error', 400);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error?.message).toBe('Test error');
      expect(json.timestamp).toBeDefined();
    });

    it('should include error code and details', async () => {
      const response = errorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { field: 'email' }
      );
      const json = await response.json();

      expect(json.error?.code).toBe('VALIDATION_ERROR');
      expect(json.error?.details).toEqual({ field: 'email' });
    });
  });

  describe('handleApiError', () => {
    it('should handle ZodError', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0),
      });

      try {
        schema.parse({ email: 'invalid', age: -1 });
      } catch (error) {
        const response = handleApiError(error);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error?.code).toBe('VALIDATION_ERROR');
        expect(json.error?.details).toBeDefined();
      }
    });

    it('should handle Prisma duplicate error (P2002)', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
      };

      const response = handleApiError(prismaError);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error?.code).toBe('DUPLICATE_RECORD');
    });

    it('should handle Prisma not found error (P2025)', async () => {
      const prismaError = {
        code: 'P2025',
        meta: {},
      };

      const response = handleApiError(prismaError);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error?.code).toBe('NOT_FOUND');
    });

    it('should handle generic Error', async () => {
      const error = new Error('Something went wrong');
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error?.message).toBe('Something went wrong');
      expect(json.error?.code).toBe('INTERNAL_ERROR');
    });

    it('should handle unknown error', async () => {
      const response = handleApiError('Unknown error string');
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error?.code).toBe('UNKNOWN_ERROR');
    });
  });
});
