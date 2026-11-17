import { query } from '../_generated/server'
import { v } from 'convex/values'

interface ImageResult {
  _id: string
  _creationTime?: number
  supabaseId?: string
  entity_id?: string
  entity_type_id?: string
  metadata?: any
  url?: string
  thumbnail_url?: string
  large_url?: string
  medium_url?: string
  alt_text?: string
  caption?: string
  image_type?: string
  is_featured?: boolean
  created_at?: number
  updated_at?: number
}

/**
 * Helper to extract entity info from metadata or direct fields
 */
function getEntityInfo(img: ImageResult): { entityId: string; entityType: string } | null {
  // Try metadata first (most common case based on schema)
  if (img.metadata && typeof img.metadata === 'object') {
    const meta = img.metadata as any
    if (meta.entity_id && meta.entity_type) {
      return { entityId: meta.entity_id, entityType: meta.entity_type }
    }
  }

  // Fallback to direct fields
  if (img.entity_id && img.entity_type_id) {
    return { entityId: img.entity_id, entityType: img.entity_type_id }
  }

  return null
}

/**
 * Get all images for an entity by entity ID and type
 */
export const getImagesByEntity = query({
  args: {
    entityId: v.string(),
    entityType: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query('images').collect()

    // Filter by entity association
    results = results.filter(img => {
      const info = getEntityInfo(img)
      if (!info) return false
      return info.entityId === args.entityId && info.entityType === args.entityType
    })

    // Sort by created_at descending (newest first)
    results.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))

    // Apply limit
    const limit = args.limit ?? 50
    return results.slice(0, limit).map(img => ({
      id: img.id,
      url: img.url,
      thumbnail_url: img.thumbnail_url,
      large_url: img.large_url,
      medium_url: img.medium_url,
      alt_text: img.alt_text,
      caption: img.caption,
      image_type: img.image_type || 'unknown',
      is_featured: img.is_featured || false,
      created_at: img.created_at,
    }))
  },
})

/**
 * Get featured image for an entity
 */
export const getFeaturedImageByEntity = query({
  args: {
    entityId: v.string(),
    entityType: v.string(),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query('images').collect()

    // Filter by entity association and featured status
    results = results.filter(img => {
      const info = getEntityInfo(img)
      if (!info) return false
      return info.entityId === args.entityId &&
             info.entityType === args.entityType &&
             img.is_featured === true
    })

    if (results.length === 0) return null

    const img = results[0]
    return {
      id: img.id,
      url: img.url,
      thumbnail_url: img.thumbnail_url,
      large_url: img.large_url,
      medium_url: img.medium_url,
      alt_text: img.alt_text,
      caption: img.caption,
      image_type: img.image_type || 'unknown',
      is_featured: img.is_featured || false,
      created_at: img.created_at,
    }
  },
})

/**
 * Get image by its Supabase UUID (for fallback when no album exists)
 */
export const getImageById = query({
  args: { imageId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('images')
      .filter(q => q.eq(q.field('id'), args.imageId))
      .collect()

    if (results.length === 0) return null
    const img = results[0]
    return {
      id: img.id,
      url: img.url,
      thumbnail_url: img.thumbnail_url,
      large_url: img.large_url,
      medium_url: img.medium_url,
      alt_text: img.alt_text,
      caption: img.caption,
      image_type: img.image_type || 'unknown',
      is_featured: img.is_featured || false,
    }
  },
})

/**
 * Get author images (avatar, cover, gallery)
 */
export const getAuthorImages = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    let results = await ctx.db.query('images').collect()

    // Filter by entity association - match by entity_id directly
    // Some images may have null entity_type_id, so we primarily match by entity_id
    results = results.filter(img => {
      // Try metadata first
      if (img.metadata && typeof img.metadata === 'object') {
        const meta = img.metadata as any
        if (meta.entity_id === args.authorId) return true
      }
      // Then try direct fields
      if (img.entity_id === args.authorId) return true
      return false
    })

    // Map to expected format
    return results
      .map(img => ({
        id: img.id,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        large_url: img.large_url,
        medium_url: img.medium_url,
        alt_text: img.alt_text,
        caption: img.caption,
        image_type: img.image_type || 'unknown',
        is_featured: img.is_featured || false,
        created_at: img.created_at,
      }))
      .sort((a, b) => {
        // Sort by type: avatar first, then cover, then gallery
        const order: Record<string, number> = {
          'avatar': 0,
          'cover': 1,
          'gallery': 2,
        }
        return (order[a.image_type] ?? 99) - (order[b.image_type] ?? 99)
      })
  },
})

/**
 * Get publisher images (logo, cover, gallery)
 */
export const getPublisherImages = query({
  args: { publisherId: v.string() },
  handler: async (ctx, args) => {
    let results = await ctx.db.query('images').collect()

    // Filter by entity association - match by entity_id directly
    results = results.filter(img => {
      if (img.metadata && typeof img.metadata === 'object') {
        const meta = img.metadata as any
        if (meta.entity_id === args.publisherId) return true
      }
      if (img.entity_id === args.publisherId) return true
      return false
    })

    // Map to expected format
    return results
      .map(img => ({
        id: img.id,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        large_url: img.large_url,
        medium_url: img.medium_url,
        alt_text: img.alt_text,
        caption: img.caption,
        image_type: img.image_type || 'unknown',
        is_featured: img.is_featured || false,
        created_at: img.created_at,
      }))
      .sort((a, b) => {
        // Sort by type: logo first, then cover, then gallery
        const order: Record<string, number> = {
          'logo': 0,
          'cover': 1,
          'gallery': 2,
        }
        return (order[a.image_type] ?? 99) - (order[b.image_type] ?? 99)
      })
  },
})