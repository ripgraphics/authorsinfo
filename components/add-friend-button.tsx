'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, Check, Clock, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface AddFriendButtonProps {
  targetUserId: string
  targetUserName?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  compact?: boolean
}

type FriendStatus = 'none' | 'pending' | 'accepted' | 'rejected'

export function AddFriendButton({
  targetUserId,
  targetUserName = 'this user',
  className = '',
  variant = 'default',
  size = 'default',
  compact = false,
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

  const renderButton = (icon: React.ReactNode, text: string, disabled: boolean, onClick?: () => void) => {
    if (compact) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={variant}
                size={size === 'sm' ? 'icon' : size}
                className={`h-9 w-9 ${className}`}
                disabled={disabled}
                onClick={onClick}
              >
                {icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {icon}
        <span className="ml-2">{text}</span>
      </Button>
    )
  }

  if (isChecking) {
    return renderButton(
      <Loader2 className="h-4 w-4 animate-spin" />,
      'Loading...',
      true
    )
  }

  // Don't show button if already friends
  if (status === 'accepted') {
    return renderButton(
      <Check className="h-4 w-4" />,
      'Friends',
      true
    )
  }

  // Show pending status if request is pending
  if (isPending) {
    return renderButton(
      <Clock className="h-4 w-4" />,
      isRequestedByMe ? 'Request Sent' : 'Request Received',
      true
    )
  }

  return renderButton(
    isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <UserPlus className="h-4 w-4" />
    ),
    'Add Friend',
    isLoading,
    handleAddFriend
  )
}
