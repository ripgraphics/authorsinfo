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
  ChevronDown
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
    
    // Update engagement count state
    if (initialEngagementCount !== undefined) {
      setEngagementCount(initialEngagementCount)
    }
    
    // Update comment count state
    if (commentCount !== undefined) {
      setCommentCountState(commentCount)
    }
    
    // Update liked state
    if (isLiked !== undefined) {
      setLikedState(isLiked)
    }
  }, [initialEngagementCount, commentCount, isLiked])

  // Remove the separate API call - engagement data comes from the parent
  useEffect(() => {
    // No need to fetch engagement data separately anymore
    // The parent component should provide this data
  }, [])
  
  // Debug logging
  useEffect(() => {
    console.log('🔧 EngagementActions mounted with:', {
      entityId,
      entityType,
      user: user ? { id: user.id, email: user.email } : null,
      initialEngagementCount,
      commentCount,
      isLiked,
      isCommented
    })
  }, [entityId, entityType, user, initialEngagementCount, commentCount, isLiked, isCommented])

  // Debug comment input state changes
  useEffect(() => {
    console.log('🔍 Comment input state changed - showCommentInput:', showCommentInput)
  }, [showCommentInput])
  
  // Test API connectivity - REMOVED - no longer needed with consolidated system
  const testAPI = useCallback(async () => {
    console.log('🧪 API testing removed - using consolidated engagement system')
    toast({
      title: "API Test Info",
      description: "Engagement system now uses consolidated data from props",
      variant: "default"
    })
  }, [toast])

  // Fetch likers function - REMOVED - using consolidated data from props
  const fetchLikers = useCallback(async () => {
    console.log('✅ Likers data comes from props - no API call needed')
    // Individual likers not stored separately in new system
    setLikers([])
  }, [])

  // Fetch commenters function - REMOVED - using consolidated data from props  
  const fetchCommenters = useCallback(async () => {
    console.log('✅ Commenters data comes from props - no API call needed')
    // Individual commenters not stored separately in new system
    setCommenters([])
  }, [])

  // Load data when popovers are opened
  const handleLikersPopoverOpen = useCallback((open: boolean) => {
    if (open && likers.length === 0) {
      fetchLikers()
    }
  }, [likers.length, fetchLikers])

  const handleCommentersPopoverOpen = useCallback((open: boolean) => {
    if (open && commenters.length === 0) {
      fetchCommenters()
    }
  }, [commenters.length, fetchCommenters])

  // Handle engagement actions - FIXED to actually call API endpoints
  const handleEngagement = useCallback(async (action: 'like' | 'comment') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to engage with posts",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🚀 Handling engagement with API calls:', { action, entityId, entityType, user: user.id })

      if (action === 'like') {
        console.log('🔍 About to call /api/engagement/like with:', { entity_type: entityType, entity_id: entityId })
        
        // Actually call the engagement API
        const response = await fetch('/api/engagement/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId
          })
        })

        console.log('📡 Like API response status:', response.status)

        if (!response.ok) {
          throw new Error(`Failed to ${isLikedState ? 'unlike' : 'like'}: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Like API response:', result)

        // Update local state based on API response
        const newLikedState = result.liked
        setLikedState(newLikedState)
        
        // Update count based on API response
        if (newLikedState) {
          setEngagementCount(prev => prev + 1)
        } else {
          setEngagementCount(prev => Math.max(0, prev - 1))
        }

        // Notify parent component about the engagement change
        if (onEngagement) {
          await onEngagement(action, entityId, entityType)
        }

        toast({
          title: newLikedState ? "Liked!" : "Unliked",
          description: newLikedState ? "Post liked successfully" : "Post unliked successfully",
        })
      } else if (action === 'comment') {
        // Show the comment input when comment button is clicked
        setShowCommentInput(true)
        console.log('💬 Comment button clicked - showing comment input')
      }
    } catch (error) {
      console.error('❌ Engagement error:', error)
      toast({
        title: "Error",
        description: "Failed to process engagement",
        variant: "destructive"
      })
    }
  }, [entityId, entityType, user, isLikedState, onEngagement, toast])

  // Handle comment submission - FIXED to actually call API endpoint
  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !user) return

    try {
      setIsSubmittingComment(true)
      console.log('💬 Submitting comment with API call:', { commentText, entityId, entityType })

      // Actually call the engagement API
      const response = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: commentText.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to post comment: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Comment API response:', result)

      // Create comment object from API response
      const newComment = {
        id: result.comment_id || `comment-${Date.now()}`,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.user_metadata?.name || user.email || 'You',
          avatar_url: user.user_metadata?.avatar_url || ''
        },
        parent_comment_id: null
      }
      
      // Update local state
      setCommenters(prev => [newComment, ...prev])
      setCommentCountState(prev => prev + 1)
      setCommentedState(true)
      setCommentText('')
      setShowCommentInput(false)

      // Notify parent component about the engagement change
      if (onEngagement) {
        await onEngagement('comment', entityId, entityType)
      }

      toast({
        title: "Comment Posted!",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      console.error('❌ Comment submission error:', error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }, [commentText, entityId, entityType, user, onEngagement, toast])

  return (
    <div className={`enterprise-engagement-actions flex flex-col gap-3 pt-3 border-t border-gray-100 ${className}`}>
      {/* Main Action Buttons */}
      <div className="flex items-center gap-4">
        

        {/* Engagement Actions */}
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`enterprise-engagement-like-button gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 ${
              isLikedState ? 'text-blue-600 bg-blue-50' : ''
            }`}
            onClick={() => handleEngagement('like')}
            disabled={loading === 'like'}
          >
            <Heart className={`enterprise-engagement-like-icon h-4 w-4 ${
              isLikedState ? 'fill-current' : ''
            }`} />
            <span className="enterprise-engagement-like-text">Like</span>
          </Button>

          {/* Comment Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className={`enterprise-engagement-comment-button gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50 ${
              isCommentedState ? 'text-green-600 bg-green-50' : ''
            }`}
            onClick={() => {
              console.log('💬 Comment button clicked - current showCommentInput:', showCommentInput)
              handleEngagement('comment')
              console.log('💬 After handleEngagement - showCommentInput should be true')
            }}
            disabled={loading === 'comment'}
          >
            <MessageSquare className={`enterprise-engagement-comment-icon h-4 w-4 ${
              isCommentedState ? 'fill-current' : ''
            }`} />
            <span className="enterprise-engagement-comment-text">Comment</span>
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
      </div>

      {/* Engagement Summary Row - Facebook Style */}
      <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-100 pb-3">
        {/* Left Side - Likes with Dropdown */}
        <div className="flex items-center gap-2">
          {engagementCount > 0 && (
            <Popover onOpenChange={handleLikersPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {/* Like Icons with different colors */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                        <Heart className="h-3 w-3 text-white fill-current" />
                      </div>
                      {engagementCount > 1 && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm">
                          <Heart className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                      {engagementCount > 2 && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-sm">
                          <Heart className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                    </div>
                    <span className="ml-1 hover:underline cursor-pointer font-medium text-gray-700">
                      {engagementCount} {engagementCount === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-xl border-0" align="start">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-blue-600 fill-current" />
                    People who liked this
                  </h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isLoadingLikers ? (
                    <div className="p-6 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading...
                    </div>
                  ) : likers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {likers.map((liker: any) => (
                        <div key={liker.user_id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors duration-150">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-gray-100">
                            <img 
                              src={liker.user_avatar_url || '/placeholder.svg'} 
                              alt={liker.user_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{liker.user_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(liker.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p>No likes yet</p>
                      <p className="text-xs">Be the first to like this!</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Right Side - Comments with Dropdown */}
        <div className="flex items-center gap-2">
          {commentCountState > 0 && (
            <Popover onOpenChange={handleCommentersPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <span className="hover:underline cursor-pointer font-medium text-gray-700">
                    {commentCountState} {commentCountState === 1 ? 'comment' : 'comments'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-xl border-0" align="end">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    Comments
                  </h4>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isLoadingCommenters ? (
                    <div className="p-6 text-center text-gray-500">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading...
                    </div>
                  ) : commenters.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {commenters.map((commenter: any) => (
                        <div key={commenter.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-gray-100">
                              <img 
                                src={commenter.user_avatar_url || '/placeholder.svg'} 
                                alt={commenter.user_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-gray-900">{commenter.user_name}</p>
                                <span className="text-xs text-gray-500">
                                  {new Date(commenter.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{commenter.comment_text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p>No comments yet</p>
                      <p className="text-xs">Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Comment Input Section */}
      {showCommentInput && (
        <div className="enterprise-engagement-comment-input bg-gray-50 rounded-lg p-3 border border-2 border-green-300 shadow-lg">
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
                  className="text-gray-500 hover:text-gray-700 hover:bg-secondary"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="bg-primary hover:bg-secondary text-primary-foreground"
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