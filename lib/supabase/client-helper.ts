import { cookies } from 'next/headers'
import { createRouteHandlerClient, createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'

/**
 * Helper to create Supabase route handler client with Next.js 15 async cookies support
 * The Supabase client expects a function that returns the cookie store, so we await cookies() first
 * and then provide a function that returns the already-awaited cookie store
 */
export async function createRouteHandlerClientAsync() {
  const cookieStore = await cookies()
  return createRouteHandlerClient({ 
    cookies: () => cookieStore
  })
}

/**
 * Helper to create Supabase server component client with Next.js 15 async cookies support
 */
export async function createServerComponentClientAsync() {
  const cookieStore = await cookies()
  return createServerComponentClient({ 
    cookies: () => cookieStore
  })
}

/**
 * Helper to create Supabase server action client with Next.js 15 async cookies support
 */
export async function createServerActionClientAsync() {
  const cookieStore = await cookies()
  return createServerActionClient({ 
    cookies: () => cookieStore
  })
}

