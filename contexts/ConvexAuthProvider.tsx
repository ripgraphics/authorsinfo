'use client'

import type { ReactNode } from 'react'
import { ConvexProvider } from 'convex/react'
import { convex } from '../lib/convex-client'

interface ConvexAuthProviderProps {
  children: ReactNode
}

/**
 * ConvexAuthProvider wraps ConvexProvider to integrate with Supabase Auth.
 * This is a client component that provides Convex context to the app.
 */
export function ConvexAuthProvider({ children }: ConvexAuthProviderProps) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}
