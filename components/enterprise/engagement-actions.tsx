"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Eye,
  TrendingUp,
  Zap,
  Send,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"

interface EngagementActionsProps {
  entityId: string
  entityType: 'user' | 'book' | 'author' | 'publisher' | 'group'
  initialEngagementCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isShared?: boolean
  isPremium?: boolean
  monetization?: {
    price?: number
    currency?: string
    revenue_share?: number
  }
  onEngagement?: (action: 'like' | 'comment' | 'share', entityId: string, entityType: string) => Promise<void>
  onCommentAdded?: (comment: any) => void
  className?: string
}

export function EngagementActions({
  entityId,
  entityType,
  initialEngagementCount = 0,
  isLiked = false,
  isCommented = false,
  isShared = false,
  isPremium = false,
  monetization,
  onEngagement,
  onCommentAdded,
  className = ""
}: EngagementActionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [engagementCount, setEngagementCount] = useState(initialEngagementCount)
  const [liked, setLiked] = useState(isLiked)
  const [commented, setCommented] = useState(isCommented)
  const [shared, setShared] = useState(isShared)
  const [loading, setLoading] = useState<string | null>(null)
  
  // Comment functionality
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const handleEngagement = useCallback(async (action: 'like' | 'comment' | 'share') => {
    if (loading) return

    if (action === 'comment') {
      // Toggle comment input instead of just updating state
      setShowCommentInput(!showCommentInput)
      if (showCommentInput) {
        setCommentText("") // Clear comment text when hiding
      }
      return
    }

    setLoading(action)
    try {
      // Optimistic update
      switch (action) {
        case 'like':
          setLiked(!liked)
          setEngagementCount(prev => liked ? prev - 1 : prev + 1)
          break
        case 'share':
          setShared(!shared)
          setEngagementCount(prev => shared ? prev - 1 : prev + 1)
          break
      }

      // Call the engagement handler
      if (onEngagement) {
        await onEngagement(action, entityId, entityType)
      }

      // Track analytics
      await trackEngagementAnalytics(action, entityId, entityType)
    } catch (error) {
      console.error(`Error handling ${action}:`, error)
      // Revert optimistic update on error
      switch (action) {
        case 'like':
          setLiked(liked)
          setEngagementCount(prev => liked ? prev + 1 : prev - 1)
          break
        case 'share':
          setShared(shared)
          setEngagementCount(prev => shared ? prev + 1 : prev - 1)
          break
      }
    } finally {
      setLoading(null)
    }
  }, [loading, liked, shared, entityId, entityType, onEngagement, showCommentInput])

  const handleSubmitComment = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to comment",
        variant: "destructive"
      })
      return
    }

    if (!commentText.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment",
        variant: "destructive"
      })
      return
    }

    setIsSubmittingComment(true)
    try {
      // Create comment data
      const commentData = {
        post_id: entityId,
        user_id: user.id,
        content: commentText.trim(),
        entity_type: entityType,
        entity_id: entityId,
        created_at: new Date().toISOString()
      }

      // Submit comment to API
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }

      const result = await response.json()
      
      // Update engagement count
      setEngagementCount(prev => prev + 1)
      setCommented(true)
      
      // Clear comment input and hide it
      setCommentText("")
      setShowCommentInput(false)
      
      // Notify parent component about new comment
      if (onCommentAdded) {
        onCommentAdded(result.comment)
      }

      toast({
        title: "Comment Added!",
        description: "Your comment has been posted successfully",
        duration: 3000
      })

    } catch (error) {
      console.error('Error submitting comment:', error)
      toast({
        title: "Comment Failed",
        description: "Failed to submit comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }, [commentText, user, entityId, entityType, onCommentAdded, toast])

  const trackEngagementAnalytics = async (action: string, entityId: string, entityType: string) => {
    try {
      await fetch('/api/analytics/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          entity_id: entityId,
          entity_type: entityType,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error tracking engagement analytics:', error)
    }
  }

  return (
    <div className={`enterprise-engagement-actions flex flex-col gap-3 pt-3 border-t border-gray-100 ${className}`}>
      {/* Main Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Like Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className={`enterprise-engagement-like-button gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${
            liked ? 'text-blue-600 bg-blue-50' : ''
          }`}
          onClick={() => handleEngagement('like')}
          disabled={loading === 'like'}
        >
          <Heart className={`enterprise-engagement-like-icon h-4 w-4 ${
            liked ? 'fill-current' : ''
          }`} />
          <span className="enterprise-engagement-like-text">Like</span>
        </Button>

        {/* Comment Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className={`enterprise-engagement-comment-button gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50 ${
            commented ? 'text-green-600 bg-green-50' : ''
          }`}
          onClick={() => handleEngagement('comment')}
          disabled={loading === 'comment'}
        >
          <MessageSquare className={`enterprise-engagement-comment-icon h-4 w-4 ${
            commented ? 'fill-current' : ''
          }`} />
          <span className="enterprise-engagement-comment-text">Comment</span>
        </Button>

        {/* Share Button */}
        <Button 
          variant="ghost" 
          size="sm"
          className={`enterprise-engagement-share-button gap-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 ${
            shared ? 'text-purple-600 bg-purple-50' : ''
          }`}
          onClick={() => handleEngagement('share')}
          disabled={loading === 'share'}
        >
          <Share2 className={`enterprise-engagement-share-icon h-4 w-4 ${
            shared ? 'fill-current' : ''
          }`} />
          <span className="enterprise-engagement-share-text">
            {shared ? 'Shared' : 'Share'}
          </span>
        </Button>

        {/* Engagement Count Badge */}
        {engagementCount > 0 && (
          <Badge variant="secondary" className="enterprise-engagement-count-badge text-xs ml-auto">
            <Eye className="enterprise-engagement-count-icon h-3 w-3 mr-1" />
            {engagementCount}
          </Badge>
        )}

        {/* Premium Monetization Badge */}
        {isPremium && monetization && (
          <Badge variant="default" className="enterprise-engagement-premium-badge bg-yellow-500 text-white ml-auto">
            <Zap className="enterprise-engagement-premium-icon h-3 w-3 mr-1" />
            ${monetization.price}
          </Badge>
        )}
      </div>

      {/* Comment Input Section */}
      {showCommentInput && (
        <div className="enterprise-engagement-comment-input bg-gray-50 rounded-lg p-3 border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              <img 
                src={user?.user_metadata?.avatar_url || '/placeholder.svg'} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isSubmittingComment}
              />
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCommentInput(false)
                    setCommentText("")
                  }}
                  disabled={isSubmittingComment}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="enterprise-engagement-loading absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="enterprise-engagement-loading-spinner animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
} 