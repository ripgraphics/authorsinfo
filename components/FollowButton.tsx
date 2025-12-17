'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { followEntity, unfollowEntity } from '@/app/actions/follow'
import { useToast } from '@/hooks/use-toast'
import { deduplicatedRequest } from '@/lib/request-utils'
import { useAuth } from '@/hooks/useAuth'

interface FollowButtonProps {
  entityId: string | number
  targetType: 'user' | 'book' | 'author' | 'publisher' | 'group'
  entityName?: string
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  showText?: boolean
  disabled?: boolean
}

// UUID validation function
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export default function FollowButton({
  entityId,
  targetType,
  entityName,
  className = '',
  variant = 'default',
  size = 'default',
  showIcon = true,
  showText = true,
  disabled = false
}: FollowButtonProps) {
  const [isFollowingState, setIsFollowingState] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false)
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  // Check if entityId is valid
  const isValidEntityId = useMemo(() => {
    if (typeof entityId === 'number') return true
    if (typeof entityId === 'string') {
      // Skip validation for special cases like "current-user"
      if (entityId === 'current-user') return false
      return isValidUUID(entityId)
    }
    return false
  }, [entityId])

  // Check if user is trying to follow themselves
  const isSelfFollow = useMemo(() => {
    if (!user || targetType !== 'user') return false
    if (typeof entityId === 'string' && entityId === user.id) return true
    if (typeof entityId === 'number' && entityId.toString() === user.id) return true
    return false
  }, [user, entityId, targetType])

  // Check initial follow status
  useEffect(() => {
    const checkFollowStatus = async () => {
      // Don't check follow status if targetType is undefined or entityId is invalid
      if (!targetType || !isValidEntityId) {
        setIsLoading(false)
        return
      }

      try {
        // Use deduplicated request for better performance
        const data = await deduplicatedRequest(
          `follow-status-${targetType}-${entityId}`,
          () => fetch(`/api/follow?entityId=${entityId}&targetType=${targetType}`).then(r => r.json()),
          1 * 60 * 1000 // 1 minute cache for follow status
        )
        
        if (data.isFollowing !== undefined) {
          setIsFollowingState(data.isFollowing || false)
        } else {
          console.error('Error checking follow status:', data.error)
          setIsFollowingState(false)
        }
      } catch (error) {
        console.error('Error checking follow status:', error)
        setIsFollowingState(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkFollowStatus()
  }, [entityId, targetType, isValidEntityId])

  const handleFollowToggle = useCallback(async () => {
    if (isActionLoading || disabled || !targetType || !isValidEntityId) return

    setIsActionLoading(true)
    
    try {
      let response
      
      if (isFollowingState) {
        response = await unfollowEntity(entityId, targetType)
      } else {
        response = await followEntity(entityId, targetType)
      }

      if (response.success) {
        // Capture the old state before updating for the toast message
        const wasFollowing = isFollowingState
        setIsFollowingState(!isFollowingState)
        
        // Create personalized toast message based on the action we just took
        let description: string
        if (entityName) {
          // Personalized message with entity name
          const entityTypeLabel = targetType === 'book' ? 'book' : 
                                 targetType === 'author' ? 'author' :
                                 targetType === 'publisher' ? 'publisher' :
                                 targetType === 'group' ? 'group' :
                                 targetType === 'user' ? 'user' : targetType
          
          description = wasFollowing 
            ? `You are no longer following the ${entityTypeLabel}: ${entityName}`
            : `You are now following the ${entityTypeLabel}: ${entityName}`
        } else {
          // Generic message when entity name is not provided
          description = wasFollowing 
            ? `You are no longer following this ${targetType}`
            : `You are now following this ${targetType}`
        }
        
        toast({
          title: wasFollowing ? 'Unfollowed' : 'Followed',
          description,
        })
      } else {
        // Handle authentication errors specifically
        if (response.error === 'Authentication required') {
          toast({
            title: 'Sign In Required',
            description: `Please sign in to follow ${targetType}s. Redirecting to login...`,
            variant: 'default',
          })
          // Redirect to login page with return URL
          setTimeout(() => {
            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
          }, 1500)
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Something went wrong',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      })
    } finally {
      setIsActionLoading(false)
    }
  }, [entityId, targetType, isFollowingState, isActionLoading, disabled, isValidEntityId, toast, router])

  // Memoize button text and icon to prevent unnecessary re-renders
  const { buttonText, ButtonIcon } = useMemo(() => ({
    buttonText: isFollowingState ? 'Unfollow' : 'Follow',
    ButtonIcon: isFollowingState ? UserMinus : UserPlus
  }), [isFollowingState])

  // Don't render the button if targetType is undefined, entityId is invalid, or user is trying to follow themselves
  if (!targetType || !isValidEntityId || isSelfFollow) {
    return null
  }

  // Show a more subtle loading state with skeleton effect
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} animate-pulse bg-gray-200 text-gray-400 border-gray-200 hover:bg-gray-200 hover:text-gray-400 transition-all duration-200`}
        disabled={true}
      >
        {showIcon && <div className="h-4 w-4 mr-2 bg-gray-300 rounded-sm animate-pulse" />}
        {showText && (
          <div className="bg-gray-300 h-4 w-12 rounded-sm animate-pulse" />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} transition-all duration-200`}
      onClick={handleFollowToggle}
      disabled={disabled || isActionLoading}
    >
      {isActionLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : showIcon ? (
        <ButtonIcon className="h-4 w-4 mr-2" />
      ) : null}
      {showText && buttonText}
    </Button>
  )
} 