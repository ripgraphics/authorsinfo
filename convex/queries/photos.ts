import { query } from '../_generated/server'
import { v } from 'convex/values'

interface PhotoResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  title?: string
  description?: string
  imageId?: string
  imageUrl?: string
  authorId?: string
  groupId?: string
  created_at?: number
  updated_at?: number
}

/**
 * List photos with pagination and filters
 */
export const listPhotos = query({
  args: {
    search: v.optional(v.string()),
    authorId: v.optional(v.string()),
    groupId: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let photos = await ctx.db.query('images').collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      photos = photos.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    if (args.authorId) {
      photos = photos.filter(p => p.authorId === args.authorId)
    }

    if (args.groupId) {
      photos = photos.filter(p => p.groupId === args.groupId)
    }

    // Sort
        const sortBy = args.sortBy ?? 'created_at'
    photos.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a]
          const bVal = b[sortBy as keyof typeof b]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal
      }
      return 0
    })

    // Pagination
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0
    return photos.slice(offset, offset + limit)
  },
})

/**
 * Get total count of photos
 */
export const getTotalPhotosCount = query({
  args: {
    search: v.optional(v.string()),
    authorId: v.optional(v.string()),
    groupId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let photos = await ctx.db.query('images').collect()
    
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      photos = photos.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }
    if (args.authorId) {
      photos = photos.filter(p => p.authorId === args.authorId)
    }
    if (args.groupId) {
      photos = photos.filter(p => p.groupId === args.groupId)
    }
    
    return photos.length
  },
})

/**
 * Get a single photo by ID (Supabase UUID or Convex internal _id)
 */
export const getPhoto = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    // The images table uses a raw Supabase schema where the 'id' column stores
    // the Supabase UUID. Convex .filter() cannot efficiently scan non-indexed
    // columns, so we collect locally and match by string equality.
    const all = await ctx.db.query('images').collect()
    return all.find((r: any) => r.id === args.id || r._id === args.id) ?? null
  },
})