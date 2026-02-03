'use client'

import React, { useState, useEffect } from 'react'
import { EntityHoverCard, UserHoverCard } from '@/components/entity-hover-cards'
import { useAuth } from '@/hooks/useAuth'
import { deduplicatedRequest } from '@/lib/request-utils'

type EntityType = 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'

interface EntityNameProps {
  type: EntityType
  id: string
  name: string
  avatar_url?: string | null
  permalink?: string | null
  className?: string
  showActions?: boolean
  children?: React.ReactNode
  userStats?: {
    booksRead: number
    friendsCount: number
    followersCount: number
    mutualFriendsCount?: number
    location: string | null
    website: string | null
    joinedDate: string
  }
}

export function EntityName({
  type,
  id,
  name,
  avatar_url,
  permalink,
  className,
  showActions = true,
  children,
  userStats,
}: EntityNameProps) {
  const { user: currentUser } = useAuth()
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(avatar_url || null)

  // Fetch avatar URL for users when not provided (consistent with EntityAvatar behavior)
  useEffect(() => {
    // If avatar_url prop is provided and non-empty, use it directly
    if (avatar_url) {
      setResolvedAvatarUrl(avatar_url)
      return
    }

    // If no id or not a user type, can't fetch
    if (!id || type !== 'user') {
      return
    }

    // Optimize for current user - use data from useAuth hook directly
    if (currentUser && id === currentUser.id) {
      setResolvedAvatarUrl((currentUser as any)?.avatar_url || null)
      return
    }

    // Fetch avatar for users when not provided
    const fetchAvatar = async () => {
      try {
        const data = await deduplicatedRequest(
          `entity-name-user-${id}`,
          async () => {
            const response = await fetch(`/api/auth-users?user_id=${id}`)
            if (response.ok) {
              const result = await response.json()
              return result.user
            }
            return null
          },
          5 * 60 * 1000 // 5 minutes cache
        )
        setResolvedAvatarUrl(data?.avatar_url || null)
      } catch (error) {
        console.error('Error fetching user avatar for EntityName:', error)
        setResolvedAvatarUrl(null)
      }
    }

    fetchAvatar()
  }, [type, id, avatar_url, currentUser])

  const content = (
    <span className={className || 'hover:underline cursor-pointer text-gray-900'}>
      {children ?? name}
    </span>
  )

  if (type === 'user') {
    return (
      <UserHoverCard
        user={
          {
            id,
            name,
            avatar_url: resolvedAvatarUrl || undefined,
            permalink: permalink || undefined,
          } as any
        }
        showActions={showActions}
        userStats={userStats}
      >
        {content}
      </UserHoverCard>
    )
  }

  // Generic fallback for non-user entities
  return (
    <EntityHoverCard
      type={type}
      entity={{ id, name, avatar_url: resolvedAvatarUrl || undefined } as any}
      showActions={false}
    >
      {content}
    </EntityHoverCard>
  )
}

export default EntityName
