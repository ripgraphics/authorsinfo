'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import EntityName from '@/components/entity-name'
import EntityAvatar from '@/components/entity-avatar'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  X, 
  User,
  ThumbsUp,
  Smile,
  Star,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReactionUser {
  id: string
  user: {
    id: string
    name: string
    avatar_url?: string
    location?: string
    is_online?: boolean
  }
  reaction_type?: string
  created_at: string
}

export interface ReactionsModalProps {
  isOpen: boolean
  onClose: () => void
  entityId: string
  entityType: string
  reactionCount: number
  title?: string
  description?: string
  className?: string
  onUserClick?: (userId: string) => void
  onAddFriend?: (userId: string) => void
  customReactionIcon?: React.ReactNode
  customReactionColor?: string
  showReactionTypes?: boolean
  maxReactions?: number
}

export const ReactionsModal: React.FC<ReactionsModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  reactionCount,
  title = "Reactions",
  description = "People who reacted to this content",
  className,
  onUserClick,
  onAddFriend,
  customReactionIcon,
  customReactionColor = "from-red-500 to-pink-500",
  showReactionTypes = false,
  maxReactions = 50
}) => {
  const [reactions, setReactions] = useState<ReactionUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch reactions for the entity
  const fetchReactions = useCallback(async () => {
    if (!isOpen || !entityId || !entityType) return

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/engagement?entity_id=${entityId}&entity_type=${entityType}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.recent_likes && Array.isArray(data.recent_likes)) {
          setReactions(data.recent_likes.slice(0, maxReactions))
        } else {
          setReactions([])
        }
      } else {
        setError('Failed to fetch reactions')
        setReactions([])
      }
    } catch (error) {
      console.error('Error fetching reactions:', error)
      setError('Failed to fetch reactions')
      setReactions([])
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, entityId, entityType, maxReactions])

  // Fetch reactions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchReactions()
    }
  }, [isOpen, fetchReactions])

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

  // Get reaction icon based on type
  const getReactionIcon = (reactionType?: string) => {
    if (customReactionIcon) return customReactionIcon
    
    switch (reactionType?.toLowerCase()) {
      case 'love':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'like':
        return <ThumbsUp className="h-4 w-4 text-blue-500" />
      case 'care':
        return <Heart className="h-4 w-4 text-yellow-500" />
      case 'haha':
        return <Smile className="h-4 w-4 text-yellow-500" />
      case 'wow':
        return <Star className="h-4 w-4 text-purple-500" />
      case 'sad':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case 'angry':
        return <Zap className="h-4 w-4 text-red-600" />
      default:
        return <Heart className="h-4 w-4 text-red-500" />
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={cn(
        "bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl",
        className
      )}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                `bg-gradient-to-r ${getReactionColor()}`
              )}>
                {customReactionIcon || <Heart className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {title} ({reactionCount})
                </h3>
                <p className="text-sm text-gray-500">
                  {description}
                </p>
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
          {/* Reactions List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!isLoading && !error && reactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reactions.map((reaction) => (
                  <div 
                    key={reaction.id} 
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-100 hover:border-gray-200"
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      <EntityAvatar type="user" id={reaction.user.id} name={reaction.user.name} src={reaction.user.avatar_url} size="md" />
                      {/* Online Status Indicator */}
                      {reaction.user.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <EntityName type="user" id={reaction.user.id} name={reaction.user.name} className="text-sm font-semibold text-gray-900 block truncate" />
                          <p className="text-xs text-gray-500 mt-1">
                            {reaction.user.location || 'Location not set'}
                          </p>
                          {showReactionTypes && reaction.reaction_type && (
                            <div className="flex items-center gap-1 mt-1">
                              {getReactionIcon(reaction.reaction_type)}
                              <span className="text-xs text-gray-400 capitalize">
                                {reaction.reaction_type}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Add Friend Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center gap-1.5"
                          onClick={() => handleAddFriend(reaction.user.id)}
                        >
                          <User className="h-3 w-3" />
                          Add friend
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !isLoading && !error ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Heart className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reactions yet</h3>
                <p className="text-gray-500">Be the first to react to this content!</p>
              </div>
            ) : null}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <AlertTriangle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-red-900 mb-2">Error loading reactions</h3>
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  onClick={fetchReactions}
                  className="mt-4"
                >
                  Try again
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading reactions...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
