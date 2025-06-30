import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

interface UserWithRole extends User {
  role?: string
}

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          // Fetch user data with role from API endpoint
          try {
            const response = await fetch('/api/auth-users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            if (response.ok) {
              const data = await response.json()
              if (data.user) {
                setUser(data.user)
              } else {
                // Fallback to user without role
                const userWithRole = {
                  ...session.user,
                  role: 'user'
                }
                setUser(userWithRole)
              }
            } else {
              // Fallback to user without role
              const userWithRole = {
                ...session.user,
                role: 'user'
              }
              setUser(userWithRole)
            }
          } catch (apiError) {
            console.error('Error fetching user from API:', apiError)
            // Fallback to user without role
            const userWithRole = {
              ...session.user,
              role: 'user'
            }
            setUser(userWithRole)
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            // Fetch user data with role from API endpoint
            try {
              const response = await fetch('/api/auth-users', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              })
              if (response.ok) {
                const data = await response.json()
                if (data.user) {
                  setUser(data.user)
                } else {
                  // Fallback to user without role
                  const userWithRole = {
                    ...session.user,
                    role: 'user'
                  }
                  setUser(userWithRole)
                }
              } else {
                // Fallback to user without role
                const userWithRole = {
                  ...session.user,
                  role: 'user'
                }
                setUser(userWithRole)
              }
            } catch (apiError) {
              console.error('Error fetching user from API:', apiError)
              // Fallback to user without role
              const userWithRole = {
                ...session.user,
                role: 'user'
              }
              setUser(userWithRole)
            }
          } else {
            setUser(null)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.error('Error initializing user:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [])

  return { user, loading }
} 