'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, UserMinus, UserPlus, Clock, Loader2, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import FollowButton from '@/components/FollowButton'
import { unfollowEntity } from '@/app/actions/follow'
import { cn } from '@/lib/utils'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ResponsiveActionButton } from '@/components/ui/responsive-action-button'

function OwnCardDropdown({
  entityId,
  entityType,
  onRemoveSelf,
  containerClass,
  variant,
  size,
}: {
  entityId: string
  entityType: 'book' | 'author' | 'publisher' | 'user' | 'group'
  onRemoveSelf?: () => void
  containerClass: string
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [isUnfollowing, setIsUnfollowing] = useState(false)

  const handleUnfollow = async () => {
    if (isUnfollowing) return
    try {
      setIsUnfollowing(true)
      const result = await unfollowEntity(entityId, entityType)
      if (result.success) {
        toast({ title: 'Unfollowed', description: 'You have been removed from this list.' })
        onRemoveSelf?.()
        router.refresh()
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to unfollow', variant: 'destructive' })
      }
    } catch (e) {
      console.error('Error unfollowing:', e)
      toast({ title: 'Error', description: 'Failed to unfollow', variant: 'destructive' })
    } finally {
      setIsUnfollowing(false)
    }
  }

  return (
    <div className={containerClass}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="ml-auto" disabled={isUnfollowing}>
            {isUnfollowing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer" onClick={handleUnfollow} disabled={isUnfollowing}>
            Unfollow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface UserActionButtonsProps {
  userId: string
  userName?: string
  userPermalink?: string
  orientation?: 'horizontal' | 'vertical'
  showMessage?: boolean
  showFriend?: boolean
  showFollow?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
  onFriendChange?: () => void
  onFollowChange?: () => void
  compact?: boolean
  /** When viewing own card in a list (e.g. followers), pass entity to allow "Unfollow" in dropdown */
  removeSelfEntity?: { entityId: string; entityType: 'book' | 'author' | 'publisher' | 'user' | 'group' }
  onRemoveSelf?: () => void
}

export function UserActionButtons({
  userId,
  userName,
  userPermalink,
  orientation = 'horizontal',
  showMessage = true,
  showFriend = true,
  showFollow = true,
  size = 'sm',
  variant = 'outline',
  className,
  onFriendChange,
  onFollowChange: _onFollowChange,
  compact = false,
  removeSelfEntity,
  onRemoveSelf,
}: UserActionButtonsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isRemovingFriend, setIsRemovingFriend] = useState(false)
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>(
    'none'
  )
  const [isRequestedByMe, setIsRequestedByMe] = useState(false)
  const [isCheckingFriend, setIsCheckingFriend] = useState(true)

  const redirectTarget = useMemo(() => {
    const path = pathname || '/'
    const search = searchParams?.toString()
    return search ? `${path}?${search}` : path
  }, [pathname, searchParams])

  const containerClass = cn(
    'flex gap-2 items-center',
    orientation === 'vertical' ? 'flex-col' : 'flex-row',
    className
  )

  // Check friend status
  useEffect(() => {
    if (!user || user.id === userId || !showFriend) {
      setIsCheckingFriend(false)
      return
    }

    const checkFriendStatus = async () => {
      try {
        const response = await fetch(`/api/friends?targetUserId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setFriendStatus(data.status || 'none')
          setIsRequestedByMe(data.isRequestedByMe || false)
        }
      } catch (error) {
        console.error('Error checking friend status:', error)
      } finally {
        setIsCheckingFriend(false)
      }
    }

    checkFriendStatus()
  }, [userId, user, showFriend])

  if (!user) {
    const handleSignIn = () => {
      const redirectParam = redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''
      router.push(`/login${redirectParam}`)
    }

    return (
      <div className={containerClass}>
        <Button variant="default" size={size} onClick={handleSignIn}>
          Sign in to interact
        </Button>
      </div>
    )
  }

  // Own card in a list (e.g. followers): show dropdown with "Unfollow" to remove self
  if (user.id === userId && removeSelfEntity) {
    return (
      <OwnCardDropdown
        entityId={removeSelfEntity.entityId}
        entityType={removeSelfEntity.entityType}
        onRemoveSelf={onRemoveSelf}
        containerClass={containerClass}
        variant={variant}
        size={size}
      />
    )
  }

  // Don't show buttons if viewing own profile (no removeSelfEntity)
  if (user.id === userId) {
    return null
  }

  const handleRemoveFriend = async () => {
    try {
      setIsRemovingFriend(true)
      const response = await fetch(`/api/friends?friendId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFriendStatus('none')
        toast({
          title: 'Friend removed',
          description: `${userName || 'Friend'} has been removed from your list`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove friend',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      })
    } finally {
      setIsRemovingFriend(false)
    }
  }

  const handleAddFriend = async () => {
    if (isAddingFriend) return

    try {
      setIsAddingFriend(true)
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: userId }),
      })

      const data = await response.json()

      if (response.ok) {
        setFriendStatus('pending')
        setIsRequestedByMe(true)
        toast({
          title: 'Friend request sent!',
          description: `Friend request sent to ${userName || 'user'}`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send friend request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      })
    } finally {
      setIsAddingFriend(false)
    }
  }

  const handleCancelRequest = async () => {
    try {
      setIsRemovingFriend(true)
      // Find and delete the pending friend request
      const response = await fetch(`/api/friends?friendId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFriendStatus('none')
        setIsRequestedByMe(false)
        toast({
          title: 'Request cancelled',
          description: `Friend request to ${userName || 'user'} has been cancelled`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel friend request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel friend request',
        variant: 'destructive',
      })
    } finally {
      setIsRemovingFriend(false)
    }
  }

  return (
    <div className={containerClass}>
      {showMessage && (
        <ResponsiveActionButton
          icon={<MessageCircle className="h-4 w-4" />}
          label="Message"
          tooltip="Message"
          compact={compact}
          href={`/messages/${userPermalink || userId}`}
          variant="default"
          size={size}
        />
      )}

      {showFriend && (
        <>
          {isCheckingFriend ? (
            <Button variant={variant} size={size} disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : friendStatus === 'accepted' ? (
            <ResponsiveActionButton
              icon={
                isRemovingFriend ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4" />
                )
              }
              label={isRemovingFriend ? 'Removing...' : 'Friends'}
              tooltip={isRemovingFriend ? 'Removing...' : 'Friends'}
              compact={compact}
              variant={variant}
              size={size}
              onClick={handleRemoveFriend}
              disabled={isRemovingFriend}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            />
          ) : friendStatus === 'pending' ? (
            isRequestedByMe ? (
              <ResponsiveActionButton
                icon={
                  isRemovingFriend ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )
                }
                label={isRemovingFriend ? 'Cancelling...' : 'Cancel Request'}
                tooltip={isRemovingFriend ? 'Cancelling...' : 'Cancel Request'}
                compact={compact}
                variant={variant}
                size={size}
                onClick={handleCancelRequest}
                disabled={isRemovingFriend}
              />
            ) : (
              <Button variant={variant} size={size} disabled title="Request Received">
                {compact ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Request Received
                  </>
                )}
              </Button>
            )
          ) : (
            <ResponsiveActionButton
              icon={
                isAddingFriend ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )
              }
              label={isAddingFriend ? 'Adding...' : 'Add Friend'}
              tooltip={isAddingFriend ? 'Adding...' : 'Add Friend'}
              compact={compact}
              variant={variant}
              size={size}
              onClick={handleAddFriend}
              disabled={isAddingFriend}
            />
          )}
        </>
      )}

      {showFollow && (
        <FollowButton
          entityId={userId}
          targetType="user"
          entityName={userName}
          variant={variant}
          size={size}
          showIcon={true}
          showText={!compact}
        />
      )}

      {/* More options dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="ml-auto">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="cursor-pointer">
            Report User
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-destructive">
            Block User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
