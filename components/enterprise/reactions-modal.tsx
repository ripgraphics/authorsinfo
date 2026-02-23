'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { UserInfoCard } from '@/components/user-info-card'
import { Button } from '@/components/ui/button'
import { Heart, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStats } from '@/hooks/useUserStats'

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

const REACTION_DISPLAY_ORDER = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'] as const

const getReactionEmoji = (type: string) =>
  type === 'love' ? '❤️' :
  type === 'like' ? '👍' :
  type === 'care' ? '🤗' :
  type === 'haha' ? '😂' :
  type === 'wow' ? '😮' :
  type === 'sad' ? '😢' :
  type === 'angry' ? '😠' : '👍'

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
  showReactionTypes = true,
  maxReactions = 50,
}) => {
  // helper row component for each user
  const ReactionUserRow: React.FC<{ user: ReactionModalUser }> = ({ user }) => {
    const { userStats } = useUserStats(user.user.id)
    return (
      <div>
        <UserInfoCard
          userId={user.user.id}
          userName={user.user.name}
          userAvatarUrl={user.user.avatar_url}
          showMessage={false}
          showFollow={false}
          showFriend={true}
          avatarSize="sm"
          mutualFriendsCount={userStats?.mutualFriendsCount}
          reactionType={user.reactionTypes[0] || null}
        />
        {showReactionTypes && user.reactionTypes.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 ml-2 capitalize">
            {user.reactionTypes.join(', ')}
          </p>
        )}
      </div>
    )
  }
  const [reactions, setReactions] = useState<ReactionModalUser[]>([])
  const [usersByReactionType, setUsersByReactionType] = useState<Record<string, ReactionModalUser[]>>({})
  const [activeReactionFilter, setActiveReactionFilter] = useState<string>('all')
  const [totalPeopleReacted, setTotalPeopleReacted] = useState(0)
  const [reactionCounts, setReactionCounts] = useState<Record<string, number> | null>(null)
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
        setReactionCounts(data.counts || null)
        const usersByType: Record<string, ReactionUser[]> = data.users_by_type || {}
        const mappedUsersByType: Record<string, ReactionModalUser[]> = {}

        Object.entries(usersByType).forEach(([reactionType, items]) => {
          const mapByUserId = new Map<string, ReactionModalUser>()

          ;(items || []).forEach((item) => {
            const userId = item.user?.id
            if (!userId) return

            const existing = mapByUserId.get(userId)
            if (!existing) {
              mapByUserId.set(userId, {
                id: userId,
                user: item.user,
                created_at: item.created_at,
                reactionTypes: [reactionType],
              })
              return
            }

            const existingDate = new Date(existing.created_at).getTime()
            const currentDate = new Date(item.created_at).getTime()
            if (currentDate > existingDate) {
              existing.created_at = item.created_at
            }
          })

          mappedUsersByType[reactionType] = Array.from(mapByUserId.values())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, maxReactions)
        })

        setUsersByReactionType(mappedUsersByType)
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

        setTotalPeopleReacted(usersMap.size)
        setReactions(uniqueUsers)
      } else {
        setError('Failed to fetch reactions')
        setUsersByReactionType({})
        setTotalPeopleReacted(0)
        setReactions([])
      }
    } catch (error) {
      console.error('Error fetching reactions:', error)
      setError('Failed to fetch reactions')
      setUsersByReactionType({})
      setTotalPeopleReacted(0)
      setReactions([])
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, entityId, entityType, maxReactions])

  // Fetch reactions when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveReactionFilter('all')
      fetchReactions()
    }
  }, [isOpen, fetchReactions])

  const filteredReactionEntries = reactionCounts
    ? Object.entries(reactionCounts)
        .filter(([, cnt]) => cnt > 0)
        .sort(([a], [b]) => {
          const aIndex = REACTION_DISPLAY_ORDER.indexOf(a as (typeof REACTION_DISPLAY_ORDER)[number])
          const bIndex = REACTION_DISPLAY_ORDER.indexOf(b as (typeof REACTION_DISPLAY_ORDER)[number])
          const normalizedAIndex = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
          const normalizedBIndex = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex
          return normalizedAIndex - normalizedBIndex
        })
    : []

  const displayedReactions =
    activeReactionFilter === 'all' ? reactions : (usersByReactionType[activeReactionFilter] || [])

  return (
    <ReusableModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose() }}
      title={
        <span>
          {title} ({reactionCount})
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {description} <span className="font-semibold text-foreground">({totalPeopleReacted})</span>
          </span>
        </span>
      }
      description={undefined}
      contentClassName={cn('w-full max-w-4xl max-h-[90vh]', className)}
    >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="pb-3 flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setActiveReactionFilter('all')}
              className={cn(
                'relative font-medium px-6 py-2 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeReactionFilter === 'all'
                  ? 'text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              All
              {activeReactionFilter === 'all' && (
                <span className="absolute left-0 right-0 -bottom-3 h-1 bg-app-theme-blue rounded-full" />
              )}
            </button>
            {filteredReactionEntries.map(([type, cnt]) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveReactionFilter(type)}
                className={cn(
                  'relative flex items-center gap-1 px-4 py-2 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeReactionFilter === type
                    ? 'text-foreground'
                    : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {getReactionEmoji(type)} {cnt}
                {activeReactionFilter === type && (
                  <span className="absolute left-0 right-0 -bottom-3 h-1 bg-app-theme-blue rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-4 -mt-2 px-4 py-4">
            {!isLoading && !error && displayedReactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedReactions.map((reaction) => (
                  <div key={reaction.id}>
                    <UserInfoCard
                      userId={reaction.user.id}
                      userName={reaction.user.name}
                      userAvatarUrl={reaction.user.avatar_url}
                      avatarSize="sm"
                      reactionType={
                        activeReactionFilter === 'all'
                          ? (reaction.reactionTypes[0] || null)
                          : activeReactionFilter
                      }
                      reactionTypes={showReactionTypes ? reaction.reactionTypes : []}
                      showMessage={false}
                      showFollow={false}
                      showFriend={true}
                    />
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
