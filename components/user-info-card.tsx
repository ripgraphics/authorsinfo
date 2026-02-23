'use client'

import React, { useState, useEffect } from 'react'
import EntityAvatar from '@/components/entity-avatar'
import EntityName from '@/components/entity-name'
import { UserActionButtons } from '@/components/user-action-buttons'
import { cn } from '@/lib/utils'

export interface UserInfoCardProps {
  userId: string
  userName: string
  userAvatarUrl?: string | null
  userPermalink?: string
  className?: string
  containerClassName?: string
  avatarSize?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  showFriend?: boolean
  showFollow?: boolean
  onFriendChange?: () => void
  // new props
  mutualFriendsCount?: number
  reactionType?: string | null
  reactionTypes?: string[]
}

const getReactionEmoji = (type: string) =>
  type === 'love' ? '❤️' :
  type === 'like' ? '👍' :
  type === 'care' ? '🤗' :
  type === 'haha' ? '😂' :
  type === 'wow' ? '😮' :
  type === 'sad' ? '😢' :
  type === 'angry' ? '😠' : '👍'

const REACTION_DISPLAY_ORDER = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'] as const

/**
 * Fully reusable user card component that displays:
 * - User avatar
 * - User name
 * - Smart action buttons (Message if friend, Add Friend otherwise)
 *
 * Used in lists, modals, and other contexts where you need a user card.
 */
export function UserInfoCard({
  userId,
  userName,
  userAvatarUrl,
  userPermalink,
  className,
  containerClassName,
  avatarSize = 'md',
  showMessage = true,
  showFriend = true,
  showFollow = false,
  onFriendChange,
  mutualFriendsCount,
  reactionType,
  reactionTypes = [],
}: UserInfoCardProps) {
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>(
    'none'
  )
  const [isCheckingFriend, setIsCheckingFriend] = useState(true)

  // Check friend status on mount
  useEffect(() => {
    if (!showMessage && !showFriend) {
      setIsCheckingFriend(false)
      return
    }

    const checkFriendStatus = async () => {
      try {
        const response = await fetch(`/api/friends?targetUserId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setFriendStatus(data.status || 'none')
        }
      } catch (error) {
        console.error('Error checking friend status:', error)
      } finally {
        setIsCheckingFriend(false)
      }
    }

    checkFriendStatus()
  }, [userId, showMessage, showFriend])

  // Determine which action button to show based on friend status
  const showFriendButton = showFriend && friendStatus !== 'accepted'
  const showMessageButton = showMessage && friendStatus === 'accepted'
  const sortedReactionTypes = reactionTypes
    .filter((type, index, arr) => arr.indexOf(type) === index)
    .sort((a, b) => {
      const aIndex = REACTION_DISPLAY_ORDER.indexOf(a as (typeof REACTION_DISPLAY_ORDER)[number])
      const bIndex = REACTION_DISPLAY_ORDER.indexOf(b as (typeof REACTION_DISPLAY_ORDER)[number])
      const normalizedAIndex = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
      const normalizedBIndex = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex
      return normalizedAIndex - normalizedBIndex
    })

  return (
    <div
      className={cn(
        'user-info-card',
        'flex items-center gap-3 p-3 sm:p-4 hover:bg-accent/50 rounded-xl transition-all duration-200 border border-border hover:border-input',
        containerClassName
      )}
    >
      {/* User Avatar */}
      <div className={cn('user-info-card__avatar-container', 'relative flex-shrink-0')}>
        <div className={cn('user-info-card__avatar-wrapper', 'relative')}>
        <EntityAvatar
          type="user"
          id={userId}
          name={userName}
          src={userAvatarUrl}
          size={avatarSize}
        />
        {reactionType && (
          <div className={cn('user-info-card__reaction-badge', 'absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm')}>
            <span className={cn('user-info-card__reaction-emoji', 'text-xs')}>
              {getReactionEmoji(reactionType)}
            </span>
          </div>
        )}
      </div>
      </div>

      {/* User Info */}
      <div className={cn('user-info-card__info-container', 'flex-1 min-w-0', className)}>
        <EntityName
          type="user"
          id={userId}
          name={userName}
          avatar_url={userAvatarUrl}
          permalink={userPermalink}
          className={cn('user-info-card__name', 'text-sm font-semibold text-foreground block truncate')}
          showActions={false}
        />
        {mutualFriendsCount !== undefined && (
          <p className={cn('user-info-card__mutual-friends', 'text-xs text-muted-foreground mt-1')}>
            {mutualFriendsCount === 1 ? '1 mutual friend' : `${mutualFriendsCount} mutual friends`}
          </p>
        )}
        {sortedReactionTypes.length > 0 && (
          <div className={cn('user-info-card__reaction-types', 'mt-1 flex items-center gap-1')}>
            {sortedReactionTypes.map((type) => (
              <span key={type} className={cn('user-info-card__reaction-type-emoji', 'text-sm leading-none')} title={type}>
                {getReactionEmoji(type)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* User Action Buttons */}
      <div className={cn('user-info-card__actions-container', 'flex-shrink-0')}>
        {!isCheckingFriend && (
          <UserActionButtons
            userId={userId}
            userName={userName}
            userPermalink={userPermalink}
            showMessage={showMessageButton}
            showFriend={showFriendButton}
            showFollow={showFollow}
            size="sm"
            variant="outline"
            orientation="horizontal"
            compact={true}
            onFriendChange={() => {
              setFriendStatus('pending')
              onFriendChange?.()
            }}
          />
        )}
      </div>
    </div>
  )
}
