import { validationErrorResponse, notFoundResponse } from '@/lib/api-utils';

describe('api-utils', () => {
  describe('getTenantId', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('環境変数が設定されている場合はその値を返す', async () => {
      process.env.NEXT_PUBLIC_TENANT_ID = 'custom-tenant';

      // モジュールを再読み込みして新しい環境変数を反映
      jest.resetModules();
      const { getTenantId: freshGetTenantId } = await import('@/lib/api-utils');

      expect(freshGetTenantId()).toBe('custom-tenant');
    });

    it('環境変数が未設定の場合はデフォルト値を返す', async () => {
      delete process.env.NEXT_PUBLIC_TENANT_ID;

      jest.resetModules();
      const { getTenantId: freshGetTenantId } = await import('@/lib/api-utils');

      expect(freshGetTenantId()).toBe('demo-booking');
    });
  });

  describe('validationErrorResponse', () => {
    it('400ステータスでバリデーションエラーレスポンスを返す', async () => {
      const issues = [
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: '名前は文字列である必要があります',
        },
      ];

      const response = validationErrorResponse(issues as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('バリデーションエラー');
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toEqual(issues);
    });

    it('複数のバリデーションエラーを含められる', async () => {
      const issues = [
        { code: 'too_small', path: ['name'], message: '名前は必須です' },
        { code: 'invalid_string', path: ['email'], message: 'メールアドレスの形式が正しくありません' },
      ];

      const response = validationErrorResponse(issues as never);
      const data = await response.json();

      expect(data.error.details).toHaveLength(2);
    });
  });

  describe('notFoundResponse', () => {
    it('404ステータスでリソース名を含むエラーレスポンスを返す', async () => {
      const response = notFoundResponse('予約');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('予約が見つかりません');
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('異なるリソース名でエラーメッセージを生成する', async () => {
      const response = notFoundResponse('顧客');
      const data = await response.json();

      expect(data.error.message).toBe('顧客が見つかりません');
    });

    it('スタッフリソースでエラーメッセージを生成する', async () => {
      const response = notFoundResponse('スタッフ');
      const data = await response.json();

      expect(data.error.message).toBe('スタッフが見つかりません');
    });
  });
});
