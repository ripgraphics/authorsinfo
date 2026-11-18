import { query } from '../_generated/server'
import { v } from 'convex/values'

interface AuthorResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  name: string
  bio?: string
  featured?: boolean
  birthDate?: number
  nationality?: string
  website?: string
  authorImageId?: string
  twitterHandle?: string
  socialHandle?: string
  instagramHandle?: string
  goodreadsUrl?: string
  coverImageId?: string
  createdAt: number
  updatedAt: number
}

/**
 * List authors with pagination, search, and filters
 */
export const listAuthors = query({
  args: {
    search: v.optional(v.string()),
    nationality: v.optional(v.string()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let authors = await ctx.db.query('authors').collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      authors = authors.filter(a => 
        a.name?.toLowerCase().includes(searchLower) ||
        a.bio?.toLowerCase().includes(searchLower)
      )
    }

    if (args.nationality) {
      authors = authors.filter(a => a.nationality === args.nationality)
    }

    // Sort
    const sortBy = args.sortBy ?? 'name'
    authors.sort((a, b) => {
      const aVal = a[sortBy as keyof AuthorResult]
      const bVal = b[sortBy as keyof AuthorResult]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal)
      }
      return 0
    })

    // Pagination
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0
    return authors.slice(offset, offset + limit)
  },
})

/**
 * Get total count of authors
 */
export const getTotalAuthorsCount = query({
  args: {
    search: v.optional(v.string()),
    nationality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let authors = await ctx.db.query('authors').collect()
    
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      authors = authors.filter(a => 
        a.name?.toLowerCase().includes(searchLower) ||
        a.bio?.toLowerCase().includes(searchLower)
      )
    }
    if (args.nationality) {
      authors = authors.filter(a => a.nationality === args.nationality)
    }
    
    return authors.length
  },
})

/**
 * Get unique nationalities for filter dropdown
 */
export const getUniqueNationalities = query({
  args: {},
  handler: async (ctx, _args) => {
    const authors = await ctx.db.query('authors').collect()
    const nationalities = new Set<string>()
    authors.forEach(a => {
      if (a.nationality) nationalities.add(a.nationality)
    })
    return Array.from(nationalities).sort()
  },
})
