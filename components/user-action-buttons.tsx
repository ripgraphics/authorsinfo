'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, UserMinus, UserPlus, Check, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import FollowButton from '@/components/FollowButton'
import { cn } from '@/lib/utils'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

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
  onFollowChange
}: UserActionButtonsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isRemovingFriend, setIsRemovingFriend] = useState(false)
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none')
  const [isRequestedByMe, setIsRequestedByMe] = useState(false)
  const [isCheckingFriend, setIsCheckingFriend] = useState(true)

  const redirectTarget = useMemo(() => {
    const path = pathname || '/'
    const search = searchParams?.toString()
    return search ? `${path}?${search}` : path
  }, [pathname, searchParams])

  const containerClass = cn(
    'flex gap-2',
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

  // Don't show buttons if viewing own profile
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
          title: "Friend removed",
          description: `${userName || 'Friend'} has been removed from your list`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: "Error",
          description: "Failed to remove friend",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error removing friend:', error)
      toast({
        title: "Error",
        description: "Failed to remove friend",
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
          title: "Friend request sent!",
          description: `Friend request sent to ${userName || 'user'}`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to send friend request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast({
        title: "Error",
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
          title: "Request cancelled",
          description: `Friend request to ${userName || 'user'} has been cancelled`,
        })
        onFriendChange?.()
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel friend request",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: 'destructive',
      })
    } finally {
      setIsRemovingFriend(false)
    }
  }

  return (
    <div className={containerClass}>
      {showMessage && (
        <Button
          variant={variant}
          size={size}
          asChild
        >
          <Link href={`/messages/${userPermalink || userId}`}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Link>
        </Button>
      )}

      {showFriend && (
        <>
          {isCheckingFriend ? (
            <Button
              variant={variant}
              size={size}
              disabled
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : friendStatus === 'accepted' ? (
            <Button
              variant={variant}
              size={size}
              onClick={handleRemoveFriend}
              disabled={isRemovingFriend}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isRemovingFriend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Friends
                </>
              )}
            </Button>
          ) : friendStatus === 'pending' ? (
            isRequestedByMe ? (
              <Button
                variant={variant}
                size={size}
                onClick={handleCancelRequest}
                disabled={isRemovingFriend}
              >
                {isRemovingFriend ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Cancel Request
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant={variant}
                size={size}
                disabled
                title="Request Received"
              >
                <Clock className="h-4 w-4 mr-2" />
                Request Received
              </Button>
            )
          ) : (
            <Button
              variant={variant}
              size={size}
              onClick={handleAddFriend}
              disabled={isAddingFriend}
            >
              {isAddingFriend ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Friend
                </>
              )}
            </Button>
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
          showText={false}
        />
      )}
    </div>
  )
}

