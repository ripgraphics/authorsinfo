/**
 * Enterprise Engagement Actions Component
 * 
 * This is the primary and recommended engagement actions component for the application.
 * It provides comprehensive engagement features including:
 * - Multiple reaction types (like, love, laugh, etc.)
 * - Engagement context integration
 * - Comment system
 * - Share functionality
 * - Bookmark support
 * - View tracking
 * - Analytics (optional)
 * - Customizable variants and features
 * 
 * Use this component instead of EngagementActions or EnhancedEngagementActions.
 * 
 * @example
 * ```tsx
 * <EnterpriseEngagementActions
 *   entityId={post.id}
 *   entityType="post"
 *   initialEngagementCount={post.like_count}
 *   commentCount={post.comment_count}
 *   isLiked={post.is_liked}
 *   variant="default"
 *   enableQuickReactions={true}
 * />
 * ```
 */

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Bookmark,
  MoreHorizontal,
  Users,
  BarChart3,
  Star,
  AlertTriangle,
  Loader2,
  Angry,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { REACTION_OPTIONS_METADATA } from '@/lib/engagement/config'
import { useEntityEngagement, EntityType, ReactionType, EngagementState } from '@/contexts/engagement-context'
import {
  EnterpriseReactionPopup,
  QuickReactionButton,
  ReactionSummary,
} from './enterprise-reaction-popup'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Avatar } from '@/components/ui/avatar'

// ============================================================================
// ENTERPRISE-GRADE TYPE DEFINITIONS
// ============================================================================

export interface EnterpriseEngagementActionsProps {
  entityId: string
  entityType: EntityType
  initialEngagementCount?: number
  commentCount?: number
  shareCount?: number
  bookmarkCount?: number
  viewCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isShared?: boolean
  isBookmarked?: boolean
  isViewed?: boolean
  isPremium?: boolean
  currentReaction?: ReactionType | null
  monetization?: {
    type: 'subscription' | 'pay_per_view' | 'freemium'
    price?: number
    currency?: string
  }
  onEngagement?: (
    action: 'reaction' | 'comment' | 'share' | 'bookmark' | 'view',
    entityId: string,
    entityType: EntityType,
    reactionType?: ReactionType
  ) => Promise<void>
  onCommentAdded?: (comment: any) => void
  onShare?: (entityId: string, entityType: EntityType) => Promise<void>
  onBookmark?: (entityId: string, entityType: EntityType) => Promise<void>
  className?: string
  variant?: 'default' | 'compact' | 'detailed' | 'minimal'
  showReactionCounts?: boolean
  showCommentInput?: boolean
  showShareOptions?: boolean
  showBookmarkOptions?: boolean
  showViewTracking?: boolean
  showAnalytics?: boolean
  maxVisibleReactions?: number
  reactionPopupPosition?: 'top' | 'bottom' | 'left' | 'right'
  autoTrackViews?: boolean
  enableQuickReactions?: boolean
  showReactionSummary?: boolean
  customReactionIcons?: Partial<Record<ReactionType, React.ReactNode>>
  customColors?: Partial<Record<ReactionType, { color: string; bgColor: string }>>
  onCommentClick?: () => void
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnterpriseEngagementActions({
  entityId,
  entityType,
  initialEngagementCount = 0,
  commentCount = 0,
  shareCount = 0,
  bookmarkCount = 0,
  viewCount = 0,
  isLiked = false,
  isCommented = false,
  isShared = false,
  isBookmarked = false,
  isViewed = false,
  isPremium = false,
  currentReaction = null,
  monetization,
  onEngagement,
  onCommentAdded,
  onShare,
  onBookmark,
  className = '',
  variant = 'default',
  showReactionCounts = true,
  showCommentInput = true,
  showShareOptions = true,
  showBookmarkOptions = true,
  showViewTracking = true,
  showAnalytics = false,
  maxVisibleReactions = 5,
  reactionPopupPosition = 'bottom',
  autoTrackViews = true,
  enableQuickReactions = true,
  showReactionSummary = true,
  customReactionIcons,
  customColors,
  onCommentClick,
}: EnterpriseEngagementActionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Use the enterprise engagement context
  const {
    engagement,
    setReaction,
    addComment,
    shareEntity,
    bookmarkEntity,
    viewEntity,
    currentReaction: contextReaction,
    stats,
    batchUpdateEngagement,
  } = useEntityEngagement(entityId, entityType)

  // Local state
  const [showReactionPopup, setShowReactionPopup] = useState(false)
  const [isCommentInputVisible, setIsCommentInputVisible] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false)
  const [reactionPopupPositionState, setReactionPopupPositionState] =
    useState(reactionPopupPosition)

