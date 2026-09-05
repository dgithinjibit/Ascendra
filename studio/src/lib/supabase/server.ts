/**
 * Supabase Client - Server-side
 * 
 * Creates a Supabase client for use in API routes and server components.
 * Uses service role key (keep secret, never expose to browser).
 */

import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let serverClient: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (serverClient) {
    return serverClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // During build time, use placeholder values to allow build to complete
    console.warn('⚠️ Supabase server env vars not set. Using placeholder for build.');
    serverClient = supabaseCreateClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceKey || 'placeholder-service-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    return serverClient;
  }

  serverClient = supabaseCreateClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

// Backwards-compatible export:
// Some files import `createClient` from this module (e.g. `import { createClient } from '@/lib/supabase/server'`)
// To avoid build-time "export not found" errors on Vercel, re-export a small wrapper named
// `createClient` that returns the same server client. Callers may `await createClient()`
// (that's fine even if the function is synchronous).
export function createClient(): SupabaseClient<Database> {
  return getSupabaseServerClient();
}
