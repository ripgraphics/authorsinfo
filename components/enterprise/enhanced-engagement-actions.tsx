'use client'

import React, { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Share2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ReactionPopup, ReactionType } from "./reaction-popup"

interface EnhancedEngagementActionsProps {
  entityId: string
  entityType: 'user' | 'book' | 'author' | 'publisher' | 'group' | 'activity'
  initialEngagementCount?: number
  commentCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isPremium?: boolean
  currentReaction?: ReactionType | null
  monetization?: {
    type: 'subscription' | 'pay_per_view' | 'freemium'
    price?: number
    currency?: string
  }
  onEngagement?: (action: 'like' | 'comment' | 'share', entityId: string, entityType: string, reactionType?: ReactionType) => Promise<void>
  onCommentAdded?: (comment: any) => void
  className?: string
}

export function EnhancedEngagementActions({
  entityId,
  entityType,
  initialEngagementCount = 0,
  commentCount = 0,
  isLiked = false,
  isCommented = false,
  isPremium = false,
  currentReaction = null,
  monetization,
  onEngagement,
  onCommentAdded,
  className = ""
}: EnhancedEngagementActionsProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // State for engagement data
  const [engagementCount, setEngagementCount] = useState(initialEngagementCount)
  const [commentCountState, setCommentCountState] = useState(commentCount)
  const [isLikedState, setLikedState] = useState(isLiked)
  const [isCommentedState, setCommentedState] = useState(isCommented)
  const [currentReactionState, setCurrentReactionState] = useState<ReactionType | null>(currentReaction)
  const [loading, setLoading] = useState<'like' | 'comment' | null>(null)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  // State for reaction popup
  const [showReactionPopup, setShowReactionPopup] = useState(false)
  const [reactionPopupPosition, setReactionPopupPosition] = useState<'top' | 'bottom'>('bottom')
  const [reactionButtonRef, setReactionButtonRef] = useState<HTMLButtonElement | null>(null)
  
  // State for dropdown data
  const [likers, setLikers] = useState<any[]>([])
  const [commenters, setCommenters] = useState<any[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(false)
  
  // Update state when props change
  useEffect(() => {
    setEngagementCount(initialEngagementCount || 0)
    setCommentCountState(commentCount || 0)
    setLikedState(isLiked || false)
    setCommentedState(isCommented || false)
    setCurrentReactionState(currentReaction)
  }, [initialEngagementCount, commentCount, isLiked, isCommented, currentReaction])

  // Handle reaction selection
  const handleReactionSelect = useCallback(async (reactionType: ReactionType) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to react to posts",
        variant: "destructive"
      })
      return
    }

    setLoading('like')
    
    try {
      console.log('🔍 Attempting to react with:', { entityId, entityType, reactionType })
      
      const response = await fetch('/api/engagement/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          reaction_type: reactionType
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Reaction response:', result)

      // Update the reaction state
      setCurrentReactionState(reactionType)
      
      // If this is a new reaction, increment count
      if (!currentReactionState) {
        setEngagementCount(prev => prev + 1)
      }
      
      // If changing reaction type, keep same count
      // If removing reaction, decrement count
      if (result.action === 'removed') {
        setEngagementCount(prev => Math.max(0, prev - 1))
        setCurrentReactionState(null)
      }

      toast({
        title: reactionType === currentReactionState ? "Reaction removed" : "Reaction added!",
        description: reactionType === currentReactionState 
          ? "Your reaction has been removed" 
          : `You reacted with ${reactionType}!`,
        variant: "default"
      })

      // Notify parent component
      if (onEngagement) {
        await onEngagement('like', entityId, entityType, reactionType)
      }

    } catch (error) {
      console.error('❌ Error setting reaction:', error)
      toast({
        title: "Error",
        description: "Failed to set reaction. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [user, entityId, entityType, currentReactionState, onEngagement, toast])

  // Handle like button hover to show reaction popup
  const handleLikeButtonHover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    
    // Determine if popup should appear above or below the button
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    if (spaceBelow < 100 && spaceAbove > 100) {
      setReactionPopupPosition('top')
    } else {
      setReactionPopupPosition('bottom')
    }
    
    setReactionButtonRef(button)
    setShowReactionPopup(true)
  }, [])

  // Handle like button leave to hide reaction popup after delay
  const handleLikeButtonLeave = useCallback(() => {
    // Small delay to allow moving mouse to popup
    setTimeout(() => {
      if (!showReactionPopup) return
      
      // Check if mouse is over the popup
      const popup = document.querySelector('[data-reaction-popup]')
      if (popup && popup.matches(':hover')) return
      
      setShowReactionPopup(false)
    }, 100)
  }, [showReactionPopup])

  // Handle comment submission
  const handleCommentSubmit = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to comment",
        variant: "destructive"
      })
      return
    }

    if (!commentText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingComment(true)
    
    try {
      console.log('🔍 Submitting comment:', { entityId, entityType, commentText })
      
      const response = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: commentText.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Comment response:', result)

      // Update comment count
      setCommentCountState(prev => prev + 1)
      setCommentedState(true)
      
      // Clear comment input
      setCommentText("")
      setShowCommentInput(false)

      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded({
          id: result.comment_id || `comment-${Date.now()}`,
          content: commentText.trim(),
          created_at: new Date().toISOString(),
          user: {
            id: user.id,
            name: (user as any)?.name || user.user_metadata?.full_name || user.email || 'User',
            avatar_url: (user as any)?.avatar_url || null
          }
        })
      }

      toast({
        title: "Comment posted!",
        description: "Your comment has been added",
        variant: "default"
      })

    } catch (error) {
      console.error('❌ Error posting comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }, [user, entityId, entityType, commentText, onCommentAdded, toast])

  // Handle share action
  const handleShare = useCallback(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to share posts",
        variant: "destructive"
      })
      return
    }

    // For now, just show a toast - implement actual sharing logic later
    toast({
      title: "Share feature",
      description: "Sharing functionality coming soon!",
      variant: "default"
    })
  }, [user, toast])

  // Format engagement count for display
  const formatEngagementCount = (count: number) => {
    if (count === 0) return ""
    if (count === 1) return "1 reaction"
    if (count < 1000) return `${count} reactions`
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K reactions`
    return `${(count / 1000000).toFixed(1)}M reactions`
  }

  // Format comment count for display
  const formatCommentCount = (count: number) => {
    if (count === 0) return ""
    if (count === 1) return "1 comment"
    return `${count} comments`
  }

  // Get current reaction icon and color
  const getCurrentReactionDisplay = () => {
    if (!currentReactionState) return { icon: <ThumbsUp className="h-5 w-5" />, color: "text-gray-600" }
    
    switch (currentReactionState) {
      case 'like':
        return { icon: <ThumbsUp className="h-5 w-5" />, color: "text-blue-600" }
      case 'love':
        return { icon: <Heart className="h-5 w-5" />, color: "text-red-500" }
      case 'care':
        return { icon: <Heart className="h-5 w-5" />, color: "text-yellow-500" }
      case 'haha':
        return { icon: <Smile className="h-5 w-5" />, color: "text-yellow-500" }
      case 'wow':
        return { icon: <Star className="h-5 w-5" />, color: "text-purple-500" }
      case 'sad':
        return { icon: <AlertTriangle className="h-5 w-5" />, color: "text-blue-500" }
      case 'angry':
        return { icon: <Zap className="h-5 w-5" />, color: "text-red-600" }
      default:
        return { icon: <ThumbsUp className="h-5 w-5" />, color: "text-gray-600" }
    }
  }

  const currentReactionDisplay = getCurrentReactionDisplay()

  return (
    <div className={cn("enterprise-engagement-actions", className)}>
      {/* Reactions Display Row */}
      {(engagementCount > 0 || commentCountState > 0) && (
        <div className="engagement-reactions-display flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <div className="engagement-reactions-left flex items-center gap-2">
            {/* Reaction reactions */}
            {engagementCount > 0 && (
              <div className="engagement-reactions-likes flex items-center gap-1">
                <div className="engagement-reaction-icon bg-blue-500 text-white rounded-full p-1">
                  <ThumbsUp className="h-3 w-3" />
                </div>
                <span className="engagement-reaction-count text-sm text-gray-600">
                  {formatEngagementCount(engagementCount)}
                </span>
              </div>
            )}
            
            {/* Comment count */}
            {commentCountState > 0 && (
              <div className="engagement-comment-count text-sm text-gray-600 hover:underline cursor-pointer">
                {formatCommentCount(commentCountState)}
              </div>
            )}
          </div>
          
          {/* Right side - could add share count here */}
          <div className="engagement-reactions-right">
            {/* Future: Add share count if needed */}
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="engagement-action-buttons flex items-center justify-between px-4 py-2 border-b border-gray-100">
        {/* Enhanced Like Button with Reaction Popup */}
        <div className="relative flex-1">
          <Button
            ref={setReactionButtonRef}
            variant="ghost"
            size="sm"
            onMouseEnter={handleLikeButtonHover}
            onMouseLeave={handleLikeButtonLeave}
            disabled={loading === 'like'}
            className={cn(
              "engagement-action-button w-full h-10 rounded-lg transition-colors",
              currentReactionState 
                ? `${currentReactionDisplay.color} hover:bg-gray-50` 
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <span className={cn("mr-2", currentReactionState && "fill-current")}>
              {currentReactionDisplay.icon}
            </span>
            <span className="engagement-action-label">
              {currentReactionState ? currentReactionState.charAt(0).toUpperCase() + currentReactionState.slice(1) : 'Like'}
            </span>
          </Button>
          
          {/* Reaction Popup */}
          {showReactionPopup && reactionButtonRef && (
            <ReactionPopup
              isVisible={showReactionPopup}
              onReactionSelect={handleReactionSelect}
              onClose={() => setShowReactionPopup(false)}
              position={reactionPopupPosition}
              currentReaction={currentReactionState}
              className="left-0"
            />
          )}
        </div>

        {/* Comment Button */}
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

        {/* Share Button */}
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
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {(user as any)?.avatar_url ? (
                  <img 
                    src={(user as any).avatar_url} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {(user as any)?.name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Comment Input */}
            <div className="engagement-comment-input-field flex-1">
              <Textarea
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
      )}
    </div>
  )
}
