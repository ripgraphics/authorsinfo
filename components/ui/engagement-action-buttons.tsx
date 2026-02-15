'use client'

import React from 'react'
import { HorizontalScroller, ScrollerItem } from './horizontal-scroller'
import { Heart, MessageSquare, Share2, Bookmark } from 'lucide-react'

export interface EngagementActionButtonsProps {
  entityId: string
  commentCount?: number
  shareCount?: number
  bookmarkCount?: number
  isLiked?: boolean
  isCommented?: boolean
  isShared?: boolean
  isBookmarked?: boolean
  onLikeClick?: () => void
  onCommentClick?: () => void
  onShareClick?: () => void
  onBookmarkClick?: () => void
  className?: string
}

export function EngagementActionButtons({
  entityId,
  commentCount = 0,
  shareCount = 0,
  bookmarkCount = 0,
  isLiked = false,
  isCommented = false,
  isShared = false,
  isBookmarked = false,
  onLikeClick,
  onCommentClick,
  onShareClick,
  onBookmarkClick,
  className = '',
}: EngagementActionButtonsProps) {
  const actionItems: ScrollerItem[] = [
    {
      id: 'like',
      label: 'Like',
      icon: <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />,
      action: onLikeClick,
    },
    {
      id: 'comment',
      label: commentCount > 0 ? `Comment (${commentCount})` : 'Comment',
      icon: <MessageSquare className="h-5 w-5" />,
      action: onCommentClick,
    },
    {
      id: 'share',
      label: shareCount > 0 ? `Share (${shareCount})` : 'Share',
      icon: <Share2 className="h-5 w-5" />,
      action: onShareClick,
    },
    {
      id: 'bookmark',
      label: bookmarkCount > 0 ? `Bookmark (${bookmarkCount})` : 'Bookmark',
      icon: <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />,
      action: onBookmarkClick,
    },
  ]

  return (
    <HorizontalScroller
      items={actionItems}
      className={className}
      containerClassName="gap-0"
      itemClassName="border-b-2 border-transparent"
      showChevrons={true}
    />
  )
}