  // Refs
  const reactionButtonRef = useRef<HTMLButtonElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasTrackedViewRef = useRef<boolean>(false)

  // ============================================================================
  // EFFECTS AND INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (!autoTrackViews || hasTrackedViewRef.current) return
    if (engagement?.userHasViewed) {
      hasTrackedViewRef.current = true
      return
    }
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          hasTrackedViewRef.current = true
          viewEntity()
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoTrackViews, engagement?.userHasViewed, viewEntity])

  useEffect(() => {
    if (isCommentInputVisible && commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }, [isCommentInputVisible])

  // Sync initial prop engagement data to global context to ensure baselines for optimistic updates
  useEffect(() => {
    const updates: Partial<EngagementState> = {}

    // Sync current reaction
    if (currentReaction && !contextReaction) {
      updates.userReaction = currentReaction
    }

    // Sync comment count baseline if context is empty/zero
    if (commentCount > 0 && (!stats || stats.commentCount === 0)) {
      updates.commentCount = commentCount
    }

    // Sync reaction count baseline if context is empty/zero
    if (initialEngagementCount > 0 && (!stats || stats.reactionCount === 0)) {
      updates.reactionCount = initialEngagementCount
    }

    if (Object.keys(updates).length > 0) {
      batchUpdateEngagement([
        {
          entityId,
          entityType,
          updates,
        },
      ])
    }
  }, [
    currentReaction,
    contextReaction,
    commentCount,
    initialEngagementCount,
    stats,
    entityId,
    entityType,
    batchUpdateEngagement
  ])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleReactionButtonHover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // Determine optimal popup position
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow < 120 && spaceAbove > 120) {
      setReactionPopupPositionState('top')
    } else {
      setReactionPopupPositionState('bottom')
    }

    setShowReactionPopup(true)
  }, [])

  const handleReactionButtonLeave = useCallback(() => {
    // Small delay to allow moving mouse to popup
    setTimeout(() => {
      if (!showReactionPopup) return

      // Check if mouse is over the popup
      const popup = document.querySelector('[data-reaction-popup]')
      if (popup && popup.matches(':hover')) return

      setShowReactionPopup(false)
    }, 100)
  }, [showReactionPopup])

  const handleReactionSelect = useCallback(
    async (reactionType: ReactionType) => {
      try {
        const success = await setReaction(reactionType)

        if (success) {
          if (onEngagement) {
            await onEngagement('reaction', entityId, entityType, reactionType)
          }

          // Auto-close popup after successful reaction
          setTimeout(() => setShowReactionPopup(false), 500)
        }
      } catch (error) {
        console.error('Error setting reaction:', error)
      }
    },
    [setReaction, onEngagement, entityId, entityType]
  )

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please enter a comment',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingComment(true)

    try {
      const success = await addComment(commentText.trim())

      if (success) {
        if (onCommentAdded) {
          onCommentAdded({
            id: `comment-${Date.now()}`,
            content: commentText.trim(),
            created_at: new Date().toISOString(),
            user: {
              id: user?.id || '',
              name: (user as any)?.name || user?.user_metadata?.full_name || user?.email || 'User',
              avatar_url: (user as any)?.avatar_url || null,
            },
          })
        }

        if (onEngagement) {
          await onEngagement('comment', entityId, entityType)
        }

        setCommentText('')
        setIsCommentInputVisible(false)

        toast({
          title: 'Comment posted!',
          description: 'Your comment has been added',
          variant: 'default',
        })
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
  }, [commentText, addComment, onCommentAdded, onEngagement, entityId, entityType, user, toast])

  const handleShare = useCallback(async () => {
    try {
      const success = await shareEntity()

      if (success) {
        if (onShare) {
          await onShare(entityId, entityType)
        }

        if (onEngagement) {
          await onEngagement('share', entityId, entityType)
        }

        setShowShareMenu(false)

        toast({
          title: 'Content shared!',
          description: 'Your share has been recorded',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error sharing content:', error)
      toast({
        title: 'Error',
        description: 'Failed to share content. Please try again.',
        variant: 'destructive',
      })
    }
  }, [shareEntity, onShare, onEngagement, entityId, entityType, toast])

  const handleBookmark = useCallback(async () => {
    try {
      const success = await bookmarkEntity()

      if (success) {
        if (onBookmark) {
          await onBookmark(entityId, entityType)
        }

        if (onEngagement) {
          await onEngagement('bookmark', entityId, entityType)
        }

        setShowBookmarkMenu(false)

        const isBookmarked = engagement?.userHasBookmarked
        toast({
          title: isBookmarked ? 'Bookmark removed' : 'Bookmarked!',
          description: isBookmarked
            ? 'Content removed from bookmarks'
            : 'Content added to your bookmarks',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error bookmarking content:', error)
      toast({
        title: 'Error',
        description: 'Failed to bookmark content. Please try again.',
        variant: 'destructive',
      })
    }
  }, [
    bookmarkEntity,
    onBookmark,
    onEngagement,
    entityId,
    entityType,
    engagement?.userHasBookmarked,
    toast,
  ])

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatCount = useCallback((count: number, label: string) => {
    if (count === 0) return ''
    if (count === 1) return `1 ${label}`
    if (count < 1000) return `${count} ${label}s`
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K ${label}s`
    return `${(count / 1000000).toFixed(1)}M ${label}s`
  }, [])

  const getCurrentReactionDisplay = useCallback(() => {
    const reaction = contextReaction || currentReaction
    if (!reaction)
      return { icon: <ThumbsUp className="h-5 w-5" />, color: 'text-gray-600', label: 'Like' }

    // Case-insensitive match to handle inconsistent server response casings
    const reactionOption = REACTION_OPTIONS.find(
      (r) => r.type.toLowerCase() === reaction.toLowerCase()
    )
    if (!reactionOption)
      return { icon: <ThumbsUp className="h-5 w-5" />, color: 'text-gray-600', label: 'Like' }

    return {
      icon: customReactionIcons?.[reaction] || reactionOption.icon,
      color: customColors?.[reaction]?.color || reactionOption.color,
      label: reactionOption.label,
    }
  }, [contextReaction, currentReaction, customReactionIcons, customColors])

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  // Handle quick-like on click (like Facebook's original behavior)
  const handleQuickLike = useCallback(async () => {
    const currentUserReaction = contextReaction || currentReaction
    if (currentUserReaction) {
      // User already has a reaction - toggle it off
      await handleReactionSelect(currentUserReaction)
    } else {
      // No reaction yet - add a "like"
      await handleReactionSelect('like')
    }
  }, [contextReaction, currentReaction, handleReactionSelect])

  const renderReactionButton = useCallback(() => {
    const currentDisplay = getCurrentReactionDisplay()

    return (
      <div className="relative flex-1">
        <Button
          ref={reactionButtonRef}
          variant="ghost"
          size="sm"
          onMouseEnter={handleReactionButtonHover}
          onMouseLeave={handleReactionButtonLeave}
          onClick={handleQuickLike}
          disabled={!!engagement?.isLoading}
          aria-busy={!!engagement?.isLoading}
          aria-label={
            engagement?.isLoading
              ? 'Reaction in progress'
              : contextReaction || currentReaction
                ? `You reacted with ${currentDisplay.label}. Click to remove or hover for more reactions.`
                : 'Like. Click to like or hover for more reactions.'
          }
          className={cn(
            'engagement-action-button w-full h-10 rounded-lg transition-colors',
            'flex items-center justify-center gap-2',
            contextReaction || currentReaction
              ? `${currentDisplay.color} hover:bg-gray-50`
              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
          )}
        >
          {engagement?.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <span
              className={cn(
                'flex items-center',
                (contextReaction || currentReaction) && 'fill-current'
              )}
            >
              {currentDisplay.icon}
            </span>
          )}
          <span className="engagement-action-label">
            {engagement?.isLoading ? 'Updating…' : currentDisplay.label}
          </span>
        </Button>

        {/* Reaction Popup */}
        {showReactionPopup && (
          <EnterpriseReactionPopup
            entityId={entityId}
            entityType={entityType}
            isVisible={showReactionPopup}
            onClose={() => setShowReactionPopup(false)}
            position={reactionPopupPositionState}
            currentReaction={contextReaction || currentReaction}
            showReactionCounts={showReactionCounts}
            showQuickReactions={enableQuickReactions}
            maxQuickReactions={3}
            onReactionChange={(rt) => {
              if (onEngagement) {
                onEngagement('reaction', entityId, entityType, rt || undefined)
              }
            }}
            triggerRef={reactionButtonRef as unknown as React.RefObject<HTMLElement>}
            autoPosition={true}
            size="md"
            animation="scale"
          />
        )}
      </div>
    )
  }, [
    contextReaction,
    currentReaction,
    showReactionPopup,
    reactionPopupPositionState,
    entityId,
    entityType,
    showReactionCounts,
    enableQuickReactions,
    handleReactionSelect,
    getCurrentReactionDisplay,
    handleReactionButtonHover,
    handleReactionButtonLeave,
    handleQuickLike,
    engagement?.isLoading,
  ])

  const renderCommentButton = useCallback(() => {
    if (!showCommentInput) return null

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (onCommentClick) {
            onCommentClick()
            return
          }
          setIsCommentInputVisible(!isCommentInputVisible)
        }}
        disabled={!!engagement?.isLoading}
        className="engagement-action-button flex-1 h-10 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="engagement-action-label">Comment</span>
      </Button>
    )
  }, [showCommentInput, isCommentInputVisible, onCommentClick, engagement?.isLoading])

  const renderShareButton = useCallback(() => {
    if (!showShareOptions) return null

    return (
      <Popover open={showShareMenu} onOpenChange={setShowShareMenu}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="engagement-action-button flex-1 h-10 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-5 w-5 mr-2" />
            <span className="engagement-action-label">Share</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="center">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Share this {entityType}</h4>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to share this content
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share to Feed
              </Button>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }, [showShareOptions, showShareMenu, entityType, handleShare])

  const renderBookmarkButton = useCallback(() => {
    if (!showBookmarkOptions) return null

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBookmark}
        disabled={!!engagement?.isLoading}
        className={cn(
          'engagement-action-button flex-1 h-10 rounded-lg transition-colors',
          engagement?.userHasBookmarked || isBookmarked
            ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
        )}
      >
        <Bookmark
          className={cn(
            'h-5 w-5 mr-2',
            (engagement?.userHasBookmarked || isBookmarked) && 'fill-current'
          )}
        />
        <span className="engagement-action-label">
          {engagement?.userHasBookmarked || isBookmarked ? 'Saved' : 'Save'}
        </span>
      </Button>
    )
  }, [
    showBookmarkOptions,
    engagement?.isLoading,
    engagement?.userHasBookmarked,
    isBookmarked,
    handleBookmark,
  ])

  const renderCommentInput = useCallback(() => {
    if (!showCommentInput || !isCommentInputVisible) return null

    return (
      <div className="engagement-comment-input px-4 py-3 border-t border-gray-100">
        <div className="engagement-comment-input-container flex items-start gap-3">
          {/* User Avatar */}
          <div className="engagement-comment-avatar flex-shrink-0">
            <Avatar
              src={(user as any)?.avatar_url || undefined}
              name={(user as any)?.name || user?.user_metadata?.full_name || user?.email || 'User'}
              size="sm"
              className="w-8 h-8"
            />
          </div>

          {/* Comment Input */}
          <div className="engagement-comment-input-field flex-1">
            <Textarea
              ref={commentInputRef}
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isSubmittingComment}
            />

            {/* Comment Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={isSubmittingComment}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Photo
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Cancel Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsCommentInputVisible(false)
                    setCommentText('')
                  }}
                  disabled={isSubmittingComment}
                  className="h-8 px-3 text-xs"
                >
                  Cancel
                </Button>

                {/* Submit Button */}
                <Button
                  size="sm"
                  onClick={handleCommentSubmit}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="h-8 px-4 text-xs"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }, [isCommentInputVisible, commentText, isSubmittingComment, user, handleCommentSubmit])

  const renderEngagementSummary = useCallback(() => {
    if (variant === 'minimal' || !showReactionSummary) return null

    const hasEngagement = (stats?.reactionCount || 0) > 0 || (stats?.commentCount || 0) > 0

    if (!hasEngagement) return null

    return (
      <div className="engagement-reactions-display flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="engagement-reactions-left flex items-center gap-2">
          {/* Reaction Summary */}
          {showReactionSummary && stats?.reactionCount > 0 && (
            <div className="engagement-reactions-likes flex items-center gap-1">
              <ReactionSummary
                entityId={entityId}
                entityType={entityType}
                maxReactions={maxVisibleReactions}
                className="text-sm text-gray-600"
              />
            </div>
          )}

          {/* Comment Count */}
          {stats?.commentCount > 0 && (
            <div className="engagement-comment-count text-sm text-gray-600 hover:underline cursor-pointer">
              {formatCount(stats.commentCount, 'comment')}
            </div>
          )}
        </div>

        {/* Right side - Analytics or additional info */}
        {showAnalytics && (
          <div className="engagement-reactions-right flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Button>
          </div>
        )}
      </div>
    )
  }, [
    variant,
    stats,
    showReactionSummary,
    entityId,
    entityType,
    maxVisibleReactions,
    showAnalytics,
    formatCount,
  ])

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const getVariantClasses = useCallback(() => {
    switch (variant) {
      case 'compact':
        return 'space-y-1'
      case 'detailed':
        return 'space-y-3'
      case 'minimal':
        return 'space-y-1'
      default:
        return 'space-y-2'
    }
  }, [variant])

  return (
    <div
      ref={containerRef}
      className={cn('enterprise-engagement-actions', getVariantClasses(), className)}
    >
      {/* Engagement Summary */}
      {renderEngagementSummary()}

      {/* Action Buttons Row */}
      <div className="engagement-action-buttons flex items-center justify-between px-4 py-2 border-b border-gray-100">
        {renderReactionButton()}
        {renderCommentButton()}
        {renderShareButton()}
        {renderBookmarkButton()}
      </div>

      {/* Comment Input Section */}
      {renderCommentInput()}

      {/* Additional Features for Detailed Variant */}
      {variant === 'detailed' && (
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Views: {formatCount(viewCount, 'view')}</span>
            {monetization && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {monetization.type}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// REACTION OPTIONS FOR DISPLAY (from engagement config)
// ============================================================================

const REACTION_TYPE_ICONS: Record<ReactionType, React.ReactNode> = {
  like: <span className="text-lg leading-none">👍</span>,
  love: <span className="text-lg leading-none">❤️</span>,
  care: <span className="text-lg leading-none">🤗</span>,
  haha: <span className="text-lg leading-none">😂</span>,
  wow: <span className="text-lg leading-none">😮</span>,
  sad: <span className="text-lg leading-none">😢</span>,
  angry: <span className="text-lg leading-none">😠</span>,
}

const REACTION_OPTIONS = REACTION_OPTIONS_METADATA.map((meta) => ({
  type: meta.type,
  label: meta.label,
  icon: REACTION_TYPE_ICONS[meta.type],
  color: meta.color,
  bgColor: meta.bgColor,
}))

// ============================================================================
// EXPORT SPECIALIZED COMPONENTS
// ============================================================================

export { QuickReactionButton, ReactionSummary }
