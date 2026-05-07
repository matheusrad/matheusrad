import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { createRetryFetch } from './retryFetch'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  global: { fetch: createRetryFetch() },
})
