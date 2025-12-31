import { useEffect, useState, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { deduplicatedRequest, debounce, clearCache } from '@/lib/request-utils'

interface UserWithRole extends User {
  name?: string | null
  role?: string
  permalink?: string | null
  avatar_url?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const isInitialized = useRef(false)

  // Debounced setUser to reduce state updates
  const debouncedSetUser = useMemo(() => debounce(setUser, 100), [])

  // Centralized user data fetching with deduplication, caching, and retry logic
  const fetchUserData = async (): Promise<UserWithRole | null> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second

    // Single request function with retry logic inside
    const makeRequest = async (attempt: number): Promise<UserWithRole | null> => {
      console.log(`🚀 Fetching user data (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'useAuth.ts:32',
          message: 'makeRequest called',
          data: { attempt },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion

      const response = await fetch('/api/auth-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'useAuth.ts:40',
          message: 'API response received',
          data: { status: response.status, statusText: response.statusText, ok: response.ok },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {})
      // #endregion

      // Handle 401 (Unauthorized) gracefully - this just means user is not logged in
      if (response.status === 401) {
        console.log('ℹ️ No authenticated user (401) - user is not logged in')
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'useAuth.ts:44',
            message: '401 handled gracefully',
            data: { returningNull: true },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          }),
        }).catch(() => {})
        // #endregion
        return null // Return null instead of throwing error
      }

      if (!response.ok) {
        const errorText = await response.text()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6ad30084-e554-4118-90e3-f654a3d8dd51', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'useAuth.ts:50',
            message: 'API error response',
            data: { status: response.status, errorText },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'E',
          }),
        }).catch(() => {})
        // #endregion
        console.error(`❌ API returned ${response.status}: ${errorText}`)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      if (!data.user) {
        console.error('❌ API response missing user data:', data)
        throw new Error('API response missing user data')
      }

      if (!data.user.name) {
        console.error('❌ User data missing name property:', data.user)
        throw new Error('User data missing name property')
      }

      console.log('✅ User data fetched successfully:', { id: data.user.id, name: data.user.name })
      return data.user
    }

    // Use deduplication for the first attempt (concurrent requests)
    // But retry logic happens outside to ensure retries actually execute
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        let result: UserWithRole | null

        if (attempt === 0) {
          // First attempt: use deduplication for concurrent requests
          result = await deduplicatedRequest(
            'current-user-data',
            () => makeRequest(attempt),
            5 * 60 * 1000 // 5 minutes cache
          )
        } else {
          // Retry attempts: no deduplication, just retry
          result = await makeRequest(attempt)
        }

        // If result is null (no authenticated user), return null gracefully
        if (result === null) {
          return null
        }

        return result
      } catch (apiError) {
        lastError = apiError instanceof Error ? apiError : new Error(String(apiError))
        console.error(`❌ Error fetching user data (attempt ${attempt + 1}):`, lastError)

        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        }
      }
    }

    // After all retries failed, throw the error - don't silently fail
    console.error('❌ All retry attempts failed. User data fetch failed completely.')
    throw lastError || new Error('User data fetch failed after all retries')
  }

  // Initialize user data
  const initializeUser = async () => {
    if (isInitialized.current) return
    isInitialized.current = true

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      // Handle AuthSessionMissingError gracefully - this is normal for public users
      if (error) {
        // Check if it's a session missing error (expected for public users)
        const errorName = (error as any)?.name || error?.constructor?.name || ''
        const errorMessage = error?.message || String(error) || ''
        const isSessionError =
          errorName === 'AuthSessionMissingError' ||
          errorMessage.includes('session') ||
          errorMessage.includes('Auth session missing')

        if (isSessionError) {
          // This is normal for public users - don't log as error, just set user to null
          debouncedSetUser(null)
          setLoading(false)
          return
        }
        // For other errors, throw them
        throw error
      }

      if (user) {
        try {
          const userData = await fetchUserData()
          if (userData && userData.name) {
            debouncedSetUser(userData)
          } else {
            // User data is null or invalid - clear user state
            debouncedSetUser(null)
          }
        } catch (err) {
          console.error('❌ CRITICAL: Failed to fetch user data after all retries:', err)
          // Don't set user - let the error be visible so it can be fixed
          // The UI should show loading state until this is resolved
          debouncedSetUser(null)
        }
      } else {
        // No authenticated user - this is normal for public users
        debouncedSetUser(null)
      }
    } catch (err: any) {
      // Check if this is a session missing error (normal for public users)
      const errorName = err?.name || err?.constructor?.name || ''
      const errorMessage = err?.message || String(err) || ''
      const isSessionError =
        errorName === 'AuthSessionMissingError' ||
        errorMessage.includes('session') ||
        errorMessage.includes('Auth session missing')

      // Only log non-session errors
      if (!isSessionError) {
        console.error('Error initializing user:', err)
      }
      // Always set user to null if there's an error (session or otherwise)
      debouncedSetUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear cache on sign in/out to ensure fresh data
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        clearCache('current-user-data')
      }

      if (session?.user) {
        try {
          const userData = await fetchUserData()
          if (userData && userData.name) {
            debouncedSetUser(userData)
          } else {
            // User data is null or invalid - clear user state
            debouncedSetUser(null)
          }
        } catch (err) {
          console.error('❌ CRITICAL: Failed to fetch user data after all retries:', err)
          // Don't set user - let the error be visible so it can be fixed
          debouncedSetUser(null)
        }
      } else {
        // Clear user on logout or when no session exists (normal for public users)
        debouncedSetUser(null)
      }
    })

    // Listen for avatar change events to refresh user data
    const handleEntityPrimaryImageChanged = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { entityType, entityId, primaryKind } = customEvent.detail || {}

      // Only handle avatar changes for users
      if (entityType === 'user' && primaryKind === 'avatar') {
        // Get current user ID from auth session to avoid dependency issues
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        // Only refresh if this is the current user's avatar
        if (authUser && entityId === authUser.id) {
          console.log('🔄 Avatar changed for current user, refreshing user data...')

          // Clear caches related to user avatar
          clearCache('current-user-data')
          clearCache(`user-avatar-${entityId}`)

          // Refresh user data to get updated avatar_url
          try {
            const userData = await fetchUserData()
            if (userData && userData.name) {
              debouncedSetUser(userData)
              console.log('✅ User data refreshed with new avatar')
            }
          } catch (err) {
            console.error('❌ Failed to refresh user data after avatar change:', err)
          }
        }
      }
    }

    window.addEventListener('entityPrimaryImageChanged', handleEntityPrimaryImageChanged)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('entityPrimaryImageChanged', handleEntityPrimaryImageChanged)
    }
  }, [])

  return { user, loading }
}
