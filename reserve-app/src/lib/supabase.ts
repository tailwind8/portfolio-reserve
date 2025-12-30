import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
// Supports both new (publishable/secret) and legacy (anon/service_role) API keys

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Try new publishable key first, fallback to legacy anon key
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
      'Required: NEXT_PUBLIC_SUPABASE_URL and either:\n' +
      '  - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new API key format), or\n' +
      '  - NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy API key format)'
  );
}

// Client-side Supabase client (uses publishable/anon key)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side Supabase client with elevated privileges (uses secret/service_role key)
// ONLY use this on the server side (API routes, Server Components, Server Actions)
export function getSupabaseAdmin() {
  const adminKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminKey) {
    throw new Error(
      'Missing Supabase admin key. Required: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl!, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default supabase;
