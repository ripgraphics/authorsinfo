import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Use SUPABASE_URL if set, otherwise fallback to NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

if (!supabaseServiceKey) {
  throw new Error('Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.')
}

// Create a Supabase client with admin privileges for server-side operations
// Add timeout options to prevent hanging connections
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
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

// Export createClient function for compatibility
// Use a function expression to avoid potential hoisting issues
export const createClient = () => supabaseAdmin
