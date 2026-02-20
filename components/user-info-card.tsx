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
}

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

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 sm:p-4 hover:bg-accent/50 rounded-xl transition-all duration-200 border border-border hover:border-input',
        containerClassName
      )}
    >
      {/* User Avatar */}
      <div className="relative flex-shrink-0">
        <EntityAvatar
          type="user"
          id={userId}
          name={userName}
          src={userAvatarUrl}
          size={avatarSize}
        />
      </div>

      {/* User Info */}
      <div className={cn('flex-1 min-w-0', className)}>
        <EntityName
          type="user"
          id={userId}
          name={userName}
          avatar_url={userAvatarUrl}
          permalink={userPermalink}
          className="text-sm font-semibold text-foreground block truncate"
          showActions={false}
        />
      </div>

      {/* User Action Buttons */}
      <div className="flex-shrink-0">
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
