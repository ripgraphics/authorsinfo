'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { ReusableModal } from '@/components/ui/reusable-modal'
import { UserInfoCard } from '@/components/user-info-card'
import { Button } from '@/components/ui/button'
import { HorizontalScroller } from '@/components/ui/horizontal-scroller'
import { Heart, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStats } from '@/hooks/useUserStats'
import { useAuth } from '@/hooks/useAuth'

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

// helper row component for each user
const ReactionUserRow: React.FC<{ user: ReactionModalUser; activeFilter: string; currentUserId?: string; showReactionTypes: boolean }> = ({
  user,
  activeFilter,
  currentUserId,
  showReactionTypes,
}) => {
  const { userStats } = useUserStats(user.user.id, { currentUserId })
  return (
    <div className="reactions-modal__user-row">
      <UserInfoCard
        userId={user.user.id}
        userName={user.user.name}
        userAvatarUrl={user.user.avatar_url}
        // in this modal we allow messaging friends, so enable the button and
        // let UserInfoCard decide based on the friend status it fetches itself
        showMessage={true}
        showFollow={false}
        showFriend={true}
        showMoreOptions={false}
        avatarSize="sm"
        mutualFriendsCount={userStats?.mutualFriendsCount}
        reactionType={activeFilter === 'all' ? (user.reactionTypes[0] || null) : activeFilter}
        reactionTypes={showReactionTypes ? user.reactionTypes : []}
      />
    </div>
  )
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
  const { user: currentUser } = useAuth()

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
        <span className="reactions-modal__title-container">
          {title} ({reactionCount})
          <span className={cn('reactions-modal__title-description', 'ml-2 text-sm font-normal text-muted-foreground')}>
            {description} <span className={cn('reactions-modal__title-count', 'font-semibold text-foreground')}>({totalPeopleReacted})</span>
          </span>
        </span>
      }
      description={undefined}
      contentClassName={cn('reactions-modal', 'w-full max-w-4xl max-h-[90vh]', className)}
    >
        <div className={cn('reactions-modal__content-container', 'flex flex-col flex-1 min-h-0')}>
          <HorizontalScroller
          isTab={true}
          showChevrons={false}
          className={cn('reactions-modal__tabs-container', 'pb-3 text-sm')}
          itemClassName="gap-4"
        >
          <button
            type="button"
            onClick={() => setActiveReactionFilter('all')}
            className={cn(
              'reactions-modal__tab-button',
              'relative font-medium px-6 py-2 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeReactionFilter === 'all'
                ? 'text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            All
            {activeReactionFilter === 'all' && (
              <span className={cn('reactions-modal__tab-active-indicator', 'absolute left-0 right-0 -bottom-3 h-1 bg-app-theme-blue rounded-full')} />
            )}
          </button>
          {filteredReactionEntries.map(([type, cnt]) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveReactionFilter(type)}
              className={cn(
                'reactions-modal__tab-button',
                'relative flex items-center gap-1 px-4 py-2 rounded-md cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeReactionFilter === type
                  ? 'text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {getReactionEmoji(type)} {cnt}
              {activeReactionFilter === type && (
                <span className={cn('reactions-modal__tab-active-indicator', 'absolute left-0 right-0 -bottom-3 h-1 bg-app-theme-blue rounded-full')} />
              )}
            </button>
          ))}
        </HorizontalScroller>
          <div className={cn('reactions-modal__users-container', 'flex-1 min-h-0 overflow-y-auto -mx-4 -mt-2 px-4 py-4')}>
            {!isLoading && !error && displayedReactions.length > 0 ? (
              <div className={cn('reactions-modal__users-grid', 'grid grid-cols-1 md:grid-cols-2 gap-4')}>
                {displayedReactions.map((reaction) => (
                  <div key={reaction.id} className="reactions-modal__user-item">
                    <ReactionUserRow 
                      user={reaction} 
                      activeFilter={activeReactionFilter} 
                      currentUserId={currentUser?.id} 
                      showReactionTypes={showReactionTypes} 
                    />
                  </div>
                ))}
              </div>
            ) : !isLoading && !error ? (
              <div className={cn('reactions-modal__empty-state', 'text-center py-12')}>
                <div className={cn('reactions-modal__empty-icon-container', 'text-muted-foreground mb-4')}>
                  <Heart className={cn('reactions-modal__empty-icon', 'h-16 w-16 mx-auto')} />
                </div>
                <h3 className={cn('reactions-modal__empty-title', 'text-lg font-medium text-foreground mb-2')}>No reactions yet</h3>
                <p className={cn('reactions-modal__empty-description', 'text-muted-foreground')}>Be the first to react to this content!</p>
              </div>
            ) : null}

            {/* Error State */}
            {error && (
              <div className={cn('reactions-modal__error-state', 'text-center py-12')}>
                <div className={cn('reactions-modal__error-icon-container', 'text-destructive mb-4')}>
                  <AlertTriangle className={cn('reactions-modal__error-icon', 'h-16 w-16 mx-auto')} />
                </div>
                <h3 className={cn('reactions-modal__error-title', 'text-lg font-medium text-foreground mb-2')}>Error loading reactions</h3>
                <p className={cn('reactions-modal__error-description', 'text-muted-foreground')}>{error}</p>
                <Button variant="outline" onClick={fetchReactions} className={cn('reactions-modal__error-button', 'mt-4')}>
                  Try again
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={cn('reactions-modal__loading-state', 'px-4 py-8 text-center')}>
              <div className={cn('reactions-modal__loading-spinner', 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3')} />
              <p className={cn('reactions-modal__loading-text', 'text-muted-foreground')}>Loading reactions...</p>
            </div>
          )}
        </div>
    </ReusableModal>
  )
}
