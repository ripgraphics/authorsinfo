/**
 * Tag Service
 * Core business logic for tag operations: search, create, normalize
 */

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { getCached, setCached, getSearchCacheKey, clearCache } from './tag-cache'
import { getAvatarUrlFromImageId, getUserAvatarUrl } from './tag-avatar-helper'

type Tag = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type Tagging = Database['public']['Tables']['taggings']['Row']
type TaggingInsert = Database['public']['Tables']['taggings']['Insert']

export interface TagSearchResult {
  id: string
  name: string
  slug: string
  type: 'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'
  avatarUrl?: string
  sublabel?: string
  metadata?: Record<string, any>
  usageCount?: number
}

export interface TagSuggestion extends TagSearchResult {
  entityId?: string
  entityType?: string
}

/**
 * Calculate relevance score for a tag match
 */
function calculateRelevanceScore(
  tag: any,
  query: string,
  searchTerm: string
): number {
  let score = 0

  // Base popularity score (0-40 points)
  const usageScore = Math.min((tag.usage_count || 0) / 100, 1) * 40
  score += usageScore

  // Exact match bonus (30 points)
  if (tag.name.toLowerCase() === searchTerm || tag.slug.toLowerCase() === searchTerm) {
    score += 30
  }
  // Starts with query (20 points)
  else if (tag.name.toLowerCase().startsWith(searchTerm) || tag.slug.toLowerCase().startsWith(searchTerm)) {
    score += 20
  }
  // Contains query (10 points)
  else if (tag.name.toLowerCase().includes(searchTerm) || tag.slug.toLowerCase().includes(searchTerm)) {
    score += 10
  }

  // Recency bonus (0-20 points) - tags created in last 30 days get bonus
  const daysSinceCreation = (Date.now() - new Date(tag.created_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation < 30) {
    score += (1 - daysSinceCreation / 30) * 20
  }

  // Fuzzy match score using similarity (0-10 points)
  // Simple Levenshtein-like scoring
  const nameLower = tag.name.toLowerCase()
  const slugLower = tag.slug.toLowerCase()
  const queryLower = searchTerm.toLowerCase()

  const nameSimilarity = calculateSimilarity(nameLower, queryLower)
  const slugSimilarity = calculateSimilarity(slugLower, queryLower)
  const maxSimilarity = Math.max(nameSimilarity, slugSimilarity)
  score += maxSimilarity * 10

  return score
}

/**
 * Simple similarity calculation (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  // Check for exact substring match
  if (longer.includes(shorter)) {
    return shorter.length / longer.length
  }

  // Simple character overlap
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++
    }
  }

  return matches / longer.length
}

/**
 * Search tags across all types with unified interface and relevance scoring
 */
export async function searchTags(
  query: string,
  types?: Array<'user' | 'entity' | 'topic' | 'collaborator' | 'location' | 'taxonomy'>,
  limit: number = 20
): Promise<TagSearchResult[]> {
  const supabase = await createClient()

  if (!query || query.trim().length === 0) {
    return []
  }

  const searchTerm = query.trim().toLowerCase()

  // Check cache first
  const cacheKey = getSearchCacheKey(searchTerm, types, limit)
  const cached = getCached<TagSearchResult[]>(cacheKey)
  if (cached) {
    return cached
  }

  // Try fuzzy search first (if query is long enough for meaningful fuzzy matching)
  let useFuzzySearch = searchTerm.length >= 3
  let tags: any[] = []
  let tagError: any = null

  if (useFuzzySearch) {
    // Use fuzzy search function
    const { data: fuzzyResults, error: fuzzyError } = await supabase.rpc('search_tags_fuzzy', {
      p_query: searchTerm,
      p_types: types && types.length > 0 ? types : null,
      p_limit: limit * 2, // Get more results for scoring
      p_similarity_threshold: 0.2,
    })

    if (!fuzzyError && fuzzyResults) {
      tags = fuzzyResults
    } else {
      useFuzzySearch = false
      tagError = fuzzyError
    }
  }

  // Fallback to regular search if fuzzy search fails or query is too short
  if (!useFuzzySearch || tags.length === 0) {
    let tagQuery = supabase
      .from('tags')
      .select('id, name, slug, type, metadata, usage_count, created_at')
      .eq('status', 'active')
      .is('deleted_at', null)
      .or(`name.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`)

    if (types && types.length > 0) {
      tagQuery = tagQuery.in('type', types)
    }

    const { data: regularTags, error: regularError } = await tagQuery

    if (regularError) {
      console.error('Error searching tags:', regularError)
      tagError = regularError
    } else {
      tags = regularTags || []
    }
  }

  // Also search aliases
  let aliasQuery = supabase
    .from('tag_aliases')
    .select('tag_id, alias, alias_slug, tags!inner(id, name, slug, type, metadata, usage_count, created_at, status, deleted_at)')
    .or(`alias.ilike.%${searchTerm}%,alias_slug.ilike.%${searchTerm}%`)

  const { data: aliases, error: aliasError } = await aliasQuery

  if (aliasError) {
    console.error('Error searching aliases:', aliasError)
  }

  // Combine results
  const tagMap = new Map<string, any>()

  // Add direct tag matches
  for (const tag of tags || []) {
    if (tag.status === 'active' && !tag.deleted_at) {
      tagMap.set(tag.id, tag)
    }
  }

  // Add alias matches
  for (const alias of aliases || []) {
    const tag = Array.isArray(alias.tags) ? alias.tags[0] : alias.tags
    if (tag && (tag as any).status === 'active' && !(tag as any).deleted_at) {
      // Prefer existing tag if already in map, otherwise add
      if (!tagMap.has((tag as any).id)) {
        tagMap.set((tag as any).id, tag)
      }
    }
  }

  // Calculate relevance scores and sort
  const scoredTags = Array.from(tagMap.values())
    .map((tag) => ({
      ...tag,
      relevanceScore: calculateRelevanceScore(tag, query, searchTerm),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)

  // Transform to search results with entity lookups for user/entity types
  const results: TagSearchResult[] = []

  for (const tag of scoredTags) {
    const result: TagSearchResult = {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      type: tag.type as TagSearchResult['type'],
      metadata: tag.metadata as Record<string, any>,
      usageCount: tag.usage_count || 0,
    }

    // For user tags, fetch user profile info
    if (tag.type === 'user' && tag.metadata?.entity_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, avatar_image_id')
        .eq('user_id', tag.metadata.entity_id)
        .single()

      if (profile) {
        const { data: user } = await supabase
          .from('users')
          .select('name, permalink')
          .eq('id', profile.user_id)
          .single()

        if (user) {
          result.name = user.name || ''
          result.sublabel = `@${user.permalink || user.name}`
          // Get avatar URL from images table
          if (profile.avatar_image_id) {
            result.avatarUrl = (await getAvatarUrlFromImageId(profile.avatar_image_id)) || undefined
          }
        }
      }
    }

    // For entity tags, fetch entity info
    if (tag.type === 'entity' && tag.metadata?.entity_id && tag.metadata?.entity_type) {
      const entityType = tag.metadata.entity_type
      const entityId = tag.metadata.entity_id

      if (entityType === 'author') {
        const { data: author } = await supabase
          .from('authors')
          .select('name, permalink')
          .eq('id', entityId)
          .single()

        if (author) {
          result.name = author.name
          result.sublabel = `Author`
        }
      } else if (entityType === 'book') {
        const { data: book } = await supabase
          .from('books')
          .select('title, permalink')
          .eq('id', entityId)
          .single()

        if (book) {
          result.name = book.title
          result.sublabel = `Book`
        }
      } else if (entityType === 'group') {
        const { data: group } = await supabase
          .from('groups')
          .select('name, permalink')
          .eq('id', entityId)
          .single()

        if (group) {
          result.name = group.name
          result.sublabel = `Group`
        }
      } else if (entityType === 'event') {
        const { data: event } = await supabase
          .from('events')
          .select('title, permalink')
          .eq('id', entityId)
          .single()

        if (event) {
          result.name = event.title
          result.sublabel = `Event`
        }
      }
    }

    results.push(result)
  }

  // Cache results
  setCached(cacheKey, results, 5 * 60 * 1000) // 5 minutes

  return results
}

/**
 * Search users for mention suggestions
 * Respects user privacy settings - only returns discoverable users
 */
export async function searchUsersForMentions(
  query: string,
  limit: number = 10
): Promise<TagSuggestion[]> {
  const supabase = await createClient()

  if (!query || query.trim().length === 0) {
    return []
  }

  const searchTerm = `%${query.trim()}%`

  // Only search users with discoverable profiles
  const { data: users, error } = await supabase
    .from('users')
    .select(
      `
      id,
      name,
      email,
      permalink,
      profiles!inner(profile_visibility)
    `
    )
    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},permalink.ilike.${searchTerm}`)
    .is('deleted_at', null)
    .in('profiles.profile_visibility', ['public', 'followers']) // Only discoverable users
    .limit(limit)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  const suggestions: TagSuggestion[] = []

  for (const user of users || []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_image_id')
      .eq('user_id', user.id)
      .single()

    suggestions.push({
      id: user.id,
      name: user.name || user.email || 'Unknown User',
      slug: user.permalink || user.id,
      type: 'user',
      entityId: user.id,
      entityType: 'user',
      sublabel: user.email || `@${user.permalink || user.name}`,
      avatarUrl: (await getUserAvatarUrl(user.id)) || undefined,
    })
  }

  return suggestions
}

/**
 * Search entities (authors, books, groups, events) for mention suggestions
 */
export async function searchEntitiesForMentions(
  query: string,
  entityTypes?: Array<'author' | 'book' | 'group' | 'event'>,
  limit: number = 10
): Promise<TagSuggestion[]> {
  const supabase = await createClient()

  if (!query || query.trim().length === 0) {
    return []
  }

  const searchTerm = `%${query.trim()}%`
  const suggestions: TagSuggestion[] = []

  const typesToSearch = entityTypes || ['author', 'book', 'group', 'event']

  // Search authors
  if (typesToSearch.includes('author')) {
    const { data: authors } = await supabase
      .from('authors')
      .select('id, name, permalink')
      .ilike('name', searchTerm)
      .limit(limit)

    for (const author of authors || []) {
      suggestions.push({
        id: author.id,
        name: author.name,
        slug: author.permalink || author.id,
        type: 'entity',
        entityId: author.id,
        entityType: 'author',
        sublabel: 'Author',
      })
    }
  }

  // Search books
  if (typesToSearch.includes('book')) {
    const { data: books } = await supabase
      .from('books')
      .select('id, title, permalink')
      .ilike('title', searchTerm)
      .limit(limit)

    for (const book of books || []) {
      suggestions.push({
        id: book.id,
        name: book.title,
        slug: book.permalink || book.id,
        type: 'entity',
        entityId: book.id,
        entityType: 'book',
        sublabel: 'Book',
      })
    }
  }

  // Search groups
  if (typesToSearch.includes('group')) {
    const { data: groups } = await supabase
      .from('groups')
      .select('id, name, permalink')
      .ilike('name', searchTerm)
      .limit(limit)

    for (const group of groups || []) {
      suggestions.push({
        id: group.id,
        name: group.name,
        slug: group.permalink || group.id,
        type: 'entity',
        entityId: group.id,
        entityType: 'group',
        sublabel: 'Group',
      })
    }
  }

  // Search events
  if (typesToSearch.includes('event')) {
    const { data: events } = await supabase
      .from('events')
      .select('id, title, permalink')
      .ilike('title', searchTerm)
      .limit(limit)

    for (const event of events || []) {
      suggestions.push({
        id: event.id,
        name: event.title,
        slug: event.permalink || event.id,
        type: 'entity',
        entityId: event.id,
        entityType: 'event',
        sublabel: 'Event',
      })
    }
  }

  return suggestions.slice(0, limit)
}

/**
 * Find or create a tag
 */
export async function findOrCreateTag(
  name: string,
  type: Tag['type'],
  metadata?: Record<string, any>,
  createdBy?: string
): Promise<string | null> {
  const supabase = await createClient()

  // For user tags, if permalink is in metadata, use it as slug (preserves dots)
  // Otherwise generate slug from name
  let slug: string
  if (type === 'user' && metadata?.permalink) {
    slug = metadata.permalink.toLowerCase()
  } else {
    // Generate slug from name (removes special chars including dots)
    slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Try to find existing tag by slug
  let { data: existing } = await supabase
    .from('tags')
    .select('id, metadata')
    .eq('slug', slug)
    .eq('type', type)
    .is('deleted_at', null)
    .single()

  // For user tags, also try to find by entity_id in metadata (to handle existing tags with old slug format)
  if (!existing && type === 'user' && metadata?.entity_id) {
    // Search for tags with matching entity_id in metadata
    const { data: tagsByEntity } = await supabase
      .from('tags')
      .select('id, metadata, slug')
      .eq('type', 'user')
      .is('deleted_at', null)
      .limit(10)
    
    // Filter in memory (Supabase JSONB queries can be tricky)
    const matchingTag = tagsByEntity?.find((tag: any) => {
      const tagMetadata = tag.metadata as Record<string, any>
      return tagMetadata?.entity_id === metadata.entity_id
    })
    
    if (matchingTag) {
      existing = matchingTag
      // Update slug and metadata if permalink is provided
      if (metadata.permalink && matchingTag.slug !== metadata.permalink.toLowerCase()) {
        await supabase
          .from('tags')
          .update({
            slug: metadata.permalink.toLowerCase(),
            metadata: {
              ...(matchingTag.metadata as Record<string, any> || {}),
              ...metadata,
            },
          })
          .eq('id', matchingTag.id)
      }
    }
  }

  if (existing) {
    // If metadata is provided and tag exists, update metadata (especially for user tags to store permalink)
    if (metadata && Object.keys(metadata).length > 0 && type === 'user' && metadata.permalink) {
      const existingMetadata = (existing.metadata as Record<string, any>) || {}
      // Only update if permalink is missing or different
      if (!existingMetadata.permalink || existingMetadata.permalink !== metadata.permalink) {
        await supabase
          .from('tags')
          .update({
            metadata: {
              ...existingMetadata,
              ...metadata,
            },
            // Also update slug to match permalink if it's a user tag
            ...(type === 'user' && metadata.permalink ? { slug: metadata.permalink.toLowerCase() } : {}),
          })
          .eq('id', existing.id)
      }
    }
    return existing.id
  }

  // Create new tag
  const tagData: TagInsert = {
    name: name.trim(),
    slug,
    type,
    metadata: metadata || {},
    created_by: createdBy || null,
    status: 'active',
  }

  const { data: newTag, error } = await supabase
    .from('tags')
    .insert(tagData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    return null
  }

  return newTag.id
}

/**
 * Create taggings for an entity (batch insert for performance)
 */
export async function createTaggings(
  tagIds: string[],
  entityType: string,
  entityId: string,
  context: 'post' | 'comment' | 'profile' | 'message' | 'photo' | 'activity',
  taggedBy?: string,
  positions?: Array<{ start: number; end: number }>
): Promise<boolean> {
  const supabase = await createClient()

  if (tagIds.length === 0) {
    return true
  }

  // Batch insert all taggings at once
  const taggings: TaggingInsert[] = tagIds.map((tagId, index) => ({
    tag_id: tagId,
    entity_type: entityType,
    entity_id: entityId,
    tagged_by: taggedBy || null,
    context,
    position_start: positions?.[index]?.start || null,
    position_end: positions?.[index]?.end || null,
  }))

  // Use batch insert (more efficient than individual inserts)
  const { error } = await supabase.from('taggings').insert(taggings)

  if (error) {
    console.error('Error creating taggings:', error)
    return false
  }

  // Sync backward compatibility arrays (async - don't wait)
  if (context === 'post' || context === 'activity') {
    void (async () => {
      const { error } = await (supabase.rpc as any)('sync_hashtags_from_taggings', {
        p_entity_type: entityType,
        p_entity_id: entityId,
      })
      if (error) console.error('Error syncing hashtags:', error)
    })()
  } else if (context === 'comment') {
    void (async () => {
      const { error } = await (supabase.rpc as any)('sync_mentions_from_taggings', {
        p_comment_id: entityId,
      })
      if (error) console.error('Error syncing mentions:', error)
    })()
  }

  return true
}

/**
 * Get tags for an entity
 */
export async function getEntityTags(
  entityType: string,
  entityId: string,
  context?: string
): Promise<Tag[]> {
  const supabase = await createClient()

  let query = supabase
    .from('taggings')
    .select(
      `
      tag_id,
      tags (
        id,
        name,
        slug,
        type,
        metadata,
        usage_count
      )
    `
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (context) {
    query = query.eq('context', context)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching entity tags:', error)
    return []
  }

  return (data || []).map((item: any) => item.tags).filter(Boolean) as Tag[]
}
