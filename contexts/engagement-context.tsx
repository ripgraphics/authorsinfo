'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// ENTERPRISE-GRADE TYPE DEFINITIONS (from engagement config — single source of truth)
// ============================================================================

import type { EntityType, ReactionType } from '@/lib/engagement/config'

export type { EntityType, ReactionType }

export type EngagementAction = 'reaction' | 'comment' | 'share' | 'bookmark' | 'view' | 'follow'

export interface EngagementState {
  entityId: string
  entityType: EntityType
  reactionCount: number
  commentCount: number
  shareCount: number
  bookmarkCount: number
  viewCount: number
  userReaction: ReactionType | null
  userHasCommented: boolean
  userHasShared: boolean
  userHasBookmarked: boolean
  userHasViewed: boolean
  isLoading: boolean
  error: string | null
}

export interface EngagementContextState {
  entities: Map<string, EngagementState>
  globalLoading: boolean
  globalError: string | null
}

export interface EngagementContextValue extends EngagementContextState {
  // Core engagement functions
  getEngagement: (entityId: string, entityType: EntityType) => EngagementState | null
  setReaction: (
    entityId: string,
    entityType: EntityType,
    reactionType: ReactionType
  ) => Promise<boolean>
  removeReaction: (entityId: string, entityType: EntityType) => Promise<boolean>
  addComment: (entityId: string, entityType: EntityType, commentText: string) => Promise<boolean>
  shareEntity: (entityId: string, entityType: EntityType) => Promise<boolean>
  bookmarkEntity: (entityId: string, entityType: EntityType) => Promise<boolean>
  viewEntity: (entityId: string, entityType: EntityType) => Promise<boolean>

  // Bulk operations
  batchUpdateEngagement: (
    updates: Array<{ entityId: string; entityType: EntityType; updates: Partial<EngagementState> }>
  ) => void

  // Utility functions
  isEntityEngaged: (entityId: string, entityType: EntityType) => boolean
  getEntityReaction: (entityId: string, entityType: EntityType) => ReactionType | null
  getEntityStats: (
    entityId: string,
    entityType: EntityType
  ) => { reactionCount: number; commentCount: number; shareCount: number }

  // State management
  resetEntity: (entityId: string, entityType: EntityType) => void
  resetAll: () => void
}

// ============================================================================
// REDUCER FOR STATE MANAGEMENT
// ============================================================================

type EngagementActionType =
  | {
    type: 'SET_ENTITY_ENGAGEMENT'
    payload: { entityId: string; entityType: EntityType; state: Partial<EngagementState> }
  }
  | {
    type: 'SET_REACTION'
    payload: { entityId: string; entityType: EntityType; reactionType: ReactionType | null }
  }
  | {
    type: 'INCREMENT_COUNT'
    payload: {
      entityId: string
      entityType: EntityType
      countType: keyof Pick<
        EngagementState,
        'reactionCount' | 'commentCount' | 'shareCount' | 'bookmarkCount' | 'viewCount'
      >
    }
  }
  | {
    type: 'DECREMENT_COUNT'
    payload: {
      entityId: string
      entityType: EntityType
      countType: keyof Pick<
        EngagementState,
        'reactionCount' | 'commentCount' | 'shareCount' | 'bookmarkCount' | 'viewCount'
      >
    }
  }
  | { type: 'SET_LOADING'; payload: { entityId: string; entityType: EntityType; loading: boolean } }
  | {
    type: 'SET_ERROR'
    payload: { entityId: string; entityType: EntityType; error: string | null }
  }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | { type: 'SET_GLOBAL_ERROR'; payload: string | null }
  | { type: 'RESET_ENTITY'; payload: { entityId: string; entityType: EntityType } }
  | { type: 'RESET_ALL' }

