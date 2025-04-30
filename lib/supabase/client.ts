import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Create a singleton instance of the Supabase client
let supabaseClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClientComponentClient<Database>()
  }
  return supabaseClientInstance
}

// Export the singleton instance
export const supabaseClient = getSupabaseClient()
