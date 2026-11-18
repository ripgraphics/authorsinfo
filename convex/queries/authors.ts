import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get a single author by Supabase UUID or Convex _id
 */
export const getAuthor = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.id), q.eq(q.field('_id'), args.id)))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * List authors with optional search and limit
 */
export const listAuthors = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let authors = await ctx.db.query('authors').take(500)

    if (args.search) {
      const searchLower = args.search.toLowerCase()
      authors = authors.filter(a =>
        a.name?.toLowerCase().includes(searchLower) ||
        a.bio?.toLowerCase().includes(searchLower)
      )
    }

    const limit = args.limit ?? 100
    return authors.slice(0, limit)
  },
})

/**
 * Paginated author list for admin tables
 */
export const listAuthorsPaginated = query({
  args: {
    paginationOpts: v.any(),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db.query('authors')

    if (args.search) {
      const authors = await queryBuilder.collect()
      const searchLower = args.search.toLowerCase()
      const filtered = authors.filter((a: any) => 
        a.name?.toLowerCase().includes(searchLower)
      )
      
      // Simple pagination for now - will improve with proper index usage
      const page_size = 20
      const cursor = args.paginationOpts.cursor as number | null
      const start = cursor ?? 0
      const end = start + page_size
      
      return {
        docs: filtered.slice(start, end),
        continueCursor: end < filtered.length ? end : null,
        isDone: end >= filtered.length,
      }
    }

    // Collect all authors and sort in JavaScript since we don't have typed indexes yet
    const allAuthors = await queryBuilder.collect()
    const sorted = allAuthors.sort((a: any, b: any) => 
      (a.name ?? '').localeCompare(b.name ?? '')
    )
    
    // Apply pagination manually
    const page_size = 20
    const cursor = args.paginationOpts.cursor as number | null
    const start = cursor ?? 0
    const end = start + page_size
    
    return {
      docs: sorted.slice(start, end),
      continueCursor: end < sorted.length ? end : null,
      isDone: end >= sorted.length,
    }
  },
})
