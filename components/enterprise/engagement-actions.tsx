"use client"

import React, { useState, useCallback, useEffect } from "react"
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
  onEngagement?: (action: 'like' | 'comment' | 'share', entityId: string, entityType: string) => Promise<void>
  onCommentAdded?: (comment: any) => void
  className?: string
}

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
  className = ""
}: EngagementActionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // State for engagement data
  const [engagementCount, setEngagementCount] = useState(initialEngagementCount)
  const [commentCountState, setCommentCountState] = useState(commentCount)
  const [isLikedState, setLikedState] = useState(isLiked)
  const [isCommentedState, setCommentedState] = useState(isCommented)
  const [loading, setLoading] = useState<'like' | 'comment' | null>(null)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  
  // State for dropdown data
  const [likers, setLikers] = useState<any[]>([])
  const [commenters, setCommenters] = useState<any[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(false)
  
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
      isLiked
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
        title: "Authentication required",
        description: "Please log in to like posts",
        variant: "destructive"
        })
        return
      }

        setLoading('like')

    try {
      console.log('🔍 Attempting to like/unlike:', { entityId, entityType })
      
      const response = await fetch('/api/engagement/like', {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Like response:', result)

      // Toggle the like state
      const newLikeState = !isLikedState
      setLikedState(newLikeState)
      
      // Update the count
      if (newLikeState) {
        setEngagementCount(prev => prev + 1)
      } else {
          setEngagementCount(prev => Math.max(0, prev - 1))
      }

      toast({
        title: newLikeState ? "Post liked!" : "Post unliked",
        description: newLikeState ? "You liked this post" : "You unliked this post",
        variant: "default"
      })

    } catch (error) {
      console.error('❌ Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive"
      })
      } finally {
        setLoading(null)
      }
  }, [user, entityId, entityType, isLikedState, toast])

  // Handle comment submission
  const handleSubmitComment = useCallback(async () => {
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
            name: user.user_metadata?.full_name || user.email || 'User',
            avatar_url: user.user_metadata?.avatar_url
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
    if (count === 1) return "1 like"
    if (count < 1000) return `${count} likes`
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K likes`
    return `${(count / 1000000).toFixed(1)}M likes`
  }

  // Format comment count for display
  const formatCommentCount = (count: number) => {
    if (count === 0) return ""
    if (count === 1) return "1 comment"
    return `${count} comments`
  }

  return (
    <div className={cn("enterprise-engagement-actions", className)}>
      {/* Reactions Display Row */}
      {(engagementCount > 0 || commentCountState > 0) && (
        <div className="engagement-reactions-display flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <div className="engagement-reactions-left flex items-center gap-2">
            {/* Like reactions */}
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
          <Button 
            variant="ghost" 
            size="sm" 
          onClick={handleEngagement}
          disabled={loading === 'like'}
          className={cn(
            "engagement-action-button flex-1 h-10 rounded-lg transition-colors",
            isLikedState 
              ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
              : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          )}
        >
          <ThumbsUp className={cn("h-5 w-5 mr-2", isLikedState && "fill-current")} />
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
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U'}
                    </span>
                )}
              </div>
          </div>

            {/* Comment Input Area */}
            <div className="engagement-comment-input-area flex-1">
              <div className="engagement-comment-input-wrapper relative">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="engagement-comment-textarea min-h-[40px] max-h-32 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                />
                
                {/* Comment Action Icons */}
                <div className="engagement-comment-actions absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="engagement-comment-action-icon p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                <Button
                  variant="ghost"
                  size="sm"
                    className="engagement-comment-action-icon p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                    title="Add photo"
                  >
                    <ImageIcon className="h-4 w-4" />
                </Button>
                </div>
              </div>

              {/* Comment Submit Button */}
              <div className="engagement-comment-submit mt-2 flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  size="sm"
                  className="engagement-comment-submit-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </div>
                  ) : (
                    "Post"
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