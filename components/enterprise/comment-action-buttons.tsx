'use client'

import React from 'react'
import { InlineLikeButton } from '@/components/enterprise/inline-like-button'
import type { EntityType } from '@/lib/engagement/config'

/**
 * CommentActionButtons
 *
 * Fully reusable Like/Reply inline action buttons for comments and replies.
 * Composes `InlineLikeButton` for the Like action so the same like behaviour
 * can be used independently elsewhere in the application.
 *
 * Uses the global `.hover-app-theme` and `.action-small-pad` CSS utility classes.
 */

export interface CommentActionButtonsProps {
  /** Entity (post/comment) ID used by the reaction popup */
  entityId: string
  /** Entity type for the engagement system */
  entityType: EntityType
  /** Formatted timestamp string to display */
  timestamp?: string
  /** Callback when Reply is clicked */
  onReplyClick?: () => void
  /** Extra className for the wrapper */
  className?: string
  /** Text size class override (default: "text-xs") */
  textSize?: string
  /** Whether to show the Like button (default: true) */
  showLike?: boolean
  /** Whether to show the Reply button (default: true) */
  showReply?: boolean
  /** Whether to show the timestamp (default: true) */
  showTimestamp?: boolean
}

export function CommentActionButtons({
  entityId,
  entityType,
  timestamp,
  onReplyClick,
  className,
  textSize = 'text-xs',
  showLike = true,
  showReply = true,
  showTimestamp = true,
}: CommentActionButtonsProps) {
  return (
    <div className={`flex items-center gap-3 ${textSize} text-gray-500 ${className ?? ''}`}>
      {showTimestamp && timestamp && <span>{timestamp}</span>}

      {showLike && (
        <InlineLikeButton entityId={entityId} entityType={entityType} />
      )}

      {showReply && (
        <button className="hover-app-theme action-small-pad" onClick={onReplyClick}>
          Reply
        </button>
      )}
    </div>
  )
}

export default CommentActionButtons
