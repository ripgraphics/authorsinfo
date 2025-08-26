'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo, useTransition } from 'react'
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
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { 
  useEntityEngagement, 
  EntityType, 
  ReactionType 
} from '@/contexts/engagement-context'
import { 
  EnterpriseReactionPopup, 
  QuickReactionButton, 
  ReactionSummary 
} from './enterprise-reaction-popup'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropover'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// ============================================================================
// PERFORMANCE OPTIMIZED TYPE DEFINITIONS
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
  onEngagement?: (action: 'reaction' | 'comment' | 'share' | 'bookmark' | 'view', entityId: string, entityType: EntityType, reactionType?: ReactionType) => Promise<void>
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
  customReactionIcons?: Record<ReactionType, React.ReactNode>
  customColors?: Record<ReactionType, { color: string; bgColor: string }>
}

// ============================================================================
// PERFORMANCE CONSTANTS
// ============================================================================

const DEBOUNCE_DELAY = 300
const VIEW_TRACKING_DELAY = 1000
const REACTION_ANIMATION_DURATION = 200

// ============================================================================
// PERFORMANCE OPTIMIZED COMPONENT
// ============================================================================

const EnterpriseEngagementActions = React.memo(({
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
  className,
  variant = 'default',
  showReactionCounts = true,
  showCommentInput = true,
  showShareOptions = true,
  showBookmarkOptions = true,
  showViewTracking = true,
  showAnalytics = false,
  maxVisibleReactions = 5,
  reactionPopupPosition = 'top',
  autoTrackViews = true,
  enableQuickReactions = true,
  showReactionSummary = true,
  customReactionIcons,
  customColors
}: EnterpriseEngagementActionsProps) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const { 
    engagement, 
    isLoading, 
    addReaction, 
    removeReaction, 
    addComment, 
    addBookmark, 
    removeBookmark,
    trackView 
  } = useEntityEngagement(entityId, entityType)

  // ============================================================================
  // PERFORMANCE OPTIMIZED STATE MANAGEMENT
  // ============================================================================
  
  const [showReactionPopup, setShowReactionPopup] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [reactionPopupPositionState, setReactionPopupPositionState] = useState(reactionPopupPosition)
  
  // Performance optimization: Use transitions for non-urgent updates
  const [isPending, startTransition] = useTransition()
  
  // Performance optimization: Memoized refs
  const reactionButtonRef = useRef<HTMLButtonElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const viewTrackingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // ============================================================================
  // PERFORMANCE OPTIMIZED MEMOIZED VALUES
  // ============================================================================
  
  // Memoize engagement counts for performance
  const engagementCounts = useMemo(() => ({
    reactions: engagement?.reactionCount || initialEngagementCount,
    comments: engagement?.commentCount || commentCount,
    shares: engagement?.shareCount || shareCount,
    bookmarks: engagement?.bookmarkCount || bookmarkCount,
    views: engagement?.viewCount || viewCount
  }), [
    engagement?.reactionCount, initialEngagementCount,
    engagement?.commentCount, commentCount,
    engagement?.shareCount, shareCount,
    engagement?.bookmarkCount, bookmarkCount,
    engagement?.viewCount, viewCount
  ])
  
  // Memoize current reaction state for performance
  const currentReactionState = useMemo(() => 
    engagement?.userReaction || currentReaction, 
    [engagement?.userReaction, currentReaction]
  )
  
  // Memoize user engagement state for performance
  const userEngagementState = useMemo(() => ({
    hasLiked: engagement?.userHasLiked || isLiked,
    hasCommented: engagement?.userHasCommented || isCommented,
    hasShared: engagement?.userHasShared || isShared,
    hasBookmarked: engagement?.userHasBookmarked || isBookmarked,
    hasViewed: engagement?.userHasViewed || isViewed
  }), [
    engagement?.userHasLiked, isLiked,
    engagement?.userHasCommented, isCommented,
    engagement?.userHasShared, isShared,
    engagement?.userHasBookmarked, isBookmarked,
    engagement?.userHasViewed, isViewed
  ])
  
  // ============================================================================
  // PERFORMANCE OPTIMIZED CALLBACKS
  // ============================================================================
  
  // Optimized reaction handling
  const handleReactionSelect = useCallback(async (reactionType: ReactionType) => {
    try {
      if (currentReactionState === reactionType) {
        await removeReaction()
        toast({
          title: 'Reaction removed',
          description: 'Your reaction has been removed.',
          variant: 'default'
        })
      } else {
        await addReaction(reactionType)
        toast({
          title: 'Reaction added',
          description: `You reacted with ${reactionType}!`,
          variant: 'default'
        })
      }
      
      // Performance optimization: Use transition for non-urgent updates
      startTransition(() => {
        setShowReactionPopup(false)
      })
      
      // Call external engagement handler if provided
      if (onEngagement) {
        await onEngagement('reaction', entityId, entityType, reactionType)
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to update reaction. Please try again.',
        variant: 'destructive'
      })
    }
  }, [
    currentReactionState, removeReaction, addReaction, toast, onEngagement,
    entityId, entityType
  ])
  
  // Optimized comment handling
  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() || isSubmittingComment) return
    
    try {
      setIsSubmittingComment(true)
      
      const comment = await addComment(commentText)
      
      // Performance optimization: Use transition for non-urgent updates
      startTransition(() => {
        setCommentText('')
        setShowCommentInput(false)
      })
      
      // Call external comment handler if provided
      if (onCommentAdded) {
        onCommentAdded(comment)
      }
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully.',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }, [
    commentText, isSubmittingComment, addComment, onCommentAdded, toast
  ])
  
  // Optimized bookmark handling
  const handleBookmark = useCallback(async () => {
    try {
      if (userEngagementState.hasBookmarked) {
        await removeBookmark()
        toast({
          title: 'Bookmark removed',
          description: 'Item removed from your bookmarks.',
          variant: 'default'
        })
      } else {
        await addBookmark()
        toast({
          title: 'Bookmarked',
          description: 'Item added to your bookmarks!',
          variant: 'default'
        })
      }
      
      // Call external bookmark handler if provided
      if (onBookmark) {
        await onBookmark(entityId, entityType)
      }
    } catch (error) {
      console.error('Error handling bookmark:', error)
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. Please try again.',
        variant: 'destructive'
      })
    }
  }, [
    userEngagementState.hasBookmarked, removeBookmark, addBookmark,
    onBookmark, entityId, entityType, toast
  ])
  
  // Optimized share handling
  const handleShare = useCallback(async () => {
    try {
      // Call external share handler if provided
      if (onShare) {
        await onShare(entityId, entityType)
      }
      
      // Performance optimization: Use transition for non-urgent updates
      startTransition(() => {
        setShowShareMenu(false)
      })
      
      toast({
        title: 'Shared',
        description: 'Content shared successfully!',
        variant: 'default'
      })
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to share content. Please try again.',
        variant: 'destructive'
      })
    }
  }, [onShare, entityId, entityType, toast])
  
  // Optimized view tracking
  const handleViewTracking = useCallback(() => {
    if (!autoTrackViews || userEngagementState.hasViewed) return
    
    // Performance optimization: Debounce view tracking
    if (viewTrackingTimeoutRef.current) {
      clearTimeout(viewTrackingTimeoutRef.current)
    }
    
    viewTrackingTimeoutRef.current = setTimeout(async () => {
      try {
        await trackView()
        
        // Call external engagement handler if provided
        if (onEngagement) {
          await onEngagement('view', entityId, entityType)
        }
      } catch (error) {
        console.error('Error tracking view:', error)
      }
    }, VIEW_TRACKING_DELAY)
  }, [
    autoTrackViews, userEngagementState.hasViewed, trackView,
    onEngagement, entityId, entityType
  ])
  
  // ============================================================================
  // PERFORMANCE OPTIMIZED EFFECTS
  // ============================================================================
  
  // Auto-track view on mount
  useEffect(() => {
    handleViewTracking()
    
    return () => {
      if (viewTrackingTimeoutRef.current) {
        clearTimeout(viewTrackingTimeoutRef.current)
      }
    }
  }, [handleViewTracking])
  
  // ============================================================================
  // PERFORMANCE OPTIMIZED RENDER FUNCTIONS
  // ============================================================================
  
  // Memoized reaction button renderer
  const renderReactionButton = useCallback(() => {
    const currentDisplay = getCurrentReactionDisplay(currentReactionState)
    
    return (
      <Button
        ref={reactionButtonRef}
        variant="ghost"
        size="sm"
        onClick={() => setShowReactionPopup(!showReactionPopup)}
        onMouseEnter={handleReactionButtonHover}
        onMouseLeave={handleReactionButtonLeave}
        disabled={isLoading}
        className={cn(
          "engagement-action-button flex-1 h-10 rounded-lg transition-colors",
          currentReactionState ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        <span className={cn("flex items-center", currentReactionState && "fill-current")}>
          {currentDisplay.icon}
        </span>
        <span className="engagement-action-label">
          {currentDisplay.label}
        </span>
      </Button>
    )
  }, [
    currentReactionState, showReactionPopup, isLoading,
    handleReactionButtonHover, handleReactionButtonLeave
  ])
  
  // Memoized comment button renderer
  const renderCommentButton = useCallback(() => {
    if (!showCommentInput) return null
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCommentInput(!showCommentInput)}
        disabled={isLoading}
        className="engagement-action-button flex-1 h-10 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        <span className="engagement-action-label">Comment</span>
      </Button>
    )
  }, [showCommentInput, isLoading])
  
  // Memoized share button renderer
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
  
  // Memoized bookmark button renderer
  const renderBookmarkButton = useCallback(() => {
    if (!showBookmarkOptions) return null
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBookmark}
        disabled={isLoading}
        className={cn(
          "engagement-action-button flex-1 h-10 rounded-lg transition-colors",
          userEngagementState.hasBookmarked
            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
        )}
      >
        <Bookmark className={cn(
          "h-5 w-5 mr-2",
          userEngagementState.hasBookmarked && "fill-current"
        )} />
        <span className="engagement-action-label">
          {userEngagementState.hasBookmarked ? 'Saved' : 'Save'}
        </span>
      </Button>
    )
  }, [showBookmarkOptions, isLoading, userEngagementState.hasBookmarked, handleBookmark])
  
  // Memoized comment input renderer
  const renderCommentInput = useCallback(() => {
    if (!showCommentInput || !showCommentInput) return null
    
    return (
      <div className="engagement-comment-input px-4 py-3 border-t border-gray-100">
        <div className="engagement-comment-input-container flex items-start gap-3">
          {/* User Avatar */}
          <div className="engagement-comment-avatar flex-shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
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
                    setShowCommentInput(false)
                    setCommentText("")
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
                      <Send className="h-4 w-4 mr-1" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }, [
    showCommentInput, commentText, isSubmittingComment, user, handleCommentSubmit
  ])
  
  // ============================================================================
  // PERFORMANCE OPTIMIZED RENDER
  // ============================================================================
  
  return (
    <div className={cn("enterprise-engagement-actions", className)}>
      {/* Main Engagement Actions */}
      <div className="engagement-actions-main flex items-center gap-1 p-2">
        {renderReactionButton()}
        {renderCommentButton()}
        {renderShareButton()}
        {renderBookmarkButton()}
      </div>
      
      {/* Reaction Popup */}
      {showReactionPopup && (
        <EnterpriseReactionPopup
          entityId={entityId}
          entityType={entityType}
          isVisible={showReactionPopup}
          onClose={() => setShowReactionPopup(false)}
          position={reactionPopupPositionState}
          currentReaction={currentReactionState}
          showReactionCounts={showReactionCounts}
          showQuickReactions={enableQuickReactions}
          maxQuickReactions={3}
          onReactionChange={handleReactionSelect}
          triggerRef={reactionButtonRef}
          autoPosition={true}
          size="md"
          animation="scale"
        />
      )}
      
      {/* Comment Input */}
      {renderCommentInput()}
      
      {/* Engagement Analytics (if enabled) */}
      {showAnalytics && (
        <div className="engagement-analytics px-4 py-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{engagementCounts.views} views</span>
            <span>{engagementCounts.reactions} reactions</span>
            <span>{engagementCounts.comments} comments</span>
            <span>{engagementCounts.shares} shares</span>
          </div>
        </div>
      )}
    </div>
  )
})

// ============================================================================
// PERFORMANCE UTILITY FUNCTIONS
// ============================================================================

// Helper function to get reaction display info
function getCurrentReactionDisplay(reaction: ReactionType | null) {
  switch (reaction) {
    case 'like':
      return { icon: <ThumbsUp className="h-5 w-5" />, label: 'Liked' }
    case 'love':
      return { icon: <Heart className="h-5 w-5" />, label: 'Loved' }
    case 'laugh':
      return { icon: <Smile className="h-5 w-5" />, label: 'Laughed' }
    case 'wow':
      return { icon: <Star className="h-5 w-5" />, label: 'Wow' }
    case 'sad':
      return { icon: <AlertTriangle className="h-5 w-5" />, label: 'Sad' }
    case 'angry':
      return { icon: <Zap className="h-5 w-5" />, label: 'Angry' }
    default:
      return { icon: <ThumbsUp className="h-5 w-5" />, label: 'Like' }
  }
}

// Helper functions for reaction button interactions
function handleReactionButtonHover() {
  // Implementation for hover effects
}

function handleReactionButtonLeave() {
  // Implementation for leave effects
}

// Display name for debugging
EnterpriseEngagementActions.displayName = 'EnterpriseEngagementActions'

export default EnterpriseEngagementActions
