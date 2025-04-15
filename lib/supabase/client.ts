import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for use on the client-side
// Add timeout options to prevent hanging connections
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "authors-info-auth",
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
