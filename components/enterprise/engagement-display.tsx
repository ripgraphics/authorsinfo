'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Heart, MessageCircle, ThumbsUp, Smile, Star, AlertTriangle, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

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
}) => {
  const { user } = useAuth()
  const [reactions, setReactions] = useState<EngagementUser[]>([])
  const [comments, setComments] = useState<EngagementUser[]>([])
  const [isLoadingReactions, setIsLoadingReactions] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)

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

        if (data.recent_likes && Array.isArray(data.recent_likes)) {
          setReactions(data.recent_likes.slice(0, maxPreviewItems))
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

  // Fetch data on mount
  useEffect(() => {
    fetchEngagementData()
  }, [fetchEngagementData])

  // Get reaction icon based on type
  const getReactionIcon = (reactionType?: string) => {
    if (customReactionIcon) return customReactionIcon

    switch (reactionType?.toLowerCase()) {
      case 'love':
        return <Heart className="h-3.5 w-3.5" />
      case 'like':
        return <ThumbsUp className="h-3.5 w-3.5" />
      case 'care':
        return <Heart className="h-3.5 w-3.5" />
      case 'haha':
        return <Smile className="h-3.5 w-3.5" />
      case 'wow':
        return <Star className="h-3.5 w-3.5" />
      case 'sad':
        return <AlertTriangle className="h-3.5 w-3.5" />
      case 'angry':
        return <Zap className="h-3.5 w-3.5" />
      default:
        return <Heart className="h-3.5 w-3.5" />
    }
  }

  // Get reaction color based on type
  const getReactionColor = (reactionType?: string) => {
    if (customReactionColor) return customReactionColor

    switch (reactionType?.toLowerCase()) {
      case 'love':
        return 'from-red-500 to-pink-500'
      case 'like':
        return 'from-blue-500 to-blue-600'
      case 'care':
        return 'from-yellow-500 to-orange-500'
      case 'haha':
        return 'from-yellow-400 to-yellow-500'
      case 'wow':
        return 'from-purple-500 to-pink-500'
      case 'sad':
        return 'from-blue-400 to-blue-500'
      case 'angry':
        return 'from-red-600 to-red-700'
      default:
        return 'from-red-500 to-pink-500'
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
        {reactionCount > 0 && (
          <div className="engagement-reactions flex items-center gap-2 relative group">
            <div
              className={cn(
                'engagement-reaction-icon rounded-full p-1.5 shadow-xs',
                `bg-gradient-to-r ${getReactionColor()}`
              )}
            >
              {customReactionIcon || <Heart className="h-3.5 w-3.5 text-white" />}
            </div>
            <span
              className="engagement-reaction-count text-sm text-gray-600 hover:text-red-600 cursor-pointer font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-all duration-200"
              onClick={onReactionsClick}
            >
              {reactionCount} like{reactionCount !== 1 ? 's' : ''}
            </span>

            {/* Enhanced Facebook-style hover dropdown for reactions */}
            <div className="absolute bottom-full left-0 mb-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 min-w-64 max-h-64 overflow-y-auto">
              <div className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                {customReactionIcon || <Heart className="h-4 w-4 text-red-500" />}
                People who liked this
              </div>

              {!isLoadingReactions && reactions.length > 0 ? (
                <div className="space-y-2">
                  {reactions.map((reaction) => {
                    if (!reaction || !reaction.user) return null
                    return (
                      <div
                        key={reaction.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                      >
                        <Avatar
                          src={reaction.user?.avatar_url || '/placeholder.svg?height=24&width=24'}
                          alt={`${reaction.user?.name || 'User'} avatar`}
                          name={reaction.user?.name || 'Unknown User'}
                          className="w-6 h-6 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {reaction.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {reaction.user?.location || 'Location not set'}
                          </div>
                          {showReactionTypes && reaction.reaction_type && (
                            <div className="flex items-center gap-1 mt-1">
                              {getReactionIcon(reaction.reaction_type)}
                              <span className="text-xs text-gray-400 capitalize">
                                {reaction.reaction_type}
                              </span>
                            </div>
                          )}
                        </div>
                        {user && showAddFriendButtons && reaction.user?.id && (
                          <button
                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-150 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            onClick={() => handleAddFriend(reaction.user.id)}
                          >
                            <User className="h-3 w-3" />
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {reactions.length > maxPreviewItems && (
                    <div className="text-xs text-blue-600 text-center pt-2 border-t border-gray-100">
                      +{reactions.length - maxPreviewItems} more people
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  {isLoadingReactions ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  ) : (
                    <Heart className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  )}
                  {isLoadingReactions ? 'Loading reactions...' : 'No reactions yet'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Display */}
        {commentCount > 0 && (
          <div className="engagement-comments text-sm text-gray-600 hover:text-blue-600 cursor-pointer relative group transition-colors duration-200">
            <span
              onClick={onCommentsClick}
              className="cursor-pointer font-medium hover:underline px-2 py-1 rounded-md hover:bg-blue-50 transition-all duration-200"
            >
              {commentCount} comment{commentCount !== 1 ? 's' : ''}
            </span>

            {/* Enhanced hover dropdown for comments */}
            <div className="absolute bottom-full left-0 mb-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 min-w-56 max-h-64 overflow-y-auto">
              <div className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                Recent Comments
              </div>

              {!isLoadingComments && comments.length > 0 ? (
                <div className="space-y-2">
                  {comments.map((comment) => {
                    if (!comment || !comment.user) return null
                    return (
                      <div
                        key={comment.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                      >
                        <Avatar
                          src={comment.user?.avatar_url || '/placeholder.svg?height=24&width=24'}
                          alt={`${comment.user?.name || 'User'} avatar`}
                          name={comment.user?.name || 'Unknown User'}
                          className="w-6 h-6 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 truncate">
                            {comment.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {comment.comment_text || ''}
                          </div>
                        </div>
                        {user && showAddFriendButtons && comment.user?.id && (
                          <button
                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-150 flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            onClick={() => handleAddFriend(comment.user.id)}
                          >
                            <User className="h-3 w-3" />
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {comments.length > maxPreviewItems && (
                    <div className="text-xs text-blue-600 text-center pt-2 border-t border-gray-100">
                      +{comments.length - maxPreviewItems} more comments
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  {isLoadingComments ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  ) : (
                    <MessageCircle className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                  )}
                  {isLoadingComments ? 'Loading comments...' : 'Loading comments...'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="engagement-right"></div>
    </div>
  )
}