function engagementReducer(
  state: EngagementContextState,
  action: EngagementActionType
): EngagementContextState {
  switch (action.type) {
    case 'RESET_ALL':
      return {
        entities: new Map(),
        globalLoading: false,
        globalError: null,
      }

    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload }

    case 'SET_GLOBAL_ERROR':
      return { ...state, globalError: action.payload }
    case 'SET_ENTITY_ENGAGEMENT': {
      const { entityId, entityType, state: newState } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      const updatedEntities = new Map(state.entities)
      updatedEntities.set(key, {
        entityId,
        entityType,
        reactionCount: 0,
        commentCount: 0,
        shareCount: 0,
        bookmarkCount: 0,
        viewCount: 0,
        userReaction: null,
        userHasCommented: false,
        userHasShared: false,
        userHasBookmarked: false,
        userHasViewed: false,
        isLoading: false,
        error: null,
        ...existing,
        ...newState,
      })

      return { ...state, entities: updatedEntities }
    }

    case 'SET_REACTION': {
      const { entityId, entityType, reactionType } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      const updatedEntities = new Map(state.entities)
      const baseState = existing ?? {
        entityId,
        entityType,
        reactionCount: 0,
        commentCount: 0,
        shareCount: 0,
        bookmarkCount: 0,
        viewCount: 0,
        userReaction: null,
        userHasCommented: false,
        userHasShared: false,
        userHasBookmarked: false,
        userHasViewed: false,
        isLoading: false,
        error: null,
      }
      updatedEntities.set(key, {
        ...baseState,
        userReaction: reactionType,
        reactionCount: reactionType
          ? baseState.reactionCount + 1
          : Math.max(0, baseState.reactionCount - 1),
      })

      return { ...state, entities: updatedEntities }
    }

    case 'INCREMENT_COUNT': {
      const { entityId, entityType, countType } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      if (!existing) return state

      const updatedEntities = new Map(state.entities)
      updatedEntities.set(key, {
        ...existing,
        [countType]: existing[countType] + 1,
      })

      return { ...state, entities: updatedEntities }
    }

    case 'DECREMENT_COUNT': {
      const { entityId, entityType, countType } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      if (!existing) return state

      const updatedEntities = new Map(state.entities)
      updatedEntities.set(key, {
        ...existing,
        [countType]: Math.max(0, existing[countType] - 1),
      })

      return { ...state, entities: updatedEntities }
    }

    case 'SET_LOADING': {
      const { entityId, entityType, loading } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      if (!existing) return state

      const updatedEntities = new Map(state.entities)
      updatedEntities.set(key, { ...existing, isLoading: loading })

      return { ...state, entities: updatedEntities }
    }

    case 'SET_ERROR': {
      const { entityId, entityType, error } = action.payload
      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)

      if (!existing) return state

      const updatedEntities = new Map(state.entities)
      updatedEntities.set(key, { ...existing, error })

      return { ...state, entities: updatedEntities }
    }

    case 'SET_GLOBAL_LOADING':
      return { ...state, globalLoading: action.payload }

    case 'SET_GLOBAL_ERROR':
      return { ...state, globalError: action.payload }

    case 'RESET_ENTITY': {
      const { entityId, entityType } = action.payload
      const key = `${entityType}:${entityId}`
      const updatedEntities = new Map(state.entities)
      updatedEntities.delete(key)
      return { ...state, entities: updatedEntities }
    }

    default:
      return state
  }
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const EngagementContext = createContext<EngagementContextValue | undefined>(undefined)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface EngagementProviderProps {
  children: ReactNode
}

