'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Heart, MessageCircle, ThumbsUp, Smile, Star, AlertTriangle, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useEntityEngagement, type EntityType, type ReactionType, type EngagementState } from '@/contexts/engagement-context'

export interface EngagementUser {
  id: string
  user: {
    id: string
    name: string
    avatar_url?: string
    location?: string
  }
  reaction_type?: string
  comment_text?: string
  created_at: string
}

export interface EngagementDisplayProps {
  entityId: string
  entityType: string
  reactionCount: number
  commentCount: number
  className?: string
  onReactionsClick?: () => void
  onCommentsClick?: () => void
  onUserClick?: (userId: string) => void
  onAddFriend?: (userId: string) => void
  customReactionIcon?: React.ReactNode
  customReactionColor?: string
  showReactionTypes?: boolean
  maxPreviewItems?: number
  showAddFriendButtons?: boolean
  showAnalytics?: boolean
  monetization?: {
    type: string
    amount?: string | number
    currency?: string
  }
  userReactionType?: string | null
}

const EngagementHoverPopup: React.FC<{
  title: string
  items: EngagementUser[]
  totalCount: number
  isLoading: boolean
  emptyMessage: string
  className?: string
}> = ({ title, items, totalCount, isLoading, emptyMessage, className }) => {
  return (
    <div
      style={{ backgroundColor: '#40A3D8' }}
      className={cn(
        'absolute bottom-full left-0 mb-2 px-4 py-3 border-none rounded-2xl shadow-2xl transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 min-w-40 max-h-80 overflow-y-auto',
        className
      )}
    >
      <div className="text-sm font-bold text-white mb-2 pb-1 border-b border-white/20">
        {title}
      </div>

      {!isLoading && items.length > 0 ? (
        <div className="space-y-0">
          {items.slice(0, 15).map((item) => {
            if (!item || !item.user) return null
            return (
              <div key={item.id} className="flex items-center gap-2 py-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-normal text-white truncate leading-tight">
                    {item.user?.name || 'Unknown User'}
                  </div>
                </div>
              </div>
            )
          })}
          {totalCount > 15 && (
            <div className="text-sm text-white font-normal pt-1 mt-1">
              and {totalCount - 15} more...
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-white/80 font-normal py-2 italic text-center">
          {isLoading ? 'Loading...' : emptyMessage}
        </div>
      )}
    </div>
  )
}

export const EngagementDisplay: React.FC<EngagementDisplayProps> = ({
  entityId,
  entityType,
  reactionCount,
  commentCount,
  className,
  onReactionsClick,
  onCommentsClick,
  onUserClick,
  onAddFriend,
  customReactionIcon,
  customReactionColor = 'from-red-500 to-pink-500',
  showReactionTypes = false,
  maxPreviewItems = 6,
  showAddFriendButtons = true,
  showAnalytics = false,
  monetization,
  userReactionType,
}) => {
  const { user } = useAuth()
  const { stats, currentReaction, batchUpdateEngagement } = useEntityEngagement(
    entityId,
    entityType as EntityType
  )
  const [reactions, setReactions] = useState<EngagementUser[]>([])
  const [comments, setComments] = useState<EngagementUser[]>([])
  const [isLoadingReactions, setIsLoadingReactions] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [internalReactionCount, setInternalReactionCount] = useState(reactionCount)
  const [internalCommentCount, setInternalCommentCount] = useState(commentCount)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  // Use context stats if they exist and are non-zero, or if we have no internal count yet
  const displayReactionCount =
    stats && (stats.reactionCount > 0 || !internalReactionCount)
      ? stats.reactionCount
      : internalReactionCount
  const displayCommentCount =
    stats && (stats.commentCount > 0 || !internalCommentCount)
      ? stats.commentCount
      : internalCommentCount

  // Update internal counts if props change
  useEffect(() => {
    setInternalReactionCount(reactionCount)
  }, [reactionCount])

  useEffect(() => {
    setInternalCommentCount(commentCount)
  }, [commentCount])

  // Sync baseline counts from props to global context
  useEffect(() => {
    if (entityId && entityType) {
      const updates: Partial<EngagementState> = {}

      // Update reaction count if context is empty/zero
      if (reactionCount > 0 && (!stats || stats.reactionCount === 0)) {
        updates.reactionCount = reactionCount
      }

      // Update comment count if context is empty/zero
      if (commentCount > 0 && (!stats || stats.commentCount === 0)) {
        updates.commentCount = commentCount
      }

      if (Object.keys(updates).length > 0) {
        batchUpdateEngagement([
          {
            entityId,
            entityType: entityType as EntityType,
            updates,
          },
        ])
      }
    }
  }, [entityId, entityType, reactionCount, commentCount, stats, batchUpdateEngagement])

  // Fetch engagement data
  const fetchEngagementData = useCallback(async () => {
    if (!entityId || !entityType) return

    try {
      setIsLoadingReactions(true)
      setIsLoadingComments(true)

      const response = await fetch(
        `/api/engagement?entity_id=${entityId}&entity_type=${entityType}`
      )

      if (response.ok) {
        const data = await response.json()

        if (data.ok || data.likes_count !== undefined) {
          const newLikesCount = typeof data.likes_count === 'number' ? data.likes_count : 0
          const newCommentsCount = typeof data.comments_count === 'number' ? data.comments_count : 0

          setInternalReactionCount(newLikesCount)
          setInternalCommentCount(newCommentsCount)

          // Sync with global engagement context
          batchUpdateEngagement([
            {
              entityId,
              entityType: entityType as EntityType,
              updates: {
                reactionCount: newLikesCount,
                commentCount: newCommentsCount,
              },
            },
          ])
        }

        if (data.recent_likes && Array.isArray(data.recent_likes)) {
          const slicedLikes = data.recent_likes.slice(0, maxPreviewItems)
          setReactions(slicedLikes)

          // Also sync user's reaction from the recent likes list if not already in context
          if (user) {
            const userLike = data.recent_likes.find((l: any) => l.user_id === user.id)
            if (userLike) {
              batchUpdateEngagement([
                {
                  entityId,
                  entityType: entityType as EntityType,
                  updates: {
                    userReaction: userLike.reaction_type as ReactionType,
                  },
                },
              ])
            }
          }
        }

        if (data.recent_comments && Array.isArray(data.recent_comments)) {
          setComments(data.recent_comments.slice(0, maxPreviewItems))
        }
      }
    } catch (error) {
      console.error('Error fetching engagement data:', error)
    } finally {
      setIsLoadingReactions(false)
      setIsLoadingComments(false)
    }
  }, [entityId, entityType, maxPreviewItems])

  // Fetch data on mount and whenever user's reaction changes
  useEffect(() => {
    fetchEngagementData()
  }, [fetchEngagementData, currentReaction])

  // Get reaction icon based on type
  const getReactionIcon = (reactionType?: string | null) => {
    switch (reactionType?.toLowerCase()) {
      case 'love':
        return <span className="text-[12px] leading-none">❤️</span>
      case 'like':
        return <span className="text-[12px] leading-none">👍</span>
      case 'care':
        return <span className="text-[12px] leading-none">🤗</span>
      case 'haha':
        return <span className="text-[12px] leading-none">😂</span>
      case 'wow':
        return <span className="text-[12px] leading-none">😮</span>
      case 'sad':
        return <span className="text-[12px] leading-none">😢</span>
      case 'angry':
        return <span className="text-[12px] leading-none">😠</span>
      default:
        return <span className="text-[12px] leading-none">👍</span>
    }
  }

  // Get reaction color based on type
  const getReactionColor = (reactionType?: string) => {
    switch (reactionType?.toLowerCase()) {
      case 'love':
        return 'bg-red-50/50'
      case 'like':
        return 'bg-blue-50/50'
      case 'care':
      case 'haha':
      case 'wow':
        return 'bg-yellow-50/50'
      case 'sad':
        return 'bg-blue-50/50'
      case 'angry':
        return 'bg-red-50/50'
      default:
        return 'bg-gray-50/50'
    }
  }

  // Handle user click
  const handleUserClick = (userId: string) => {
    if (onUserClick) {
      onUserClick(userId)
    } else {
      console.log('Navigate to user profile:', userId)
    }
  }

  // Handle add friend
  const handleAddFriend = (userId: string) => {
    if (onAddFriend) {
      onAddFriend(userId)
    } else {
      console.log('Send friend request to:', userId)
    }
  }

  return (
    <div
      className={cn(
        'engagement-display flex items-center justify-between px-4 py-2 border-b border-gray-100',
        className
      )}
    >
      <div className="engagement-left flex items-center gap-2">
        {/* Reactions Display */}
        {displayReactionCount > 0 && (
          <div className="engagement-reactions flex items-center relative group">
            <div className="flex items-center -space-x-1.5 mr-2">
              {Array.from(
                new Set([
                  ...reactions.map((r) => r.reaction_type || 'like'),
                  ...(currentReaction ? [currentReaction] : []),
                ])
              )
                .slice(0, 3)
                .map((type, idx) => (
                  <div
                    key={type}
                    onMouseEnter={() => setActiveFilter(type)}
                    onMouseLeave={() => setActiveFilter(null)}
                    className={cn(
                      'engagement-reaction-icon rounded-full p-0.5 z-[3] transition-transform hover:scale-110 cursor-pointer'
                    )}
                    style={{ zIndex: 10 - idx }}
                  >
                    <div>
                      {getReactionIcon(type)}
                    </div>
                  </div>
                ))}
            </div>
            <span
              className="engagement-reaction-count text-sm text-gray-500 hover:text-blue-600 cursor-pointer font-medium transition-colors duration-200"
              onClick={onReactionsClick}
              onMouseEnter={() => setActiveFilter(null)}
            >
              {displayReactionCount}
            </span>

            {/* Reusable hover popup for reactions */}
            <EngagementHoverPopup
              title={
                activeFilter
                  ? activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)
                  : (reactions.length > 0 && new Set(reactions.map(r => r.reaction_type)).size > 1
                    ? 'Reactions'
                    : (userReactionType ? userReactionType.charAt(0).toUpperCase() + userReactionType.slice(1) : 'Reactions'))
              }
              items={activeFilter ? reactions.filter(r => r.reaction_type === activeFilter) : reactions}
              totalCount={activeFilter ? reactions.filter(r => r.reaction_type === activeFilter).length : displayReactionCount}
              isLoading={isLoadingReactions}
              emptyMessage={activeFilter ? `No ${activeFilter} reactions` : 'No recent reactions'}
              className="opacity-0 group-hover:opacity-100"
            />
          </div>
        )}

        {/* Comments Display */}
        {displayCommentCount > 0 && (
          <div className="engagement-comments text-sm text-gray-600 hover:text-blue-600 cursor-pointer relative group transition-colors duration-200">
            <span
              onClick={onCommentsClick}
              className="cursor-pointer font-medium hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition-all duration-200"
            >
              {displayCommentCount} comment{displayCommentCount !== 1 ? 's' : ''}
            </span>

            {/* Reusable hover popup for comments */}
            <EngagementHoverPopup
              title="Recent Comments"
              items={comments}
              totalCount={displayCommentCount}
              isLoading={isLoadingComments}
              emptyMessage="No recent comments"
              className="opacity-0 group-hover:opacity-100 min-w-48"
            />
          </div>
        )}
      </div>

      <div className="engagement-right flex items-center gap-2">
        {showAnalytics && (
          <button className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 border border-gray-200">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Analytics
          </button>
        )}
        {monetization && (
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 shadow-xs">
            {monetization.type === 'subscription' && (
              <span className="uppercase tracking-wider mr-1">Premium</span>
            )}
            {monetization.amount && (
              <span>
                {monetization.currency || '$'}
                {monetization.amount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
