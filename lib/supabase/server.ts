import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create a Supabase client with admin privileges for server-side operations
// Add timeout options to prevent hanging connections
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
  global: {
    fetch: (url, options) => {
      const controller = new AbortController()
      const { signal } = controller

      // Increase timeout from 5 to 15 seconds
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      return fetch(url, { ...options, signal }).finally(() => clearTimeout(timeoutId))
    },
  },
})

// Also export the createClient function for SSR operations if needed
export function createClientSSR() {
  const cookieStore = cookies()

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: (url, options) => {
        const controller = new AbortController()
        const { signal } = controller
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        return fetch(url, { ...options, signal }).finally(() => clearTimeout(timeoutId))
      },
    },
  })
}
