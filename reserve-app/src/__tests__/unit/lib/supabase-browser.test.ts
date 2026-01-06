/**
 * supabase-browser.ts のユニットテスト
 *
 * ブラウザ用Supabaseクライアント生成関数のテスト
 */

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import * as supabaseSsr from '@supabase/ssr';

// Supabase SSRのモック
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));

const mockCreateBrowserClient = jest.mocked(supabaseSsr.createBrowserClient);

describe('supabase-browser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createSupabaseBrowserClient', () => {
    it('Supabaseクライアントを作成する', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';

      const client = createSupabaseBrowserClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-publishable-key'
      );
      expect(client).toBeDefined();
    });

    it('NEXT_PUBLIC_SUPABASE_ANON_KEYをフォールバックとして使用する', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = undefined;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      createSupabaseBrowserClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
    });

    it('環境変数がない場合はプレースホルダー値を使用する', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = undefined;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = undefined;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = undefined;

      createSupabaseBrowserClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      );
    });

    it('クライアントにauthメソッドが含まれる', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';

      const client = createSupabaseBrowserClient();

      expect(client.auth).toBeDefined();
      expect(client.auth.getSession).toBeDefined();
      expect(client.auth.signInWithPassword).toBeDefined();
      expect(client.auth.signOut).toBeDefined();
    });
  });
});