export function EngagementProvider({ children }: EngagementProviderProps) {
  const [state, dispatch] = useReducer(engagementReducer, {
    entities: new Map(),
    globalLoading: false,
    globalError: null,
  })

  const { user } = useAuth()
  const { toast } = useToast()

  // ============================================================================
  // CORE ENGAGEMENT FUNCTIONS
  // ============================================================================

  const getEngagement = useCallback(
    (entityId: string, entityType: EntityType): EngagementState | null => {
      const key = `${entityType}:${entityId}`
      return state.entities.get(key) || null
    },
    [state.entities]
  )

  const setReaction = useCallback(
    async (
      entityId: string,
      entityType: EntityType,
      reactionType: ReactionType
    ): Promise<boolean> => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to react to content',
          variant: 'destructive',
        })
        return false
      }

      const key = `${entityType}:${entityId}`
      const existing = state.entities.get(key)
      const currentReaction = existing?.userReaction

      try {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: true } })

        const response = await fetch('/api/engagement/reaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            reaction_type: reactionType,
          }),
        })

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`
          try {
            const errorResult = await response.json()
            if (errorResult.error) {
              errorMessage = errorResult.error
            }
          } catch (e) {
            // ignore parse error
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()

        if (result.success) {
          // Server is source of truth: use total_count and user_reaction from response when present
          const totalCount = typeof result.total_count === 'number' ? result.total_count : undefined
          const userReactionFromServer =
            result.user_reaction === null || typeof result.user_reaction === 'string'
              ? result.user_reaction
              : undefined

          if (totalCount !== undefined || userReactionFromServer !== undefined) {
            dispatch({
              type: 'SET_ENTITY_ENGAGEMENT',
              payload: {
                entityId,
                entityType,
                state: {
                  ...(totalCount !== undefined && { reactionCount: totalCount }),
                  ...(userReactionFromServer !== undefined && {
                    userReaction: userReactionFromServer as ReactionType | null,
                  }),
                },
              },
            })
          } else {
            // Fallback: derive from action (legacy path)
            if (currentReaction === reactionType) {
              dispatch({
                type: 'SET_REACTION',
                payload: { entityId, entityType, reactionType: null },
              })
            } else {
              dispatch({ type: 'SET_REACTION', payload: { entityId, entityType, reactionType } })
            }
          }

          if (currentReaction === reactionType) {
            toast({
              title: 'Reaction removed',
              description: 'Your reaction has been removed',
              variant: 'default',
            })
          } else {
            toast({
              title: 'Reaction added!',
              description: `You reacted with ${reactionType}!`,
              variant: 'default',
            })
          }

          return true
        } else {
          throw new Error(result.error || 'Failed to set reaction')
        }
      } catch (error) {
        console.error('Error setting reaction:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: {
            entityId,
            entityType,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        toast({
          title: 'Error',
          description: 'Failed to set reaction. Please try again.',
          variant: 'destructive',
        })

        return false
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: false } })
      }
    },
    [user, toast]
  )

  const removeReaction = useCallback(
    async (entityId: string, entityType: EntityType): Promise<boolean> => {
      const existing = state.entities.get(`${entityType}:${entityId}`)
      if (!existing?.userReaction) return true

      return setReaction(entityId, entityType, existing.userReaction)
    },
    [setReaction]
  )

  const addComment = useCallback(
    async (entityId: string, entityType: EntityType, commentText: string): Promise<boolean> => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to comment',
          variant: 'destructive',
        })
        return false
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: true } })

        const response = await fetch('/api/engagement/comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
            comment_text: commentText.trim(),
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          dispatch({
            type: 'INCREMENT_COUNT',
            payload: { entityId, entityType, countType: 'commentCount' },
          })
          dispatch({
            type: 'SET_ENTITY_ENGAGEMENT',
            payload: { entityId, entityType, state: { userHasCommented: true } },
          })

          toast({
            title: 'Comment posted!',
            description: 'Your comment has been added',
            variant: 'default',
          })

          return true
        } else {
          throw new Error(result.error || 'Failed to add comment')
        }
      } catch (error) {
        console.error('Error adding comment:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: {
            entityId,
            entityType,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        toast({
          title: 'Error',
          description: 'Failed to post comment. Please try again.',
          variant: 'destructive',
        })

        return false
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: false } })
      }
    },
    [user, toast]
  )

  const shareEntity = useCallback(
    async (entityId: string, entityType: EntityType): Promise<boolean> => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to share content',
          variant: 'destructive',
        })
        return false
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: true } })

        const response = await fetch('/api/engagement/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          dispatch({
            type: 'INCREMENT_COUNT',
            payload: { entityId, entityType, countType: 'shareCount' },
          })
          dispatch({
            type: 'SET_ENTITY_ENGAGEMENT',
            payload: { entityId, entityType, state: { userHasShared: true } },
          })

          toast({
            title: 'Content shared!',
            description: 'Your share has been recorded',
            variant: 'default',
          })

          return true
        } else {
          throw new Error(result.error || 'Failed to share content')
        }
      } catch (error) {
        console.error('Error sharing content:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: {
            entityId,
            entityType,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        toast({
          title: 'Error',
          description: 'Failed to share content. Please try again.',
          variant: 'destructive',
        })

        return false
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: false } })
      }
    },
    [user, toast]
  )

  const bookmarkEntity = useCallback(
    async (entityId: string, entityType: EntityType): Promise<boolean> => {
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to bookmark content',
          variant: 'destructive',
        })
        return false
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: true } })

        const response = await fetch('/api/engagement/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          const isBookmarked = result.action === 'added'
          if (isBookmarked) {
            dispatch({
              type: 'INCREMENT_COUNT',
              payload: { entityId, entityType, countType: 'bookmarkCount' },
            })
          } else {
            dispatch({
              type: 'DECREMENT_COUNT',
              payload: { entityId, entityType, countType: 'bookmarkCount' },
            })
          }

          dispatch({
            type: 'SET_ENTITY_ENGAGEMENT',
            payload: { entityId, entityType, state: { userHasBookmarked: isBookmarked } },
          })

          toast({
            title: isBookmarked ? 'Bookmarked!' : 'Bookmark removed',
            description: isBookmarked
              ? 'Content added to your bookmarks'
              : 'Content removed from bookmarks',
            variant: 'default',
          })

          return true
        } else {
          throw new Error(result.error || 'Failed to bookmark content')
        }
      } catch (error) {
        console.error('Error bookmarking content:', error)
        dispatch({
          type: 'SET_ERROR',
          payload: {
            entityId,
            entityType,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        toast({
          title: 'Error',
          description: 'Failed to bookmark content. Please try again.',
          variant: 'destructive',
        })

        return false
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { entityId, entityType, loading: false } })
      }
    },
    [user, toast]
  )

  const viewEntity = useCallback(
    async (entityId: string, entityType: EntityType): Promise<boolean> => {
      try {
        const response = await fetch('/api/engagement/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: entityType,
            entity_id: entityId,
          }),
        })

        if (response.ok) {
          dispatch({
            type: 'INCREMENT_COUNT',
            payload: { entityId, entityType, countType: 'viewCount' },
          })
          dispatch({
            type: 'SET_ENTITY_ENGAGEMENT',
            payload: { entityId, entityType, state: { userHasViewed: true } },
          })
          return true
        }

        return false
      } catch (error) {
        console.error('Error recording view:', error)
        return false
      }
    },
    []
  )

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  const batchUpdateEngagement = useCallback(
    (
      updates: Array<{
        entityId: string
        entityType: EntityType
        updates: Partial<EngagementState>
      }>
    ) => {
      updates.forEach(({ entityId, entityType, updates: newUpdates }) => {
        dispatch({
          type: 'SET_ENTITY_ENGAGEMENT',
          payload: { entityId, entityType, state: newUpdates },
        })
      })
    },
    []
  )

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const isEntityEngaged = useCallback(
    (entityId: string, entityType: EntityType): boolean => {
      const engagement = getEngagement(entityId, entityType)
      return !!(
        engagement?.userReaction ||
        engagement?.userHasCommented ||
        engagement?.userHasShared ||
        engagement?.userHasBookmarked
      )
    },
    [getEngagement]
  )

  const getEntityReaction = useCallback(
    (entityId: string, entityType: EntityType): ReactionType | null => {
      const engagement = getEngagement(entityId, entityType)
      return engagement?.userReaction || null
    },
    [getEngagement]
  )

  const getEntityStats = useCallback(
    (entityId: string, entityType: EntityType) => {
      const engagement = getEngagement(entityId, entityType)
      return {
        reactionCount: engagement?.reactionCount || 0,
        commentCount: engagement?.commentCount || 0,
        shareCount: engagement?.shareCount || 0,
      }
    },
    [getEngagement]
  )

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const resetEntity = useCallback((entityId: string, entityType: EntityType) => {
    dispatch({ type: 'RESET_ENTITY', payload: { entityId, entityType } })
  }, [])

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: EngagementContextValue = {
    ...state,
    getEngagement,
    setReaction,
    removeReaction,
    addComment,
    shareEntity,
    bookmarkEntity,
    viewEntity,
    batchUpdateEngagement,
    isEntityEngaged,
    getEntityReaction,
    getEntityStats,
    resetEntity,
    resetAll,
  }

  return <EngagementContext.Provider value={contextValue}>{children}</EngagementContext.Provider>
}

// ============================================================================
// HOOK FOR USING THE CONTEXT
// ============================================================================

export function useEngagement() {
  const context = useContext(EngagementContext)
  if (context === undefined) {
    throw new Error('useEngagement must be used within an EngagementProvider')
  }
  return context
}

// ============================================================================
// SPECIALIZED HOOKS FOR SPECIFIC ENTITY TYPES
// ============================================================================

export function useEntityEngagement(entityId: string, entityType: EntityType) {
  const context = useEngagement()
  const engagement = context.getEngagement(entityId, entityType)

  return {
    ...context,
    engagement,
    setReaction: (reactionType: ReactionType) =>
      context.setReaction(entityId, entityType, reactionType),
    removeReaction: () => context.removeReaction(entityId, entityType),
    addComment: (commentText: string) => context.addComment(entityId, entityType, commentText),
    shareEntity: () => context.shareEntity(entityId, entityType),
    bookmarkEntity: () => context.bookmarkEntity(entityId, entityType),
    viewEntity: () => context.viewEntity(entityId, entityType),
    isEngaged: context.isEntityEngaged(entityId, entityType),
    currentReaction: context.getEntityReaction(entityId, entityType),
    stats: context.getEntityStats(entityId, entityType),
  }
}

export function useReactions() {
  const context = useEngagement()

  return {
    setReaction: context.setReaction,
    removeReaction: context.removeReaction,
    getEntityReaction: context.getEntityReaction,
  }
}

export function useComments() {
  const context = useEngagement()

  return {
    addComment: context.addComment,
    getEngagement: context.getEngagement,
  }
}

export function useSharing() {
  const context = useEngagement()

  return {
    shareEntity: context.shareEntity,
    getEngagement: context.getEngagement,
  }
}
