/**
 * @deprecated This component is deprecated. Use EnterpriseEngagementActions instead.
 * 
 * This basic engagement actions component provides simple like/comment/share functionality.
 * It has been superseded by EnterpriseEngagementActions which provides:
 * - Reaction system with multiple reaction types
 * - Engagement context integration
 * - Advanced features (bookmark, view tracking, analytics)
 * - Better performance and state management
 * 
 * Migration: Replace imports from './engagement-actions' with './enterprise-engagement-actions'
 * and use EnterpriseEngagementActions component instead.
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  Zap,
  Send,
  X,
  ChevronDown,
  ThumbsUp,
  Smile,
  Image as ImageIcon,
  Share2,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import EntityAvatar from '@/components/entity-avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface EngagementActionsProps {
  entityId: string
  entityType: 'user' | 'book' | 'author' | 'publisher' | 'group' | 'activity'
  initialEngagementCount?: number
  commentCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isPremium?: boolean
  monetization?: {
    type: 'subscription' | 'pay_per_view' | 'freemium'
    price?: number
    currency?: string
  }
  onEngagement?: (
    action: 'like' | 'comment' | 'share',
    entityId: string,
    entityType: string
  ) => Promise<void>
  onCommentAdded?: (comment: any) => void
  className?: string
}

/**
 * @deprecated Use EnterpriseEngagementActions instead
 */
export function EngagementActions({
  entityId,
  entityType,
  initialEngagementCount = 0,
  commentCount = 0,
  isLiked = false,
  isCommented = false,
  isPremium = false,
  monetization,
  onEngagement,
  onCommentAdded,
  className = '',
}: EngagementActionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const currentUserName = (user as any)?.name || (user as any)?.user_metadata?.full_name || (user as any)?.email || 'User'

  // State for engagement data
  const [engagementCount, setEngagementCount] = useState(initialEngagementCount)
  const [commentCountState, setCommentCountState] = useState(commentCount)
  const [isLikedState, setLikedState] = useState(isLiked)
  const [isCommentedState, setCommentedState] = useState(isCommented)
  const [loading, setLoading] = useState<'like' | 'comment' | null>(null)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Fetch engagement data function - REMOVED - using built-in counts from activities table
  const fetchEngagementData = useCallback(async () => {
    // Since engagement counts are now built into the activities table,
    // we don't need to make a separate API call
    console.log('✅ Using built-in engagement counts from activities table')

    // The engagement counts should come from the parent component
    // This function is now a no-op since we're using direct data
  }, [entityId, entityType])

  // Use engagement counts directly from props instead of API calls
  useEffect(() => {
    // If we have engagement counts passed as props, use them
    if (engagementCount !== undefined && commentCount !== undefined) {
      console.log('✅ Using engagement counts from props:', { engagementCount, commentCount })
      return
    }

    // Otherwise, try to get them from the parent component's data
    // This is a fallback for when the component is used standalone
    console.log('ℹ️ No engagement counts provided, component will show 0 counts')
  }, [engagementCount, commentCount])

  // Update state when props change (important for page refresh)
  useEffect(() => {
    console.log('🔄 Props updated - updating component state:', {
      initialEngagementCount,
      commentCount,
      isLiked,
    })

    setEngagementCount(initialEngagementCount || 0)
    setCommentCountState(commentCount || 0)
    setLikedState(isLiked || false)
    setCommentedState(isCommented || false)
  }, [initialEngagementCount, commentCount, isLiked, isCommented])

  // Handle like/unlike action
  const handleEngagement = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      })
      return
    }

    setLoading('like')

    try {
      const response = await fetch('/api/engagement/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const wasLiked = isLikedState
        setLikedState(!wasLiked)
        setEngagementCount((prev) => (wasLiked ? prev - 1 : prev + 1))

        if (onEngagement) {
          await onEngagement('like', entityId, entityType)
        }

        toast({
          title: wasLiked ? 'Unliked' : 'Liked',
          description: wasLiked ? 'You unliked this post' : 'You liked this post',
        })
      } else {
        throw new Error(data.error || 'Failed to toggle like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: 'Error',
        description: 'Failed to toggle like. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }, [entityId, entityType, isLikedState, user, toast, onEngagement])

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!user || !commentText.trim()) return

    setIsSubmittingComment(true)

    try {
      const response = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: commentText.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCommentText('')
        setShowCommentInput(false)
        setCommentCountState((prev) => prev + 1)
        setCommentedState(true)

        if (onCommentAdded) {
          onCommentAdded(data.comment)
        }

        if (onEngagement) {
          await onEngagement('comment', entityId, entityType)
        }

        toast({
          title: 'Comment posted',
          description: 'Your comment has been added',
        })
      } else {
        throw new Error(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }, [entityId, entityType, commentText, user, toast, onCommentAdded, onEngagement])

  // Handle share action
  const handleShare = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to share posts',
        variant: 'destructive',
      })
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check this out!',
          text: 'I found this interesting post',
          url: window.location.href,
        })

        if (onEngagement) {
          await onEngagement('share', entityId, entityType)
        }
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: 'Link copied',
          description: 'Link copied to clipboard',
        })

        if (onEngagement) {
          await onEngagement('share', entityId, entityType)
        }
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }, [entityId, entityType, user, toast, onEngagement])

  return (
    <div className={`engagement-actions-container ${className}`}>
      {/* Engagement Stats Bar */}
      <div className="engagement-stats-bar flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="engagement-stats flex items-center gap-4 text-sm text-gray-600">
          {engagementCount > 0 && (
            <div className="engagement-count flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span>{engagementCount}</span>
            </div>
          )}
          {commentCountState > 0 && (
            <div className="comment-count flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{commentCountState}</span>
            </div>
          )}
        </div>
      </div>

      {/* Engagement Action Buttons */}
      <div className="engagement-action-buttons flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEngagement}
          disabled={loading === 'like'}
          className={cn(
            'engagement-action-button flex-1 h-10 rounded-lg transition-colors',
            isLikedState
              ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
          )}
        >
          <ThumbsUp className={cn('h-5 w-5 mr-2', isLikedState && 'fill-current')} />
          <span className="engagement-action-label">Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCommentInput(!showCommentInput)}
          disabled={loading === 'comment'}
          className="engagement-action-button flex-1 h-10 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          <span className="engagement-action-label">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleShare}
          className="engagement-action-button flex-1 h-10 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="h-5 w-5 mr-2" />
          <span className="engagement-action-label">Share</span>
        </Button>
      </div>

      {/* Comment Input Section */}
      {showCommentInput && (
        <div className="engagement-comment-input px-4 py-3 border-t border-gray-100">
          <div className="engagement-comment-input-container flex items-start gap-3">
            {/* User Avatar */}
            <div className="engagement-comment-avatar flex-shrink-0">
              <EntityAvatar
                type="user"
                id={user?.id || 'current-user'}
                name={currentUserName}
                size="sm"
                className="w-8 h-8"
              />
            </div>

            {/* Comment Input Area */}
            <div className="engagement-comment-input-area flex-1 space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[80px] resize-none"
                disabled={isSubmittingComment}
              />
              <div className="engagement-comment-actions flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false)
                    setCommentText('')
                  }}
                  disabled={isSubmittingComment}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
