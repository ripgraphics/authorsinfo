'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Check, Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

interface AddFriendButtonProps {
  targetUserId: string
  targetUserName?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

type FriendStatus = 'none' | 'pending' | 'accepted' | 'rejected'

export function AddFriendButton({
  targetUserId,
  targetUserName = 'this user',
  className = '',
  variant = 'default',
  size = 'default',
}: AddFriendButtonProps) {
  const [status, setStatus] = useState<FriendStatus>('none')
  const [isPending, setIsPending] = useState(false)
  const [isRequestedByMe, setIsRequestedByMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const { user } = useAuth()
  const { toast } = useToast()

  const checkFriendStatus = useCallback(async () => {
    try {
      setIsChecking(true)
      const response = await fetch(`/api/friends?targetUserId=${targetUserId}`)

      if (response.ok) {
        const data = await response.json()
        setStatus(data.status)
        setIsPending(data.isPending)
        setIsRequestedByMe(data.isRequestedByMe)
      }
    } catch (error) {
      console.error('Error checking friend status:', error)
    } finally {
      setIsChecking(false)
    }
  }, [targetUserId])

  useEffect(() => {
    checkFriendStatus()
  }, [checkFriendStatus])

  const handleAddFriend = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('pending')
        setIsPending(true)
        setIsRequestedByMe(true)
        toast({
          title: 'Friend request sent!',
          description: `Friend request sent to ${targetUserName}`,
        })
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
      setIsLoading(false)
    }
  }

  // Don't show button if user is viewing their own profile
  if (!user || user.id === targetUserId) {
    return null
  }

  if (isChecking) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  // Don't show button if already friends
  if (status === 'accepted') {
    return (
      <Button variant="outline" size={size} className={className} disabled>
        <Check className="h-4 w-4 mr-2" />
        Friends
      </Button>
    )
  }

  // Show pending status if request is pending
  if (isPending) {
    return (
      <Button variant="outline" size={size} className={className} disabled>
        <Clock className="h-4 w-4 mr-2" />
        {isRequestedByMe ? 'Request Sent' : 'Request Received'}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddFriend}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      Add Friend
    </Button>
  )
}
