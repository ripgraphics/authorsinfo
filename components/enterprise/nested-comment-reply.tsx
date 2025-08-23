'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Reply, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NestedCommentReplyProps {
  parentComment: {
    id: string
    content: string
    user: {
      id: string
      name: string
      avatar_url?: string | null
    }
    created_at: string
    comment_depth: number
    reply_count: number
  }
  entityType: string
  entityId: string
  postId: string
  onReplyAdded: (newReply: any) => void
  onCancel: () => void
  className?: string
}

export function NestedCommentReply({
  parentComment,
  entityType,
  entityId,
  postId,
  onReplyAdded,
  onCancel,
  className
}: NestedCommentReplyProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to reply to comments',
        variant: 'destructive'
      })
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: 'Reply cannot be empty',
        description: 'Please enter some content for your reply',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          entity_type: entityType,
          entity_id: entityId,
          parent_comment_id: parentComment.id
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: 'Reply posted successfully',
          description: 'Your reply has been added to the conversation',
        })
        
        // Call the callback with the new reply
        onReplyAdded(data.comment)
        
        // Reset form
        setReplyContent('')
        onCancel()
      } else {
        throw new Error(data.error || 'Failed to post reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      toast({
        title: 'Error posting reply',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [replyContent, user, postId, entityType, entityId, parentComment.id, onReplyAdded, onCancel, toast])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  if (!user) {
    return null
  }

  return (
    <div className={cn(
      "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500",
      "ml-4", // Indent based on parent comment depth
      className
    )}>
      {/* Reply header */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
        <Reply className="h-4 w-4" />
        <span>Replying to</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {parentComment.user.name}
        </span>
      </div>

      {/* Parent comment preview */}
      <div className="bg-white dark:bg-gray-700 rounded p-3 mb-3 border">
        <div className="flex items-start gap-2">
          <Avatar
            src={parentComment.user.avatar_url}
            alt={parentComment.user.name}
            name={parentComment.user.name}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {parentComment.user.name}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(parentComment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {parentComment.content}
            </p>
          </div>
        </div>
      </div>

      {/* Reply input */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Avatar
            src={user.user_metadata?.avatar_url}
            alt={user.user_metadata?.full_name || user.email}
            name={user.user_metadata?.full_name || user.email}
            size="sm"
          />
          <div className="flex-1">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Reply to ${parentComment.user.name}...`}
              className="min-h-[80px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="h-8 px-3"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !replyContent.trim()}
                  size="sm"
                  className="h-8 px-3"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
