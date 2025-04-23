import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"

// Create a singleton instance of the Supabase client
let supabaseClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          storageKey: "authors-info-auth",
        },
        global: {
          fetch: (url, options) => {
            const controller = new AbortController()
            const { signal } = controller
            const timeoutId = setTimeout(() => controller.abort(), 15000)
            return fetch(url, { ...options, signal }).finally(() => clearTimeout(timeoutId))
          },
        },
      },
    })
  }
  return supabaseClientInstance
}

// Export the singleton instance
export const supabaseClient = getSupabaseClient()
