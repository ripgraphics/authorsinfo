import { query } from '../_generated/server'
import { v } from 'convex/values'

interface PublisherResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  name: string
  website?: string
  logoId?: string
  createdAt: number
  updatedAt: number
}

/**
 * List publishers with pagination and search
 */
export const listPublishers = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let publishers = await ctx.db.query('publishers').collect()

    // Apply search
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      publishers = publishers.filter(p => 
        p.name?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    const sortBy = args.sortBy ?? 'name'
    publishers.sort((a, b) => {
      const aVal = a[sortBy as keyof PublisherResult]
      const bVal = b[sortBy as keyof PublisherResult]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal
      }
      return 0
    })

    // Pagination
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0
    return publishers.slice(offset, offset + limit)
  },
})

/**
 * Get total count of publishers
 */
export const getTotalPublishersCount = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let publishers = await ctx.db.query('publishers').collect()
    
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      publishers = publishers.filter(p => 
        p.name?.toLowerCase().includes(searchLower)
      )
    }
    
    return publishers.length
  },
})
