'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
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
  Image as ImageIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  entityDisplayInfo,
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
  const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
  const [canComment, setCanComment] = useState<boolean>(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentInputRef] = useState(useRef<HTMLDivElement>(null))
  const [supabase] = useState(() => supabaseClient)
  const { toast } = useToast()

  // Get current user
  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Get user data from the users table
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single()

        setCurrentUser({
          id: user.id,
          name: (userData as any)?.name || user.email,
          email: user.email,
          avatar_url: (user as any)?.avatar_url || null,
        })
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
  }

  // Permission check (owner/friends/followers depending on owner's privacy)
  const checkCanComment = useCallback(async () => {
    try {
      if (!entityId) return
      // Load activity owner
      const { data: activity } = await supabase
        .from('activities')
        .select('user_id')
        .eq('id', entityId)
        .maybeSingle()

      const ownerId = (activity as any)?.user_id || null
      setOwnerUserId(ownerId)
      if (!ownerId) {
        setCanComment(false)
        return
      }

      // If not signed in, cannot comment
      if (!currentUser?.id) {
        setCanComment(false)
        return
      }

      // Owner can always comment
      if (currentUser.id === ownerId) {
        setCanComment(true)
        return
      }

      // Determine owner's policy (default public per new system default)
      let postingPolicy: 'public' | 'followers' | 'friends' | 'private' = 'public'
      const { data: ownerPrivacy } = await supabase
        .from('user_privacy_settings')
        .select('default_privacy_level')
        .eq('user_id', ownerId)
        .maybeSingle()

      const level = (ownerPrivacy as any)?.default_privacy_level as string | undefined
      if (level === 'followers') postingPolicy = 'followers'
      else if (level === 'friends') postingPolicy = 'friends'
      else if (level === 'private') postingPolicy = 'private'
      else postingPolicy = 'public'

      // Relationship checks
      const [{ data: youFollow }, { data: theyFollow }] = await Promise.all([
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', currentUser.id)
          .eq('following_id', ownerId)
          .limit(1),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', ownerId)
          .eq('following_id', currentUser.id)
          .limit(1),
      ])

      const isFollower = (youFollow?.length || 0) > 0
      const isFriend = isFollower && (theyFollow?.length || 0) > 0
      const allowed =
        postingPolicy === 'public'
          ? true
          : postingPolicy === 'followers'
            ? isFollower || isFriend
            : postingPolicy === 'friends'
              ? isFriend
              : false
      setCanComment(allowed)
    } catch (e) {
      console.warn('Permission check failed; defaulting to no composer')
      setCanComment(false)
    }
  }, [entityId, supabase, currentUser])

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!entityId || !entityType) return

    setIsLoading(true)
    try {
      console.log('🔍 Fetching comments for:', { entityId, entityType })

      // Use existing unified engagement API for all entities
      const response = await fetch(
        `/api/engagement?entity_id=${entityId}&entity_type=${entityType}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('🔍 EntityComments: Raw API response:', data)

      if (data?.recent_comments && Array.isArray(data.recent_comments)) {
        console.log('🔍 EntityComments: Comments data from API:', data.recent_comments)
        // Map API shape from /api/engagement to component shape
        const mapped = data.recent_comments.map((c: any) => ({
          id: c.id,
          user_id: c.user_id,
          entity_type: entityType,
          entity_id: entityId,
          content: c.comment_text,
          parent_id: c.parent_comment_id ?? undefined,
          created_at: c.created_at,
          updated_at: c.updated_at,
          is_hidden: false,
          is_deleted: false,
          user: {
            id: c.user?.id || c.user_id,
            name: c.user?.name || 'User',
            avatar_url: c.user?.avatar_url,
          },
          replies: [],
        }))
        setComments(mapped)
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
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
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
      const response = await fetch('/api/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: entityId,
          entity_type: entityType,
          engagement_type: 'comment',
          content: newComment.trim(),
        }),
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
          avatar_url: currentUser.avatar_url,
        },
        replies: [],
        reaction_count: 0,
        user_reaction: undefined,
      }

      setComments((prev) => [newCommentObj, ...prev])
      setNewComment('')

      toast({
        title: 'Comment posted!',
        description: 'Your comment has been added',
        variant: 'default',
      })
    } catch (error) {
      console.error('❌ Error submitting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [newComment, currentUser, entityType, entityId, toast])

  // Handle reply submission
  const submitReply = useCallback(
    async (parentCommentId: string) => {
      if (!replyContent.trim() || !currentUser) return

      try {
        const response = await fetch('/api/engagement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_id: entityId,
            entity_type: entityType,
            engagement_type: 'comment',
            content: replyContent.trim(),
            parent_id: parentCommentId,
          }),
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
            avatar_url: currentUser.avatar_url,
          },
          replies: [],
          reaction_count: 0,
          user_reaction: undefined,
        }

        // Update comments with new reply
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentCommentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            }
            return comment
          })
        )

        setReplyContent('')
        setReplyingTo(null)

        toast({
          title: 'Reply posted!',
          description: 'Your reply has been added',
          variant: 'default',
        })
      } catch (error) {
        console.error('❌ Error submitting reply:', error)
        toast({
          title: 'Error',
          description: 'Failed to post reply. Please try again.',
          variant: 'destructive',
        })
      }
    },
    [replyContent, currentUser, entityType, entityId, toast]
  )

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
      year: 'numeric',
    })
  }

  // Load data on mount
  useEffect(() => {
    getCurrentUser()
    fetchComments()
  }, [fetchComments])

  // Recheck permissions when user/entity changes
  useEffect(() => {
    checkCanComment()
  }, [checkCanComment])

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

  // Hide entire section when there are no comments
  if (!isLoading && comments.length === 0) {
    return null
  }

  return (
    <div className="entity-comments-container bg-white rounded-lg border border-gray-200">
      {/* Comments Header */}
      <div className="entity-comments-header px-4 py-3 border-b border-gray-100">
        <h3 className="entity-comments-title text-lg font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Input Section (hidden per design; composer exists elsewhere) */}
      {false && currentUser && canComment && (
        <div className="entity-comment-input-section px-4 py-3 border-b border-gray-100">
          <div className="entity-comment-input-container flex items-center gap-3">
            {/* User Avatar */}
            <div className="entity-comment-avatar flex-shrink-0">
              <EntityAvatar
                type="user"
                id={currentUser.id}
                name={currentUser.name || currentUser.email}
                src={currentUser.avatar_url}
                size="sm"
              />
            </div>

            {/* Inline pill input with right-side quick icons */}
            <div className="flex-1 flex items-center gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Comment as ${currentUser.name || currentUser.email || 'You'}`}
                className="w-full min-h-[40px] max-h-32 resize-none border rounded-full px-4 py-2 text-sm bg-white border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500/25 focus:ring-offset-0 focus:border-transparent"
                rows={1}
                onKeyDown={handleCommentKeyDown}
                disabled={isSubmitting}
              />

              {/* Quick action icons (right of input) */}
              <div className="flex items-center gap-1 ml-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                  title="Add photo"
                  onClick={() => document.getElementById('entity-comment-file-input')?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                {/* GIF badge */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Add GIF"
                  className="h-8 px-2 rounded-full text-[10px] font-semibold text-gray-600 hover:text-gray-800"
                >
                  GIF
                </Button>
              </div>

              {/* Hidden file input for images */}
              <input
                id="entity-comment-file-input"
                type="file"
                accept="image/*"
                className="hidden"
              />

              {/* Submit */}
              <Button
                onClick={submitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="ml-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {currentUser && !canComment && (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-500">
            You cannot comment on this post due to the owner's privacy settings.
          </p>
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
                    <EntityAvatar
                      type="user"
                      id={comment.user.id}
                      name={comment.user.name}
                      src={comment.user.avatar_url}
                      size="sm"
                    />
                  </div>

                  {/* Comment Details */}
                  <div className="entity-comment-details flex-1 min-w-0">
                    {/* Comment Header */}
                    <div className="entity-comment-header flex items-center gap-2 mb-1">
                      <EntityName
                        type="user"
                        id={comment.user.id}
                        name={comment.user.name}
                        className="entity-comment-author font-medium text-sm text-gray-900"
                      />
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
                            <EntityAvatar
                              type="user"
                              id={currentUser?.id as string}
                              name={currentUser?.name || currentUser?.email}
                              src={currentUser?.avatar_url}
                              size="xs"
                            />
                          </div>

                          <div className="entity-reply-input-area flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="entity-reply-textarea w-full min-h-[32px] max-h-24 resize-none border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500/25 focus:ring-offset-0 focus:border-transparent"
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
                                className="entity-reply-submit-button bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-sm text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <div
                            key={reply.id}
                            className="entity-reply-item bg-gray-50 rounded-lg p-2"
                          >
                            <div className="entity-reply-content flex items-start gap-2">
                              <div className="entity-reply-avatar flex-shrink-0">
                                <EntityAvatar
                                  type="user"
                                  id={reply.user.id}
                                  name={reply.user.name}
                                  src={reply.user.avatar_url}
                                  size="xs"
                                />
                              </div>

                              <div className="entity-reply-details flex-1 min-w-0">
                                <div className="entity-reply-header flex items-center gap-2 mb-1">
                                  <EntityName
                                    type="user"
                                    id={reply.user.id}
                                    name={reply.user.name}
                                    className="entity-reply-author font-medium text-xs text-gray-900"
                                  />
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
