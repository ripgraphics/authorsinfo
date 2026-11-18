'use client'

import { useAuth as useSupabaseAuth } from './useAuth'
import { ConvexReactClient } from 'convex/react'

// For now, we'll just export the supabase auth state.
// Full Convex integration will come later when we have query functions ready.
export function useConvexAuth() {
  const supabaseAuth = useSupabaseAuth()

  return {
    // Supabase auth state (existing)
    user: supabaseAuth.user,
    loading: supabaseAuth.loading,
    isAuthenticated: !!supabaseAuth.user && !supabaseAuth.loading,

    // Placeholder for future Convex auth integration
    convexClient: null as ConvexReactClient | null,
    isConnected: false,
  }
}
