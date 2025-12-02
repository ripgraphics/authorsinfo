import { useEffect, useState, useMemo, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { deduplicatedRequest, debounce, clearCache } from '@/lib/request-utils'

interface UserWithRole extends User {
  role?: string
  permalink?: string | null
  avatar_url?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const isInitialized = useRef(false)

  // Debounced setUser to reduce state updates
  const debouncedSetUser = useMemo(
    () => debounce(setUser, 100),
    []
  )

  // Centralized user data fetching with deduplication and caching
  const fetchUserData = async (): Promise<UserWithRole | null> => {
    return deduplicatedRequest(
      'current-user-data',
      async () => {
        try {
          console.log('🚀 Fetching fresh user data')
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
          
          const response = await fetch('/api/auth-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            const data = await response.json()
            if (data.user) {
              console.log('✅ User data fetched successfully')
              return data.user
            }
          }
          
          console.warn('⚠️ API response not ok, using fallback')
          return null
        } catch (apiError) {
          if (apiError instanceof Error && apiError.name === 'AbortError') {
            console.warn('⏰ API request timed out')
          } else {
            console.error('❌ Error fetching user from API:', apiError)
          }
          return null
        }
      },
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Initialize user data
  const initializeUser = async () => {
    if (isInitialized.current) return
    isInitialized.current = true

    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (session?.user) {
        const userData = await fetchUserData()
        if (userData) {
          debouncedSetUser(userData)
        } else {
          // Fallback to user without role and permalink
          const userWithRole = {
            ...session.user,
            role: 'user',
            permalink: null
          }
          debouncedSetUser(userWithRole)
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
        const userData = await fetchUserData()
        if (userData) {
          debouncedSetUser(userData)
        } else {
          // Fallback to user without role and permalink
          const userWithRole = {
            ...session.user,
            role: 'user',
            permalink: null
          }
          debouncedSetUser(userWithRole)
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