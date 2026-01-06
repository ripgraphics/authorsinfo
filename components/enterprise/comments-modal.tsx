'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageCircle,
  X,
  User,
  Heart,
  Reply,
  MoreHorizontal,
  Image as ImageIcon,
  Link,
  Smile,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  currentUserAvatar?: string
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
  currentUserAvatar,
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

      const response = await fetch(
        `/api/engagement?entity_id=${entityId}&entity_type=${entityType}`
      )

      if (response.ok) {
        const data = await response.json()

        if (data.recent_comments && Array.isArray(data.recent_comments)) {
          setComments(data.recent_comments.slice(0, maxComments))
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
    if (!newComment.trim() || !onCommentSubmit) return

    try {
      setIsSubmitting(true)
      await onCommentSubmit(newComment.trim())
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
    if (!replyText.trim() || !onCommentReply) return

    try {
      setIsSubmitting(true)
      await onCommentReply(commentId, replyText.trim())
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        className={cn(
          'bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl',
          className
        )}
      >
        {/* Modal Header */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {title} ({commentCount})
                </h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex flex-col h-[calc(90vh-140px)]">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
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
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <EntityName
                              type="user"
                              id={comment.user.id}
                              name={comment.user.name}
                              className="text-sm font-semibold text-gray-900"
                            />
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {comment.comment_text}
                          </p>
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-2 ml-2">
                          <button
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
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
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                              onClick={() => setReplyingTo(comment.id)}
                            >
                              <Reply className="h-3 w-3" />
                              Reply
                            </button>
                          )}
                          <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                            <MoreHorizontal className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 ml-4">
                            <div className="flex gap-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write a reply..."
                                className="min-h-[60px] text-sm resize-none"
                                disabled={isSubmitting}
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
                                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <EntityName
                                        type="user"
                                        id={reply.user.id}
                                        name={reply.user.name}
                                        className="text-xs font-medium text-gray-900"
                                      />
                                      <span className="text-xs text-gray-400">
                                        {formatDate(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {reply.comment_text}
                                    </p>
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="flex items-center gap-3 mt-1 ml-2">
                                    <button
                                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
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
                <div className="text-gray-400 mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-500">Be the first to comment on this content!</p>
              </div>
            ) : null}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-red-900 mb-2">Error loading comments</h3>
                <p className="text-red-500">{error}</p>
                <Button variant="outline" onClick={fetchComments} className="mt-4">
                  Try again
                </Button>
              </div>
            )}
          </div>

          {/* Comment Input Section */}
          {allowCommenting && currentUserId && (
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
              <div className="flex gap-3">
                <Avatar
                  src={currentUserAvatar || '/placeholder.svg?height=32&width=32'}
                  alt={`${currentUserName || 'User'} avatar`}
                  name={currentUserName || 'User'}
                  className="w-8 h-8 flex-shrink-0"
                />
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="min-h-[80px] resize-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading comments...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
