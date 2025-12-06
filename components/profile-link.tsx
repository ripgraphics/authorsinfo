'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ProfileLinkProps {
  userId: string
  userName: string
  className?: string
  children: React.ReactNode
}

export function ProfileLink({ userId, userName, className, children }: ProfileLinkProps) {
  const [profileUrl, setProfileUrl] = useState(`/profile/${userId}`)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const getProfileUrl = async () => {
      try {
        // Get the user's permalink
        const { data: user, error } = await supabase
          .from('users')
          .select('permalink')
          .eq('id', userId)
          .single()

        if (error || !user || !user.permalink) {
          // Fallback to ID if permalink is not available
          setProfileUrl(`/profile/${userId}`)
        } else {
          setProfileUrl(`/profile/${user.permalink}`)
        }
      } catch (error) {
        console.error('Error getting profile URL:', error)
        // Fallback to ID
        setProfileUrl(`/profile/${userId}`)
      } finally {
        setIsLoading(false)
      }
    }

    getProfileUrl()
  }, [userId, supabase])

  if (isLoading) {
    return (
      <Link href={`/profile/${userId}`} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <Link href={profileUrl} className={className}>
      {children}
    </Link>
  )
} 