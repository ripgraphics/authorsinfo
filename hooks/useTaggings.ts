/**
 * useTaggings Hook
 * Manage taggings (mentions and hashtags) for entities like posts and comments
 */

import { useState, useCallback, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export interface Tagging {
  id: string
  tag_id: string
  entity_type: string
  entity_id: string
  created_by?: string
  context?: string
  status: 'active' | 'pending' | 'rejected'
  created_at: string
  tag?: {
    id: string
    name: string
    slug: string
    type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
    metadata?: Record<string, unknown>
  }
}

export interface CreateTaggingInput {
  tagId: string
  entityType: string
  entityId: string
  context?: string
}

export interface UseTaggingsOptions {
  entityType?: string
  entityId?: string
  autoFetch?: boolean
}

export interface UseTaggingsReturn {
  taggings: Tagging[]
  isLoading: boolean
  error: string | null
  fetchTaggings: () => Promise<void>
  createTaggings: (inputs: CreateTaggingInput[]) => Promise<boolean>
  createTaggingsFromText: (
    entityType: string,
    entityId: string,
    text: string
  ) => Promise<boolean>
  deleteTagging: (taggingId: string) => Promise<boolean>
  clearError: () => void
}

/**
 * Hook for managing taggings on entities
 */
export function useTaggings(options: UseTaggingsOptions = {}): UseTaggingsReturn {
  const { entityType, entityId, autoFetch = false } = options

  const [taggings, setTaggings] = useState<Tagging[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  /**
   * Fetch taggings for the specified entity
   */
  const fetchTaggings = useCallback(async () => {
    if (!entityType || !entityId) {
      setTaggings([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/tags/taggings?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch taggings')
      }

      const data = await response.json()
      setTaggings(data.taggings || [])
    } catch (err) {
      console.error('Error fetching taggings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch taggings')
    } finally {
      setIsLoading(false)
    }
  }, [entityType, entityId])

  /**
   * Create multiple taggings
   */
  const createTaggings = useCallback(
    async (inputs: CreateTaggingInput[]): Promise<boolean> => {
      if (inputs.length === 0) return true

      setIsLoading(true)
      setError(null)

      try {
        // Group by entity for batch processing
        const groupedByEntity = inputs.reduce(
          (acc, input) => {
            const key = `${input.entityType}:${input.entityId}`
            if (!acc[key]) {
              acc[key] = {
                entityType: input.entityType,
                entityId: input.entityId,
                tagIds: [],
              }
            }
            acc[key].tagIds.push(input.tagId)
            return acc
          },
          {} as Record<string, { entityType: string; entityId: string; tagIds: string[] }>
        )

        // Create taggings for each entity
        const results = await Promise.all(
          Object.values(groupedByEntity).map(async ({ entityType, entityId, tagIds }) => {
            const response = await fetch('/api/tags/taggings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                entityType,
                entityId,
                tagIds,
              }),
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || 'Failed to create taggings')
            }

            return response.json()
          })
        )

        // Refresh taggings if we have an entity context
        if (entityType && entityId) {
          await fetchTaggings()
        }

        return true
      } catch (err) {
        console.error('Error creating taggings:', err)
        setError(err instanceof Error ? err.message : 'Failed to create taggings')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [entityType, entityId, fetchTaggings]
  )

  /**
   * Create taggings from text content (extracts mentions and hashtags)
   */
  const createTaggingsFromText = useCallback(
    async (entityType: string, entityId: string, text: string): Promise<boolean> => {
      if (!text) return true

      setIsLoading(true)
      setError(null)

      try {
        // Extract mentions and hashtags
        const mentionRegex = /@([a-zA-Z][a-zA-Z0-9_]*)/g
        const hashtagRegex = /#([a-zA-Z][a-zA-Z0-9_]*)/g

        const mentions: string[] = []
        const hashtags: string[] = []

        let match
        while ((match = mentionRegex.exec(text)) !== null) {
          const slug = match[1].toLowerCase()
          if (!mentions.includes(slug)) {
            mentions.push(slug)
          }
        }

        while ((match = hashtagRegex.exec(text)) !== null) {
          const slug = match[1].toLowerCase()
          if (!hashtags.includes(slug)) {
            hashtags.push(slug)
          }
        }

        if (mentions.length === 0 && hashtags.length === 0) {
          return true
        }

        // Find or create tags and create taggings
        const tagIdsToCreate: string[] = []

        // Process mentions - find users/entities
        for (const slug of mentions) {
          try {
            // Search for user or entity with this slug
            const response = await fetch(
              `/api/tags/search?q=${encodeURIComponent(slug)}&types=user,entity&limit=1`
            )
            const data = await response.json()

            if (data.results && data.results.length > 0) {
              // Found existing tag
              tagIdsToCreate.push(data.results[0].id)
            }
          } catch (err) {
            console.warn(`Could not find tag for mention @${slug}:`, err)
          }
        }

        // Process hashtags - find or create topic tags
        for (const slug of hashtags) {
          try {
            // Search for existing topic tag
            const searchResponse = await fetch(
              `/api/tags/search?q=${encodeURIComponent(slug)}&types=topic&limit=1`
            )
            const searchData = await searchResponse.json()

            if (searchData.results && searchData.results.length > 0) {
              // Found existing tag
              tagIdsToCreate.push(searchData.results[0].id)
            } else {
              // Create new topic tag
              const createResponse = await fetch('/api/tags/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: slug,
                  type: 'topic',
                }),
              })

              if (createResponse.ok) {
                const createData = await createResponse.json()
                if (createData.tag?.id) {
                  tagIdsToCreate.push(createData.tag.id)
                }
              }
            }
          } catch (err) {
            console.warn(`Could not create tag for hashtag #${slug}:`, err)
          }
        }

        // Create the taggings
        if (tagIdsToCreate.length > 0) {
          const response = await fetch('/api/tags/taggings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType,
              entityId,
              tagIds: tagIdsToCreate,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            console.warn('Failed to create some taggings:', data.error)
          }
        }

        return true
      } catch (err) {
        console.error('Error creating taggings from text:', err)
        setError(err instanceof Error ? err.message : 'Failed to create taggings')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Delete a tagging
   */
  const deleteTagging = useCallback(
    async (taggingId: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/tags/taggings?id=${encodeURIComponent(taggingId)}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete tagging')
        }

        // Update local state
        setTaggings((prev) => prev.filter((t) => t.id !== taggingId))
        return true
      } catch (err) {
        console.error('Error deleting tagging:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete tagging')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && entityType && entityId) {
      fetchTaggings()
    }
  }, [autoFetch, entityType, entityId, fetchTaggings])

  return {
    taggings,
    isLoading,
    error,
    fetchTaggings,
    createTaggings,
    createTaggingsFromText,
    deleteTagging,
    clearError,
  }
}

/**
 * Extract mentions and hashtags from text
 */
export function extractTagsFromText(text: string): {
  mentions: string[]
  hashtags: string[]
} {
  if (!text) return { mentions: [], hashtags: [] }

  const mentions: string[] = []
  const hashtags: string[] = []

  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9_]*)/g
  const hashtagRegex = /#([a-zA-Z][a-zA-Z0-9_]*)/g

  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    const slug = match[1].toLowerCase()
    if (!mentions.includes(slug)) {
      mentions.push(slug)
    }
  }

  while ((match = hashtagRegex.exec(text)) !== null) {
    const slug = match[1].toLowerCase()
    if (!hashtags.includes(slug)) {
      hashtags.push(slug)
    }
  }

  return { mentions, hashtags }
}
