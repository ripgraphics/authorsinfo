import { query } from '../_generated/server'
import { v } from 'convex/values'

// Types for type-safe returns
interface BookResult {
  _id: string
  _creationTime: number
  supabaseId?: string
  title: string
  subtitle?: string
  description?: string
  isbn13?: string
  isbn10?: string
  publishedAt?: number
  publisherId?: string
  pageCount?: number
  language?: string
  format?: string
  coverImageId?: string
  coverUrl?: string
  price?: number
  currency?: string
  isAvailable?: boolean
  authorId?: string
  featured?: boolean
  createdAt: number
  updatedAt: number
}

/**
 * List books with pagination, search, and filters
 */
export const listBooks = query({
  args: {
    search: v.optional(v.string()),
    language: v.optional(v.string()),
    publisherId: v.optional(v.string()),
    year: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let books = await ctx.db.query('books').collect()

    // Fetch all images once for joining
    const allImages = await ctx.db.query('images').collect()

    // Build a map: alt_text -> front cover image
    // The entity_id in images points to old Supabase IDs that no longer exist.
    // Instead, match by alt_text (which equals the book title).
    const titleToCoverImage = new Map<string, any>()
    allImages.forEach(img => {
      if (img.image_type === 'book_cover_front' && img.alt_text && img.url) {
        // Use the full alt_text as key for exact match
        titleToCoverImage.set(img.alt_text, img)
      }
    })

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      books = books.filter(b =>
        b.title?.toLowerCase().includes(searchLower) ||
        b.subtitle?.toLowerCase().includes(searchLower) ||
        b.isbn13?.includes(args.search!) ||
        b.isbn10?.includes(args.search!)
      )
    }

    if (args.language) {
      books = books.filter(b => b.language === args.language)
    }

    if (args.publisherId) {
      books = books.filter(b => b.publisherId === args.publisherId)
    }

    if (args.year) {
      books = books.filter(b => {
        if (!b.publishedAt) return false
        const year = new Date(b.publishedAt).getFullYear()
        return year === args.year
      })
    }

    // Sort
    const sortBy = args.sortBy ?? 'createdAt'
    books.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a]
          const bVal = b[sortBy as keyof typeof b]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return bVal - aVal
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal)
      }
      return 0
    })

    // Enrich books with cover images by matching title to alt_text
    const enrichedBooks = books.map(book => {
      const coverImage = titleToCoverImage.get(book.title)
      const coverUrl = coverImage?.url || book.coverUrl

      return { ...book, coverUrl }
    })

    // Pagination
    const limit = args.limit ?? 20
    const offset = args.offset ?? 0
    return enrichedBooks.slice(offset, offset + limit)
  },
})

/**
 * Get total count of books (for pagination)
 */
export const getTotalBooksCount = query({
  args: {
    search: v.optional(v.string()),
    language: v.optional(v.string()),
    publisherId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let books = await ctx.db.query('books').collect()
    
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      books = books.filter(b => 
        b.title?.toLowerCase().includes(searchLower) ||
        b.subtitle?.toLowerCase().includes(searchLower)
      )
    }
    if (args.language) {
      books = books.filter(b => b.language === args.language)
    }
    if (args.publisherId) {
      books = books.filter(b => b.publisherId === args.publisherId)
    }
    
    return books.length
  },
})

/**
 * Get unique languages for filter dropdown
 */
export const getUniqueLanguages = query({
  args: {},
  handler: async (ctx, _args) => {
    const books = await ctx.db.query('books').collect()
    const languages = new Set<string>()
    books.forEach(b => {
      if (b.language) languages.add(b.language)
    })
    return Array.from(languages).sort()
  },
})
