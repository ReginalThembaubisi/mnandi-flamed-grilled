import { createClient, SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (browserClient) return browserClient
  // Only initialize when env vars are present (client/runtime). Avoids build-time errors.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // During build/prerender these can be undefined – return a safe error message if used.
    throw new Error('Supabase not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  browserClient = createClient(url, key)
  return browserClient
}


