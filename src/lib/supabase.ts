import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** True when both env vars are set. Otherwise the app runs on bundled sample data. */
export const supabaseConfigured = Boolean(url && key)

/** Browser client using the publishable key. Row level security decides what it can read. */
export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url!, key!, { auth: { persistSession: false } })
  : null
