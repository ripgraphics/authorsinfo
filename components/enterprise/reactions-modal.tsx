'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { UserInfoCard } from '@/components/user-info-card'
import { Button } from '@/components/ui/button'
import { Heart, AlertTriangle } from 'lucide-react'
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

interface ReactionModalUser {
  id: string
  user: ReactionUser['user']
  created_at: string
  reactionTypes: string[]
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
  title = 'Reactions',
  description = 'People who reacted to this content',
  className,
  onUserClick,
  onAddFriend,
  customReactionIcon,
  customReactionColor = 'from-red-500 to-pink-500',
  showReactionTypes = false,
  maxReactions = 50,
}) => {
  const [reactions, setReactions] = useState<ReactionModalUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch reactions for the entity
  const fetchReactions = useCallback(async () => {
    if (!isOpen || !entityId || !entityType) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/engagement/reactions/counts?entity_id=${entityId}&entity_type=${entityType}`,
        { cache: 'no-store' }
      )

      if (response.ok) {
        const data = await response.json()
        const usersByType: Record<string, ReactionUser[]> = data.users_by_type || {}
        const flattened = Object.entries(usersByType).flatMap(([reactionType, items]) =>
          (items || []).map((item) => ({
            ...item,
            reaction_type: reactionType,
          }))
        )

        const usersMap = new Map<string, ReactionModalUser>()

        flattened.forEach((item) => {
          const userId = item.user?.id
          if (!userId) return

          const existing = usersMap.get(userId)
          if (!existing) {
            usersMap.set(userId, {
              id: userId,
              user: item.user,
              created_at: item.created_at,
              reactionTypes: item.reaction_type ? [item.reaction_type] : [],
            })
            return
          }

          const existingDate = new Date(existing.created_at).getTime()
          const currentDate = new Date(item.created_at).getTime()
          if (currentDate > existingDate) {
            existing.created_at = item.created_at
          }

          if (item.reaction_type && !existing.reactionTypes.includes(item.reaction_type)) {
            existing.reactionTypes.push(item.reaction_type)
          }
        })

        const uniqueUsers = Array.from(usersMap.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, maxReactions)

        setReactions(uniqueUsers)
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

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={`${title} (${reactionCount})`}
      description={description}
      contentClassName={cn('max-w-2xl max-h-[90vh]', className)}
    >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto -mx-4 -mt-2 px-4 py-4">
            {!isLoading && !error && reactions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {reactions.map((reaction) => (
                  <div key={reaction.id}>
                    <UserInfoCard
                      userId={reaction.user.id}
                      userName={reaction.user.name}
                      userAvatarUrl={reaction.user.avatar_url}
                      showMessage={false}
                      showFollow={false}
                      showFriend={true}
                    />
                    {showReactionTypes && reaction.reactionTypes.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 ml-2 capitalize">
                        {reaction.reactionTypes.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : !isLoading && !error ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Heart className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No reactions yet</h3>
                <p className="text-muted-foreground">Be the first to react to this content!</p>
              </div>
            ) : null}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <div className="text-destructive mb-4">
                  <AlertTriangle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Error loading reactions</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={fetchReactions} className="mt-4">
                  Try again
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
              <p className="text-muted-foreground">Loading reactions...</p>
            </div>
          )}
        </div>
    </ReusableModal>
  )
}
