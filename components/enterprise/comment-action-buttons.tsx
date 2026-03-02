'use client'

import React, { useState } from 'react'
import { InlineLikeButton } from '@/components/enterprise/inline-like-button'
import type { EntityType } from '@/lib/engagement/config'
import { ReactionSummary } from '@/components/enterprise/enterprise-reaction-popup'

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
  /** Whether to show the reaction summary (default: true) */
  showReactionSummary?: boolean
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
  showReactionSummary = true,
}: CommentActionButtonsProps) {
  const [reactionRefreshToken, setReactionRefreshToken] = useState(0)

  return (
    <div className={`flex items-center gap-3 ${textSize} text-gray-500 ${className ?? ''}`}>
      {showTimestamp && timestamp && <span>{timestamp}</span>}

      {showLike && (
        <InlineLikeButton
          entityId={entityId}
          entityType={entityType}
          onReactionChange={() => setReactionRefreshToken((previous) => previous + 1)}
        />
      )}

      {showReply && (
        <button className="hover-app-theme action-small-pad" onClick={onReplyClick}>
          Reply
        </button>
      )}

      {showReactionSummary && (
        <div className="reaction-summary-trigger" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ReactionSummary 
            entityId={entityId} 
            entityType={entityType} 
            maxReactions={4}
            refreshToken={reactionRefreshToken}
          />
        </div>
      )}
    </div>
  )
}

export default CommentActionButtons
