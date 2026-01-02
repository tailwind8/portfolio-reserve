import { logSecurityEvent, getClientIp, getUserAgent } from '@/lib/security-logger';
import { prisma } from '@/lib/prisma';

// Prismaのモック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    securityLog: {
      create: jest.fn(),
    },
  },
}));

describe('security-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.errorをモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('logSecurityEvent', () => {
    it('セキュリティイベントをログに記録できる', async () => {
      const mockCreate = prisma.securityLog.create as jest.Mock;
      mockCreate.mockResolvedValue({
        id: 'test-id',
        tenantId: 'demo-booking',
        eventType: 'LOGIN_SUCCESS',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { email: 'test@example.com' },
        createdAt: new Date(),
      });

      await logSecurityEvent({
        eventType: 'LOGIN_SUCCESS',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { email: 'test@example.com' },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          tenantId: 'demo-booking',
          eventType: 'LOGIN_SUCCESS',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { email: 'test@example.com' },
        },
      });
    });

    it('metadataなしでログに記録できる', async () => {
      const mockCreate = prisma.securityLog.create as jest.Mock;
      mockCreate.mockResolvedValue({
        id: 'test-id',
        tenantId: 'demo-booking',
        eventType: 'LOGOUT',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: undefined,
        createdAt: new Date(),
      });

      await logSecurityEvent({
        eventType: 'LOGOUT',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          tenantId: 'demo-booking',
          eventType: 'LOGOUT',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: undefined,
        },
      });
    });

    it('ログ記録失敗時にエラーをコンソールに出力する', async () => {
      const mockCreate = prisma.securityLog.create as jest.Mock;
      const error = new Error('Database error');
      mockCreate.mockRejectedValue(error);

      await logSecurityEvent({
        eventType: 'LOGIN_FAILED',
        ipAddress: '192.168.1.1',
      });

      expect(console.error).toHaveBeenCalledWith('Failed to log security event:', error);
    });

    it('ログ記録失敗時でも例外をスローしない', async () => {
      const mockCreate = prisma.securityLog.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Database error'));

      await expect(
        logSecurityEvent({
          eventType: 'LOGIN_FAILED',
          ipAddress: '192.168.1.1',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getClientIp', () => {
    it('x-forwarded-forヘッダーからIPアドレスを取得できる', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('x-real-ipヘッダーからIPアドレスを取得できる', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '203.0.113.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('ヘッダーがない場合はフォールバックIPを返す', () => {
      const request = new Request('http://localhost');

      const ip = getClientIp(request);
      expect(ip).toBe('127.0.0.1');
    });

    it('x-forwarded-forが優先される', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '198.51.100.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('203.0.113.1');
    });
  });

  describe('getUserAgent', () => {
    it('user-agentヘッダーを取得できる', () => {
      const request = new Request('http://localhost', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      const userAgent = getUserAgent(request);
      expect(userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    });

    it('user-agentヘッダーがない場合はundefinedを返す', () => {
      const request = new Request('http://localhost');

      const userAgent = getUserAgent(request);
      expect(userAgent).toBeUndefined();
    });
  });
});
