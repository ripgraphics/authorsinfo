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
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const isInitialized = useRef(false)

  // Debounced setUser to reduce state updates
  const debouncedSetUser = useMemo(
    () => debounce(setUser, 100),
    []
  )

  // Centralized user data fetching with deduplication, caching, and retry logic
  const fetchUserData = async (): Promise<UserWithRole | null> => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 1000 // 1 second
    
    // Single request function with retry logic inside
    const makeRequest = async (attempt: number): Promise<UserWithRole> => {
      console.log(`🚀 Fetching user data (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
      
      const response = await fetch('/api/auth-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
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
        let result: UserWithRole
        
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
        
        return result
      } catch (apiError) {
        lastError = apiError instanceof Error ? apiError : new Error(String(apiError))
        console.error(`❌ Error fetching user data (attempt ${attempt + 1}):`, lastError)
        
        if (attempt < MAX_RETRIES) {
          console.log(`🔄 Retrying in ${RETRY_DELAY}ms...`)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
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
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (user) {
        try {
          const userData = await fetchUserData()
          if (userData && userData.name) {
            debouncedSetUser(userData)
          } else {
            throw new Error('User data fetch returned invalid data')
          }
        } catch (err) {
          console.error('❌ CRITICAL: Failed to fetch user data after all retries:', err)
          // Don't set user - let the error be visible so it can be fixed
          // The UI should show loading state until this is resolved
        }
      }
    } catch (err) {
      console.error('Error initializing user:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
            throw new Error('User data fetch returned invalid data')
          }
        } catch (err) {
          console.error('❌ CRITICAL: Failed to fetch user data after all retries:', err)
          // Don't set user - let the error be visible so it can be fixed
        }
      } else {
        // Clear user on logout
        debouncedSetUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
} 