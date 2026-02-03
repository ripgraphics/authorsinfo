'use client'

import React, { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { EntityHoverCard, UserHoverCard } from '@/components/entity-hover-cards'
import { useAuth } from '@/hooks/useAuth'
import { deduplicatedRequest } from '@/lib/request-utils'

type EntityType = 'user' | 'author' | 'publisher' | 'group' | 'event' | 'book'

interface EntityAvatarProps {
  type: EntityType
  id: string
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  disableHoverCard?: boolean
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

export default function EntityAvatar({
  type,
  id,
  name,
  src,
  size = 'sm',
  className,
  disableHoverCard = false,
  userStats,
}: EntityAvatarProps) {
  const { user: currentUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(src || null)
  const [loading, setLoading] = useState(!src)

  useEffect(() => {
    // If src is provided, use it directly (no fetching needed)
    if (src !== undefined && src !== null) {
      setAvatarUrl(src)
      setLoading(false)
      return
    }

    // If no id, can't fetch
    if (!id) {
      setLoading(false)
      return
    }

    // Optimize for current user - use data from useAuth hook directly
    if (type === 'user' && currentUser && id === currentUser.id) {
      setAvatarUrl((currentUser as any)?.avatar_url || null)
      setLoading(false)
      return
    }

    // Fetch avatar based on entity type
    const fetchAvatar = async () => {
      try {
        let url: string | null = null

        switch (type) {
          case 'user': {
            const data = await deduplicatedRequest(
              `entity-avatar-user-${id}`,
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
            url = data?.avatar_url || null
            break
          }
          case 'author': {
            const data = await deduplicatedRequest(
              `entity-avatar-author-${id}`,
              async () => {
                const response = await fetch(`/api/authors/${id}`)
                if (response.ok) {
                  return await response.json()
                }
                return null
              },
              5 * 60 * 1000
            )
            url = (data as any)?.author_image?.url || null
            break
          }
          case 'publisher': {
            const data = await deduplicatedRequest(
              `entity-avatar-publisher-${id}`,
              async () => {
                const response = await fetch(`/api/publishers/${id}`)
                if (response.ok) {
                  return await response.json()
                }
                return null
              },
              5 * 60 * 1000
            )
            url = (data as any)?.publisher_image?.url || null
            break
          }
          case 'group': {
            const data = await deduplicatedRequest(
              `entity-avatar-group-${id}`,
              async () => {
                const response = await fetch(`/api/groups/${id}`)
                if (response.ok) {
                  return await response.json()
                }
                return null
              },
              5 * 60 * 1000
            )
            url = (data as any)?.group_image_url || null
            break
          }
          case 'event': {
            const data = await deduplicatedRequest(
              `entity-avatar-event-${id}`,
              async () => {
                const response = await fetch(`/api/events/${id}`)
                if (response.ok) {
                  const result = await response.json()
                  return result.data
                }
                return null
              },
              5 * 60 * 1000
            )
            // Events have cover_image_id, fetch image URL from images table
            if ((data as any)?.cover_image_id) {
              const imageId = (data as any).cover_image_id
              const imageData = await deduplicatedRequest(
                `entity-avatar-event-image-${imageId}`,
                async () => {
                  const response = await fetch(`/api/entity-images?entityId=${id}&entityType=event&albumType=event_cover_album`)
                  if (response.ok) {
                    const result = await response.json()
                    // Return first image or fetch from images table directly
                    if (result.images && result.images.length > 0) {
                      return result.images[0]
                    }
                    // Fallback: try to get image URL directly if we have image ID
                    // This would require a new API endpoint or we use the image ID
                    return null
                  }
                  return null
                },
                5 * 60 * 1000
              )
              url = (imageData as any)?.image_url || null
            }
            break
          }
          case 'book': {
            const data = await deduplicatedRequest(
              `entity-avatar-book-${id}`,
              async () => {
                const response = await fetch(`/api/books/${id}`)
                if (response.ok) {
                  const result = await response.json()
                  return result.data
                }
                return null
              },
              5 * 60 * 1000
            )
            url = (data as any)?.cover_image?.url || null
            break
          }
        }

        setAvatarUrl(url)
      } catch (error) {
        console.error(`Error fetching ${type} avatar:`, error)
        setAvatarUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAvatar()
  }, [type, id, src, currentUser])

  // Loading skeleton
  if (loading) {
    const sizeClasses = {
      xs: 'w-8 h-8',
      sm: 'w-10 h-10',
      md: 'w-24 h-24',
      lg: 'w-32 h-32',
    }
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse ${className || ''}`}
      />
    )
  }

  const avatar = (
    <Avatar src={avatarUrl || undefined} alt={name} name={name} size={size} className={className} />
  )

  if (disableHoverCard) {
    return avatar
  }

  if (type === 'user') {
    return (
      <UserHoverCard user={{ id, name, avatar_url: avatarUrl || undefined } as any} userStats={userStats}>
        {avatar}
      </UserHoverCard>
    )
  }

  return (
    <EntityHoverCard
      type={type}
      entity={{ id, name, avatar_url: avatarUrl || undefined } as any}
      showActions={false}
    >
      {avatar}
    </EntityHoverCard>
  )
}
