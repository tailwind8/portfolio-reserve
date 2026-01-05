import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client configuration
// Supports both new (publishable/secret) and legacy (anon/service_role) API keys

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// Try new publishable key first, fallback to legacy anon key
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

// Check if we're using placeholder values (build time or test environment)
export const isPlaceholder = supabaseUrl === 'https://placeholder.supabase.co';

// テスト環境かどうか（CIやE2Eテスト時）
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.SKIP_AUTH_IN_TEST === 'true';

/**
 * Supabaseクライアントを作成
 * プレースホルダー環境では、ネットワーク接続を行わないモッククライアントを返す
 */
function createSupabaseClient(): SupabaseClient {
  // プレースホルダー + テスト環境では、fetchをモックしてネットワーク接続を防ぐ
  if (isPlaceholder && isTestEnvironment) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        // ネットワーク接続を行わないダミーfetch
        fetch: async () => {
          return new Response(JSON.stringify({ user: null, session: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        },
      },
    });
  }

  // 通常環境では標準のクライアントを作成
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Client-side Supabase client (uses publishable/anon key)
export const supabase = createSupabaseClient();

// Runtime validation helper
export function validateSupabaseConfig() {
  if (isPlaceholder) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.\n' +
        'Required: NEXT_PUBLIC_SUPABASE_URL and either:\n' +
        '  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new API key format), or\n' +
        '  - NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy API key format)'
    );
  }
}

// Server-side Supabase client with elevated privileges (uses secret/service_role key)
// ONLY use this on the server side (API routes, Server Components, Server Actions)
export function getSupabaseAdmin() {
  const adminKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminKey || isPlaceholder) {
    throw new Error(
      'Missing Supabase admin key. Required: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default supabase;
