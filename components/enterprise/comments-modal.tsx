'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { Avatar } from '@/components/ui/avatar'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageCircle,
  Heart,
  Reply,
  MoreHorizontal,
  Image as ImageIcon,
  Link,
  Smile,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaggedTextRenderer } from '@/components/tags/tagged-text-renderer'
import { TagEnabledTextarea } from '@/components/tags/tag-enabled-textarea'

export interface Comment {
  id: string
  user: {
    id: string
    name: string
    avatar_url?: string
    location?: string
    is_online?: boolean
  }
  comment_text: string
  created_at: string
  updated_at?: string
  parent_comment_id?: string
  reply_count?: number
  user_has_liked?: boolean
  like_count?: number
  replies?: Comment[]
}

export interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  entityId: string
  entityType: string
  commentCount: number
  title?: string
  description?: string
  className?: string
  onUserClick?: (userId: string) => void
  onAddFriend?: (userId: string) => void
  onCommentSubmit?: (commentText: string, parentId?: string) => Promise<void>
  onCommentLike?: (commentId: string) => Promise<void>
  onCommentReply?: (commentId: string, replyText: string) => Promise<void>
  currentUserId?: string
  currentUserName?: string
  showReplies?: boolean
  maxComments?: number
  allowCommenting?: boolean
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  commentCount,
  title = 'Comments',
  description = 'Join the conversation about this content',
  className,
  onUserClick,
  onAddFriend,
  onCommentSubmit,
  onCommentLike,
  onCommentReply,
  currentUserId,
  currentUserName,
  showReplies = true,
  maxComments = 100,
  allowCommenting = true,
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Fetch comments for the entity
  const fetchComments = useCallback(async () => {
    if (!isOpen || !entityId || !entityType) return

    try {
      setIsLoading(true)
      setError(null)

      // Use /api/comments which returns nested replies and comment_text field
      const response = await fetch(
        `/api/comments?entity_id=${entityId}&entity_type=${entityType}`
      )

      if (response.ok) {
        const data = await response.json()

        if (data.data && Array.isArray(data.data)) {
          setComments(data.data.slice(0, maxComments))
        } else {
          setComments([])
        }
      } else {
        setError('Failed to fetch comments')
        setComments([])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Failed to fetch comments')
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, entityId, entityType, maxComments])

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, fetchComments])

  // Handle user click
  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId)
    } else {
      // Default behavior: navigate to user profile
      console.log('Navigate to user profile:', userId)
    }
  }

  // Handle add friend
  const handleAddFriend = (userId: string) => {
    if (onAddFriend) {
      onAddFriend(userId)
    } else {
      // Default behavior: send friend request
      console.log('Send friend request to:', userId)
    }
  }

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)

      if (onCommentSubmit) {
        await onCommentSubmit(newComment.trim())
      } else {
        // Self-contained comment: call engagement API
        const response = await fetch('/api/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_id: entityId,
            entity_type: entityType,
            engagement_type: 'comment',
            content: newComment.trim(),
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to submit comment')
        }
      }

      setNewComment('')
      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    if (!onCommentLike) return

    try {
      await onCommentLike(commentId)
      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  // Handle reply submission
  const handleReplySubmit = async (commentId: string) => {
    if (!replyText.trim()) return

    try {
      setIsSubmitting(true)

      if (onCommentReply) {
        await onCommentReply(commentId, replyText.trim())
      } else {
        // Self-contained reply: call engagement API with parent_id
        const response = await fetch('/api/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_id: entityId,
            entity_type: entityType,
            engagement_type: 'comment',
            content: replyText.trim(),
            parent_id: commentId,
          }),
        })
        if (!response.ok) {
          throw new Error('Failed to submit reply')
        }
      }

      setReplyText('')
      setReplyingTo(null)
      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={`${title} (${commentCount})`}
      description={description}
      contentClassName={cn('max-w-2xl max-h-[90vh]', className)}
    >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto -mx-4 -mt-2 px-4 py-4">
            {!isLoading && !error && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <div className="flex gap-3">
                      <EntityAvatar
                        type="user"
                        id={comment.user.id}
                        name={comment.user.name}
                        src={comment.user.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-2xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <EntityName
                              type="user"
                              id={comment.user.id}
                              name={comment.user.name}
                              avatar_url={comment.user.avatar_url}
                              className="text-sm font-semibold text-foreground"
                            />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <div className="text-sm text-foreground leading-relaxed">
                            <TaggedTextRenderer
                              text={comment.comment_text}
                              showPreviews={true}
                            />
                          </div>
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-2 ml-2">
                          <button
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                            onClick={() => handleCommentLike(comment.id)}
                          >
                            <Heart
                              className={cn(
                                'h-3 w-3',
                                comment.user_has_liked ? 'text-red-500 fill-current' : ''
                              )}
                            />
                            {comment.like_count || 0}
                          </button>
                          {showReplies && (
                            <button
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setReplyingTo(comment.id)}
                            >
                              <Reply className="h-3 w-3" />
                              Reply
                            </button>
                          )}
                          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-4">
                            <div className="flex gap-2">
                              <TagEnabledTextarea
                                value={replyText}
                                onChange={setReplyText}
                                placeholder="Write a reply..."
                                disabled={isSubmitting}
                                minHeight={60}
                                maxHeight={120}
                                allowMentions={true}
                                allowHashtags={true}
                                textareaClassName="min-h-[60px] text-sm resize-none border rounded-md"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={!replyText.trim() || isSubmitting}
                                className="self-end"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Nested Replies */}
                        {showReplies && comment.replies && comment.replies.length > 0 && (
                          <div className="ml-8 mt-3 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <EntityAvatar
                                  type="user"
                                  id={reply.user.id}
                                  name={reply.user.name}
                                  src={reply.user.avatar_url}
                                  size="xs"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-muted/50 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <EntityName
                                        type="user"
                                        id={reply.user.id}
                                        name={reply.user.name}
                                        avatar_url={reply.user.avatar_url}
                                        className="text-xs font-medium text-foreground"
                                      />
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(reply.created_at)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-foreground leading-relaxed">
                                      <TaggedTextRenderer
                                        text={reply.comment_text}
                                        showPreviews={true}
                                      />
                                    </div>
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="flex items-center gap-3 mt-1 ml-2">
                                    <button
                                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                                      onClick={() => handleCommentLike(reply.id)}
                                    >
                                      <Heart
                                        className={cn(
                                          'h-2.5 w-2.5',
                                          reply.user_has_liked ? 'text-red-500 fill-current' : ''
                                        )}
                                      />
                                      {reply.like_count || 0}
                                    </button>
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
            ) : !isLoading && !error ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No comments yet</h3>
                <p className="text-muted-foreground">Be the first to comment on this content!</p>
              </div>
            ) : null}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Error loading comments</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={fetchComments} className="mt-4">
                  Try again
                </Button>
              </div>
            )}
          </div>

          {/* Comment Input Section */}
          {allowCommenting && currentUserId && (
            <div className="flex-shrink-0 border-t border-border px-4 py-4 bg-muted">
              <div className="flex gap-3">
                <EntityAvatar
                  type="user"
                  id={currentUserId || 'current-user'}
                  name={currentUserName || 'User'}
                  size="sm"
                  className="w-8 h-8 flex-shrink-0"
                />
                <div className="flex-1 space-y-3">
                  <TagEnabledTextarea
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Write a comment..."
                    disabled={isSubmitting}
                    minHeight={80}
                    maxHeight={200}
                    allowMentions={true}
                    allowHashtags={true}
                    textareaClassName="min-h-[80px] resize-none border rounded-md"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCommentSubmit}
                      disabled={!newComment.trim() || isSubmitting}
                      className="px-4"
                    >
                      {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-muted-foreground">Loading comments...</p>
            </div>
          )}
        </div>
    </ReusableModal>
  )
}
