'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Reply, MoreHorizontal, Heart, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NestedCommentReply } from './nested-comment-reply'

interface CommentUser {
  id: string
  name: string
  avatar_url?: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at?: string
  user: CommentUser
  parent_comment_id?: string | null
  comment_depth: number
  thread_id: string
  reply_count: number
  replies?: Comment[]
}

interface NestedCommentThreadProps {
  comment: Comment
  entityType: string
  entityId: string
  postId: string
  onCommentUpdated: (updatedComment: Comment) => void
  className?: string
}

export function NestedCommentThread({
  comment,
  entityType,
  entityId,
  postId,
  onCommentUpdated,
  className,
}: NestedCommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleReplyClick = useCallback(() => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to reply to comments',
        variant: 'destructive',
      })
      return
    }
    setShowReplyForm(true)
  }, [user, toast])

  const handleReplyAdded = useCallback(
    (newReply: Comment) => {
      // Add the new reply to the comment's replies
      const updatedComment = {
        ...comment,
        replies: [...(comment.replies || []), newReply],
        reply_count: (comment.reply_count || 0) + 1,
      }

      onCommentUpdated(updatedComment)
      setShowReplyForm(false)
    },
    [comment, onCommentUpdated]
  )

  const handleReplyCancel = useCallback(() => {
    setShowReplyForm(false)
  }, [])

  const handleLikeClick = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like comments',
        variant: 'destructive',
      })
      return
    }

    // TODO: Implement comment like functionality
    setIsLiked(!isLiked)
    toast({
      title: isLiked ? 'Comment unliked' : 'Comment liked',
      description: isLiked ? 'You unliked this comment' : 'You liked this comment',
    })
  }, [user, isLiked, toast])

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
    return `${Math.floor(diffInSeconds / 31536000)}y ago`
  }, [])

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div
      className={cn(
        'space-y-3',
        comment.comment_depth > 0 && 'ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-4',
        className
      )}
    >
      {/* Main comment */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <EntityAvatar
            type="user"
            id={comment.user.id}
            name={comment.user.name}
            src={comment.user.avatar_url || undefined}
            size="md"
          />

          <div className="flex-1 min-w-0">
            {/* Comment header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <EntityName
                  type="user"
                  id={comment.user.id}
                  name={comment.user.name}
                  className="font-semibold text-sm text-gray-900 dark:text-gray-100"
                />
                <span className="text-xs text-gray-500">{formatTimestamp(comment.created_at)}</span>
                {comment.updated_at !== comment.created_at && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
              </div>

              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment content */}
            <div className="mb-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {comment.content}
              </p>
            </div>

            {/* Comment actions */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLikeClick}
                className={cn('h-8 px-2 text-xs', isLiked && 'text-red-500 hover:text-red-600')}
              >
                <Heart className={cn('h-3 w-3 mr-1', isLiked && 'fill-current')} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplyClick}
                className="h-8 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {hasReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-8 px-2 text-xs"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {showReplies ? 'Hide' : 'Show'} {comment.reply_count} replies
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <NestedCommentReply
          parentComment={comment}
          entityType={entityType}
          entityId={entityId}
          postId={postId}
          onReplyAdded={handleReplyAdded}
          onCancel={handleReplyCancel}
        />
      )}

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="space-y-3">
          {comment.replies!.map((reply) => (
            <NestedCommentThread
              key={reply.id}
              comment={reply}
              entityType={entityType}
              entityId={entityId}
              postId={postId}
              onCommentUpdated={onCommentUpdated}
            />
          ))}
        </div>
      )}

      {/* Show more replies button if there are more than displayed */}
      {comment.reply_count > (comment.replies?.length || 0) && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(true)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Show {comment.reply_count - (comment.replies?.length || 0)} more replies
          </Button>
        </div>
      )}
    </div>
  )
}
