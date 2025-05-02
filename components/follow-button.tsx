"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { followEntity, unfollowEntity, isFollowing, getFollowTargetType } from '@/lib/follows'
import { Loader2 } from 'lucide-react'

interface FollowButtonProps {
  entityId: string | number
  targetType: 'user' | 'book' | 'author' | 'publisher'
  entityName?: string
  variant?: 'default' | 'outline'
  className?: string
  onFollowChange?: () => void
}

export function FollowButton({
  entityId,
  targetType,
  entityName,
  variant = 'default',
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const [isFollowingState, setIsFollowingState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function checkFollowStatus() {
      try {
        // Verify the target type exists
        const { type, error: typeError } = await getFollowTargetType(targetType)
        if (typeError || !type) {
          toast({
            title: 'Error',
            description: 'Invalid target type',
            variant: 'destructive'
          })
          return
        }

        const following = await isFollowing(entityId, targetType)
        setIsFollowingState(following)
      } catch (error) {
        console.error('Error checking follow status:', error)
        toast({
          title: 'Error',
          description: 'Failed to check follow status',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkFollowStatus()
  }, [entityId, targetType, toast])

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      const response = await followEntity(entityId, targetType)
      if (response.success) {
        setIsFollowingState(true)
        onFollowChange?.()
        toast({
          title: 'Success',
          description: `You are now following ${entityName || ''}`,
        })
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to follow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error following:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    setIsLoading(true)
    try {
      const response = await unfollowEntity(entityId, targetType)
      if (response.success) {
        setIsFollowingState(false)
        onFollowChange?.()
        toast({
          title: 'Success',
          description: `You have unfollowed ${entityName || ''}`,
        })
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to unfollow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error unfollowing:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Button variant={variant} disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      onClick={isFollowingState ? handleUnfollow : handleFollow}
      className={className}
    >
      {isFollowingState ? 'Unfollow' : 'Follow'}
    </Button>
  )
} 