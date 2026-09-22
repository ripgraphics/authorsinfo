'use client'

import { useUser } from '@/contexts/UserContext'

// Compatibility wrapper for existing consumers. UserContext owns the single
// browser auth client and subscription for the whole application.
export function useAuth() {
  const { user, loading } = useUser()
  return { user, loading }
}
