/**
 * rate-limit.ts のユニットテスト
 *
 * レート制限機能のテスト
 */

import type { NextRequest } from 'next/server';

// Upstashモジュールをモック（rate-limitをインポートする前に設定）
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

// セキュリティロガーをモック
jest.mock('@/lib/security-logger', () => ({
  logSecurityEvent: jest.fn().mockResolvedValue(undefined),
  getUserAgent: jest.fn().mockReturnValue('Mozilla/5.0'),
}));

// モック設定後にrate-limitをインポート
import { checkRateLimit } from '@/lib/rate-limit';

// console.warn と console.error をモック
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

/**
 * NextRequestを模したリクエストを作成
 */
function createMockRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new Request(url, { headers }) as unknown as NextRequest;
}

describe('rate-limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('checkRateLimit', () => {
    describe('when ratelimit is null', () => {
      it('should return null when ratelimit is null', async () => {
        const request = createMockRequest('http://localhost:3000/api/auth/login');
        const result = await checkRateLimit(request, null);
        expect(result).toBeNull();
      });

      it('should not throw error when ratelimit is null', async () => {
        const request = createMockRequest('http://localhost:3000/api/auth/register');
        await expect(checkRateLimit(request, null)).resolves.not.toThrow();
      });
    });

    describe('when rate limit succeeds', () => {
      it('should return null when under rate limit', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );
        expect(result).toBeNull();
        expect(mockRatelimit.limit).toHaveBeenCalledWith('192.168.1.1');
      });

      it('should use x-real-ip when x-forwarded-for is not present', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-real-ip': '10.0.0.1',
        });

        await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );
        expect(mockRatelimit.limit).toHaveBeenCalledWith('10.0.0.1');
      });

      it('should use 127.0.0.1 when no IP headers are present', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login');

        await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );
        expect(mockRatelimit.limit).toHaveBeenCalledWith('127.0.0.1');
      });

      it('should use first IP from x-forwarded-for when multiple are present', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        });

        await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );
        expect(mockRatelimit.limit).toHaveBeenCalledWith('192.168.1.1');
      });

      it('should trim IP from x-forwarded-for', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: true,
            limit: 10,
            remaining: 9,
            reset: Date.now() + 60000,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '  192.168.1.1  ',
        });

        await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );
        expect(mockRatelimit.limit).toHaveBeenCalledWith('192.168.1.1');
      });
    });

    describe('when rate limit exceeded', () => {
      it('should return 429 response when rate limited', async () => {
        const resetTime = Date.now() + 60000;
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        expect(result).not.toBeNull();
        expect(result?.status).toBe(429);
      });

      it('should return proper error body', async () => {
        const resetTime = Date.now() + 60000;
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        const body = await result?.json();
        expect(body).toEqual({
          success: false,
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      });

      it('should include rate limit headers', async () => {
        const resetTime = Date.now() + 60000;
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        expect(result?.headers.get('X-RateLimit-Limit')).toBe('10');
        expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
        expect(result?.headers.get('X-RateLimit-Reset')).toBe(resetTime.toString());
        expect(result?.headers.get('Retry-After')).toBeDefined();
      });

      it('should call logSecurityEvent when rate limited', async () => {
        const { logSecurityEvent } = await import('@/lib/security-logger');
        const resetTime = Date.now() + 60000;
        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        expect(logSecurityEvent).toHaveBeenCalledWith({
          eventType: 'RATE_LIMIT_EXCEEDED',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: expect.objectContaining({
            endpoint: '/api/auth/login',
            limit: '10',
            remaining: '0',
          }),
        });
      });
    });

    describe('error handling', () => {
      it('should return null and log error when ratelimit.limit throws', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockRejectedValue(new Error('Redis timeout')),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        expect(result).toBeNull();
        expect(mockConsoleError).toHaveBeenCalledWith(
          '[Rate Limit] Error checking rate limit:',
          expect.any(Error)
        );
      });

      it('should not throw when ratelimit.limit throws', async () => {
        const mockRatelimit = {
          limit: jest.fn().mockRejectedValue(new Error('Connection refused')),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login');

        await expect(
          checkRateLimit(
            request,
            mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
          )
        ).resolves.not.toThrow();
      });
    });

    describe('retry-after calculation', () => {
      it('should calculate retry-after correctly', async () => {
        const now = Date.now();
        const resetTime = now + 30000; // 30 seconds from now
        jest.spyOn(Date, 'now').mockReturnValue(now);

        const mockRatelimit = {
          limit: jest.fn().mockResolvedValue({
            success: false,
            limit: 10,
            remaining: 0,
            reset: resetTime,
          }),
        };

        const request = createMockRequest('http://localhost:3000/api/auth/login', {
          'x-forwarded-for': '192.168.1.1',
        });

        const result = await checkRateLimit(
          request,
          mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
        );

        const retryAfter = parseInt(result?.headers.get('Retry-After') || '0', 10);
        expect(retryAfter).toBe(30);

        jest.spyOn(Date, 'now').mockRestore();
      });
    });
  });

  describe('IP address extraction', () => {
    it.each([
      ['192.168.1.1', { 'x-forwarded-for': '192.168.1.1' }, '192.168.1.1'],
      ['10.0.0.1', { 'x-real-ip': '10.0.0.1' }, '10.0.0.1'],
      ['first IP', { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, '1.1.1.1'],
      ['trimmed IP', { 'x-forwarded-for': '  3.3.3.3  ' }, '3.3.3.3'],
      ['default', {}, '127.0.0.1'],
    ])('should extract %s correctly', async (_, headers, expectedIp) => {
      const mockRatelimit = {
        limit: jest.fn().mockResolvedValue({
          success: true,
          limit: 10,
          remaining: 9,
          reset: Date.now() + 60000,
        }),
      };

      const request = createMockRequest('http://localhost:3000/api/test', headers);

      await checkRateLimit(
        request,
        mockRatelimit as unknown as Parameters<typeof checkRateLimit>[1]
      );

      expect(mockRatelimit.limit).toHaveBeenCalledWith(expectedIp);
    });
  });
});
