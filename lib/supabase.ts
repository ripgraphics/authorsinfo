import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Throw a clear error if environment variables are missing
if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required but not set")
}

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required but not set")
}

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

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Re-export from server file for backward compatibility
export * from "./supabase/server"
