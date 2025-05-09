"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader } from "lucide-react"

export function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          router.push('/')
          return
        }

        if (profile?.role !== 'admin') {
          console.log('User is not an admin')
          router.push('/')
          return
        }

        // User is authenticated and has admin role
        setIsAdmin(true)
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Should redirect before this renders
  }

  return <>{children}</>
} 