'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import EntityAvatar from '@/components/entity-avatar'
import { deduplicatedRequest } from '@/lib/request-utils'

interface UserAvatarProps {
  userId?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showName?: boolean
  nameClassName?: string
}

/**
 * Reusable UserAvatar component that automatically fetches user avatar from images table
 * via profiles.avatar_image_id. Can be used anywhere in the application.
 * 
 * @param userId - Optional user ID. If not provided, uses current authenticated user
 * @param name - Optional user name. If not provided, fetches from API
 * @param size - Avatar size (xs, sm, md, lg)
 * @param className - Additional CSS classes
 * @param showName - Whether to display user name next to avatar
 * @param nameClassName - CSS classes for name element
 */
export function UserAvatar({
  userId,
  name: providedName,
  size = 'sm',
  className = '',
  showName = false,
  nameClassName = ''
}: UserAvatarProps) {
  const { user: currentUser } = useAuth()
  const [userData, setUserData] = useState<{ name: string; avatar_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  // Determine which user to display
  const targetUserId = userId || currentUser?.id
  const isCurrentUser = !userId || userId === currentUser?.id

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false)
      return
    }

    // If it's the current user and we have the data, use it directly
    if (isCurrentUser && currentUser) {
      setUserData({
        name: providedName || (currentUser as any)?.name || currentUser.email || 'User',
        avatar_url: (currentUser as any)?.avatar_url || null
      })
      setLoading(false)
      return
    }

    // For other users, fetch from API
    const fetchUserData = async () => {
      try {
        const data = await deduplicatedRequest(
          `user-avatar-${targetUserId}`,
          async () => {
            const response = await fetch(`/api/auth-users?user_id=${targetUserId}`)
            if (response.ok) {
              const result = await response.json()
              return result.user
            }
            return null
          },
          5 * 60 * 1000 // 5 minutes cache
        )

        if (data) {
          setUserData({
            name: providedName || data.name || 'User',
            avatar_url: data.avatar_url || null
          })
        } else {
          setUserData({
            name: providedName || 'User',
            avatar_url: null
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        setUserData({
          name: providedName || 'User',
          avatar_url: null
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [targetUserId, isCurrentUser, currentUser, providedName])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`rounded-full bg-gray-200 animate-pulse ${size === 'xs' ? 'w-8 h-8' : size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-24 h-24' : 'w-32 h-32'}`} />
        {showName && <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />}
      </div>
    )
  }

  const displayName = userData?.name || providedName || 'User'
  const avatarUrl = userData?.avatar_url || null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <EntityAvatar
        type="user"
        id={targetUserId || ''}
        name={displayName}
        src={avatarUrl}
        size={size}
        className={className}
      />
      {showName && (
        <span className={nameClassName || 'text-sm font-medium text-gray-900'}>
          {displayName}
        </span>
      )}
    </div>
  )
}

/**
 * Hook to get current user's avatar URL from the images table
 * Returns the avatar_url from the authenticated user object
 */
export function useCurrentUserAvatar(): string | null {
  const { user } = useAuth()
  return (user as any)?.avatar_url || null
}

/**
 * Hook to get current user's display name
 */
export function useCurrentUserName(): string {
  const { user } = useAuth()
  return (user as any)?.name || (user as any)?.user_metadata?.full_name || user?.email || 'You'
}

