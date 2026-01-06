/**
 * useAuthFetch.ts のユニットテスト
 *
 * 認証付きfetchフックとヘルパー関数のテスト
 */

import { renderHook, act } from '@testing-library/react';
import { useAuthFetch, extractErrorMessage } from '@/hooks/useAuthFetch';
import * as supabaseBrowser from '@/lib/supabase-browser';

// Supabaseのモック
jest.mock('@/lib/supabase-browser', () => ({
  createSupabaseBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
  })),
}));

// グローバルfetchのモック
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockCreateSupabaseBrowserClient = jest.mocked(supabaseBrowser.createSupabaseBrowserClient);

describe('useAuthFetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ success: true })));
  });

  describe('テスト環境での動作（認証スキップ）', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST = 'true';
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST = originalEnv;
    });

    it('認証をスキップしてfetchを実行できる', async () => {
      const { result } = renderHook(() => useAuthFetch());

      await act(async () => {
        await result.current.authFetch('/api/test');
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
    });

    it('オプション付きでfetchを実行できる', async () => {
      const { result } = renderHook(() => useAuthFetch());

      await act(async () => {
        await result.current.authFetch('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        });
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });

    it('bodyがある場合Content-Typeが自動設定される', async () => {
      const { result } = renderHook(() => useAuthFetch());

      await act(async () => {
        await result.current.authFetch('/api/test', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        });
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders.get('Content-Type')).toBe('application/json');
    });

    it('既存のヘッダーが保持される', async () => {
      const { result } = renderHook(() => useAuthFetch());

      await act(async () => {
        await result.current.authFetch('/api/test', {
          headers: {
            'X-Custom-Header': 'custom-value',
          },
        });
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders.get('X-Custom-Header')).toBe('custom-value');
    });
  });

  describe('本番環境での動作（認証あり）', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST = undefined;
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST = originalEnv;
    });

    it('セッションがない場合エラーをスローする', async () => {
      mockCreateSupabaseBrowserClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
          }),
        },
      } as unknown as ReturnType<typeof supabaseBrowser.createSupabaseBrowserClient>);

      const { result } = renderHook(() => useAuthFetch());

      await expect(async () => {
        await act(async () => {
          await result.current.authFetch('/api/test');
        });
      }).rejects.toThrow('認証が必要です。再度ログインしてください。');
    });

    it('セッションがある場合Authorizationヘッダーが設定される', async () => {
      mockCreateSupabaseBrowserClient.mockReturnValue({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: {
              session: {
                access_token: 'test-access-token',
              },
            },
          }),
        },
      } as unknown as ReturnType<typeof supabaseBrowser.createSupabaseBrowserClient>);

      const { result } = renderHook(() => useAuthFetch());

      await act(async () => {
        await result.current.authFetch('/api/test');
      });

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders.get('Authorization')).toBe('Bearer test-access-token');
    });
  });
});

describe('extractErrorMessage', () => {
  it('文字列をそのまま返す', () => {
    expect(extractErrorMessage('エラーメッセージ')).toBe('エラーメッセージ');
  });

  it('messageプロパティを持つオブジェクトからメッセージを抽出する', () => {
    expect(extractErrorMessage({ message: 'オブジェクトエラー' })).toBe('オブジェクトエラー');
  });

  it('Errorオブジェクトからメッセージを抽出する', () => {
    expect(extractErrorMessage(new Error('Errorオブジェクト'))).toBe('Errorオブジェクト');
  });

  it('messageプロパティがない場合デフォルトメッセージを返す', () => {
    expect(extractErrorMessage({})).toBe('エラーが発生しました');
  });

  it('nullの場合デフォルトメッセージを返す', () => {
    expect(extractErrorMessage(null)).toBe('エラーが発生しました');
  });

  it('undefinedの場合デフォルトメッセージを返す', () => {
    expect(extractErrorMessage(undefined)).toBe('エラーが発生しました');
  });

  it('数値の場合デフォルトメッセージを返す', () => {
    expect(extractErrorMessage(123)).toBe('エラーが発生しました');
  });

  it('messageが数値の場合文字列に変換する', () => {
    expect(extractErrorMessage({ message: 404 })).toBe('404');
  });
});
