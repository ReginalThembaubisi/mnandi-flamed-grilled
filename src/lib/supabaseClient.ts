import { createClient, SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (browserClient) return browserClient
  // Only initialize when env vars are present (client/runtime). Avoids build-time errors.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Supabase is optional - return null if not configured
    return null
  }
  browserClient = createClient(url, key)
  return browserClient
}


