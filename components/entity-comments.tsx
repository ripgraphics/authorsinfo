'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { UserHoverCard } from '@/components/entity-hover-cards'
import { EntityHoverCard } from '@/components/entity-hover-cards'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Download, 
  Send,
  MoreVertical,
  Reply,
  Flag,
  Trash2,
  ChevronDown,
  Users,
  ThumbsUp,
  Smile,
  Image as ImageIcon
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  user_id: string
  entity_type: string
  entity_id: string
  content: string
  parent_id?: string
  created_at: string
  updated_at?: string
  is_hidden: boolean
  is_deleted: boolean
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  replies?: Comment[]
  reaction_count?: number
  user_reaction?: string
}

interface EntityCommentsProps {
  entityId: string
  entityType: string
  entityName?: string
  entityAvatar?: string
  entityCreatedAt?: string
  isOwner?: boolean
  entityDisplayInfo?: {
    name: string
    avatar?: string
    type: string
  }
}

export default function EntityComments({
  entityId,
  entityType,
  entityName,
  entityAvatar,
  entityCreatedAt,
  isOwner,
  entityDisplayInfo
}: EntityCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [shareCount, setShareCount] = useState(0)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentInputRef] = useState(useRef<HTMLDivElement>(null))
  const [supabase] = useState(() => supabaseClient)
  const { toast } = useToast()

  // Get current user
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user data from the users table
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()
        
        setCurrentUser({
          id: user.id,
          name: userData?.name || user.email,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url
        })
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!entityId || !entityType) return
    
    setIsLoading(true)
    try {
      console.log('🔍 Fetching comments for:', { entityId, entityType })
      
      const response = await fetch(`/api/engagement?entity_id=${entityId}&entity_type=${entityType}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 EntityComments: Raw API response:', data)
      
      if (data.comments && Array.isArray(data.comments)) {
        console.log('🔍 EntityComments: Comments data from API:', data.comments)
        setComments(data.comments)
      } else {
        console.log('🔍 EntityComments: No comments data or invalid format:', data)
        setComments([])
      }
      
      // Update engagement counts
      if (data.likes) {
        setLikeCount(data.likes.length || 0)
      }
      
    } catch (error) {
      console.error('❌ Error fetching comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityType, toast])

  // Submit new comment
  const submitComment = useCallback(async () => {
    if (!newComment.trim() || !currentUser) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: newComment.trim()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Comment submitted:', result)

      // Add new comment to local state
      const newCommentObj: Comment = {
        id: result.comment_id || `comment-${Date.now()}`,
        user_id: currentUser.id,
        entity_type: entityType,
        entity_id: entityId,
        content: newComment.trim(),
        parent_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        is_deleted: false,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          avatar_url: currentUser.avatar_url
        },
        replies: [],
        reaction_count: 0,
        user_reaction: undefined
      }

      setComments(prev => [newCommentObj, ...prev])
      setNewComment('')
      
      toast({
        title: "Comment posted!",
        description: "Your comment has been added",
        variant: "default"
      })

    } catch (error) {
      console.error('❌ Error submitting comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, currentUser, entityType, entityId, toast])

  // Handle reply submission
  const submitReply = useCallback(async (parentCommentId: string) => {
    if (!replyContent.trim() || !currentUser) return
    
    try {
      const response = await fetch('/api/engagement/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          comment_text: replyContent.trim(),
          parent_id: parentCommentId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Reply submitted:', result)

      // Add new reply to local state
      const newReply: Comment = {
        id: result.comment_id || `reply-${Date.now()}`,
        user_id: currentUser.id,
        entity_type: entityType,
        entity_id: entityId,
        content: replyContent.trim(),
        parent_id: parentCommentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_hidden: false,
        is_deleted: false,
        user: {
          id: currentUser.id,
          name: currentUser.name,
          avatar_url: currentUser.avatar_url
        },
        replies: [],
        reaction_count: 0,
        user_reaction: undefined
      }

      // Update comments with new reply
      setComments(prev => prev.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        }
        return comment
      }))

      setReplyContent('')
      setReplyingTo(null)
      
      toast({
        title: "Reply posted!",
        description: "Your reply has been added",
        variant: "default"
      })

    } catch (error) {
      console.error('❌ Error submitting reply:', error)
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive"
      })
    }
  }, [replyContent, currentUser, entityType, entityId, toast])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Load data on mount
  useEffect(() => {
    getCurrentUser()
    fetchComments()
  }, [fetchComments])

  // Handle Enter key in comment input
  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitComment()
    }
  }

  // Handle Enter key in reply input
  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (replyingTo) {
        submitReply(replyingTo)
      }
    }
  }

  return (
    <div className="entity-comments-container bg-white rounded-lg border border-gray-200">
      {/* Comments Header */}
      <div className="entity-comments-header px-4 py-3 border-b border-gray-100">
        <h3 className="entity-comments-title text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Input Section */}
      {currentUser && (
        <div className="entity-comment-input-section px-4 py-3 border-b border-gray-100">
          <div className="entity-comment-input-container flex items-start gap-3">
            {/* User Avatar */}
            <div className="entity-comment-avatar flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt="User avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {currentUser.name?.[0] || currentUser.email?.[0] || 'U'}
                  </span>
                )}
              </div>
            </div>

            {/* Comment Input Area */}
            <div className="entity-comment-input-area flex-1">
              <div className="entity-comment-input-wrapper relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="entity-comment-textarea w-full min-h-[40px] max-h-32 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  onKeyDown={handleCommentKeyDown}
                  disabled={isSubmitting}
                />
                
                {/* Comment Action Icons */}
                <div className="entity-comment-actions absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="entity-comment-action-icon p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="entity-comment-action-icon p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                    title="Add photo"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comment Submit Button */}
              <div className="entity-comment-submit mt-2 flex justify-end">
                <Button
                  onClick={submitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                  className="entity-comment-submit-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
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

      {/* Comments List */}
      <div className="entity-comments-list">
        {isLoading ? (
          <div className="entity-comments-loading px-4 py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="entity-comments-empty px-4 py-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-1">No comments yet</h4>
            <p className="text-gray-500">Be the first to comment!</p>
          </div>
        ) : (
          <div className="entity-comments-items divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="entity-comment-item px-4 py-3">
                <div className="entity-comment-content flex items-start gap-3">
                  {/* Comment Avatar */}
                  <div className="entity-comment-avatar flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      {comment.user.avatar_url ? (
                        <img 
                          src={comment.user.avatar_url} 
                          alt="User avatar" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {comment.user.name?.[0] || 'U'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Details */}
                  <div className="entity-comment-details flex-1 min-w-0">
                    {/* Comment Header */}
                    <div className="entity-comment-header flex items-center gap-2 mb-1">
                      <span className="entity-comment-author font-medium text-sm text-gray-900">
                        {comment.user.name}
                      </span>
                      <span className="entity-comment-timestamp text-xs text-gray-500">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>

                    {/* Comment Text */}
                    <div className="entity-comment-text text-sm text-gray-700 mb-2">
                      {comment.content}
                    </div>

                    {/* Comment Actions */}
                    <div className="entity-comment-actions flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="entity-comment-action text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="entity-comment-action text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Like
                      </Button>

                      <span className="entity-comment-timestamp text-xs text-gray-400">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="entity-reply-input mt-3">
                        <div className="entity-reply-input-container flex items-start gap-2">
                          <div className="entity-reply-avatar flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              {currentUser?.avatar_url ? (
                                <img 
                                  src={currentUser.avatar_url} 
                                  alt="User avatar" 
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium text-gray-600">
                                  {currentUser?.name?.[0] || currentUser?.email?.[0] || 'U'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="entity-reply-input-area flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="entity-reply-textarea w-full min-h-[32px] max-h-24 resize-none border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={1}
                              onKeyDown={handleReplyKeyDown}
                            />
                            
                            <div className="entity-reply-submit mt-2 flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyContent('')
                                }}
                                className="entity-reply-cancel text-xs text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => submitReply(comment.id)}
                                disabled={!replyContent.trim()}
                                size="sm"
                                className="entity-reply-submit-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="entity-comment-replies mt-3 ml-8 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="entity-reply-item bg-gray-50 rounded-lg p-2">
                            <div className="entity-reply-content flex items-start gap-2">
                              <div className="entity-reply-avatar flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  {reply.user.avatar_url ? (
                                    <img 
                                      src={reply.user.avatar_url} 
                                      alt="User avatar" 
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600">
                                      {reply.user.name?.[0] || 'U'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="entity-reply-details flex-1 min-w-0">
                                <div className="entity-reply-header flex items-center gap-2 mb-1">
                                  <span className="entity-reply-author font-medium text-xs text-gray-900">
                                    {reply.user.name}
                                  </span>
                                  <span className="entity-reply-timestamp text-xs text-gray-500">
                                    {formatTimestamp(reply.created_at)}
                                  </span>
                                </div>

                                <div className="entity-reply-text text-xs text-gray-700">
                                  {reply.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 