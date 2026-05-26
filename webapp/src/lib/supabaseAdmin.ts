import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

// Server-only client that bypasses RLS — never import from client components
export function getSupabaseAdmin() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}
