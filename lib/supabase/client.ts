import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Create a singleton instance of the Supabase client
let supabaseClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClientInstance
}

// Export the singleton instance
export const supabaseClient = getSupabaseClient()

// Also export as 'supabase' for backward compatibility
export const supabase = supabaseClient
