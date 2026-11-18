import { query } from '../_generated/server'
import { v } from 'convex/values'

// Type definitions for Convex documents
interface ConvexBook {
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
  createdAt: number
  updatedAt: number
}

interface ConvexAuthor {
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

interface ConvexPublisher {
  _id: string
  _creationTime: number
  supabaseId?: string
  name: string
  website?: string
  logoId?: string
  createdAt: number
  updatedAt: number
}

interface BookDetailsResult {
  book: ConvexBook | null
  authors: ConvexAuthor[]
  publisher: ConvexPublisher | null
  bindingType: null
  formatType: null
}

/**
 * Get a single book by Supabase UUID or Convex _id
 */
export const getBook = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('books')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.id), q.eq(q.field('_id'), args.id)))
      .take(1)
    return results[0] ?? null
  },
})

/**
 * List books with optional filters
 */
export const listBooks = query({
  args: {
    publisherId: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let books = await ctx.db.query('books').take(500)

    if (args.publisherId) {
      books = books.filter(b => b.publisherId === args.publisherId)
    }

    if (args.isbn13) {
      books = books.filter(b => b.isbn13 === args.isbn13)
    }

    const limit = args.limit ?? 100
    return books.slice(0, limit)
  },
})

/**
 * Get a book with related authors, publisher, binding, and format records.
 */
export const getBookDetails = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('books')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.id), q.eq(q.field('_id'), args.id)))
      .take(1)
    const book = results[0]
    if (!book) return null

    const bookSupabaseId = book.supabaseId ?? book._id
    const bookAuthorResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('bookId'), bookSupabaseId))
      .take(100)
    const authorIds = bookAuthorResults.map(ba => ba.authorId)

    const allAuthors = await ctx.db.query('authors').collect()
    const filteredAuthors = allAuthors.filter(a => authorIds.some(id => a.supabaseId === id || a._id === id))

    const publisherResults = await ctx.db
      .query('publishers')
      .filter(q => q.eq(q.field('supabaseId'), book.publisherId ?? ''))
      .take(1)

    return {
      book,
      authors: filteredAuthors,
      publisher: publisherResults[0] ?? null,
      bindingType: null,
      formatType: null,
    }
  },
})

/**
 * Count of books associated with an author
 */
export const getBookCountByAuthorId = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.authorId), q.eq(q.field('_id'), args.authorId)))
      .take(1)
    const author = results[0]
    if (!author) return 0

    const authorSupabaseId = author.supabaseId ?? author._id
    const bookAuthorResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('authorId'), authorSupabaseId))
      .take(500)
    return bookAuthorResults.length
  },
})

/**
 * Count of books by publisher
 */
export const getBookCountByPublisherId = query({
  args: { publisherId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('publishers')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.publisherId), q.eq(q.field('_id'), args.publisherId)))
      .take(1)
    const publisher = results[0]
    if (!publisher) return 0

    const publisherSupabaseId = publisher.supabaseId ?? publisher._id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.eq(q.field('publisherId'), publisherSupabaseId))
      .take(500)
    return bookResults.length
  },
})

/**
 * Get books by author ID
 */
export const getBooksByAuthorId = query({
  args: { authorId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.authorId), q.eq(q.field('_id'), args.authorId)))
      .take(1)
    const author = results[0]
    if (!author) return []

    const authorSupabaseId = author.supabaseId ?? author._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('authorId'), authorSupabaseId))
      .take(500)
    const bookIds = baResults.map(ba => ba.bookId)

    if (bookIds.length === 0) return []
    const allBooks = await ctx.db.query('books').collect()
    const filtered = allBooks.filter(b => bookIds.includes(b.supabaseId ?? b._id))
    const limit = args.limit ?? 10
    return filtered.slice(0, limit)
  },
})

/**
 * Count books by author ID
 */
export const getBooksCountByAuthorId = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.authorId), q.eq(q.field('_id'), args.authorId)))
      .take(1)
    const author = results[0]
    if (!author) return 0

    const authorSupabaseId = author.supabaseId ?? author._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('authorId'), authorSupabaseId))
      .take(500)
    return baResults.length
  },
})

/**
 * Get books by publisher ID
 */
export const getBooksByPublisherId = query({
  args: { publisherId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('publishers')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.publisherId), q.eq(q.field('_id'), args.publisherId)))
      .take(1)
    const publisher = results[0]
    if (!publisher) return []

    const publisherSupabaseId = publisher.supabaseId ?? publisher._id
    const books = await ctx.db
      .query('books')
      .filter(q => q.eq(q.field('publisherId'), publisherSupabaseId))
      .take(args.limit ?? 10)
    return books
  },
})

/**
 * Count books by publisher ID
 */
export const getBooksCountByPublisherId = query({
  args: { publisherId: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('publishers')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.publisherId), q.eq(q.field('_id'), args.publisherId)))
      .take(1)
    const publisher = results[0]
    if (!publisher) return 0

    const publisherSupabaseId = publisher.supabaseId ?? publisher._id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.eq(q.field('publisherId'), publisherSupabaseId))
      .take(500)
    return bookResults.length
  },
})

/**
 * Get authors by publisher ID
 */
export const getAuthorsByPublisherId = query({
  args: { publisherId: v.string() },
  handler: async (ctx, args) => {
    const publisherResults = await ctx.db
      .query('publishers')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.publisherId), q.eq(q.field('_id'), args.publisherId)))
      .take(1)
    const publisher = publisherResults[0]
    if (!publisher) return []

    const publisherSupabaseId = publisher.supabaseId ?? publisher._id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.eq(q.field('publisherId'), publisherSupabaseId))
      .take(500)

    if (bookResults.length === 0) return []

    const bookIds = bookResults.map(b => b.supabaseId ?? b._id)
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.or(...bookIds.map(id => q.eq(q.field('bookId'), id))))
      .take(500)

    const authorIds = new Set<string>()
    baResults.forEach(ba => authorIds.add(ba.authorId))

    const allAuthors = await ctx.db.query('authors').collect()
    return allAuthors.filter(a => authorIds.has(a.supabaseId ?? a._id))
  },
})

/**
 * Count unique authors for a publisher
 */
export const getPublisherAuthorCount = query({
  args: { publisherId: v.string() },
  handler: async (ctx, args) => {
    const publisherResults = await ctx.db
      .query('publishers')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.publisherId), q.eq(q.field('_id'), args.publisherId)))
      .take(1)
    const publisher = publisherResults[0]
    if (!publisher) return 0

    const publisherSupabaseId = publisher.supabaseId ?? publisher._id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.eq(q.field('publisherId'), publisherSupabaseId))
      .take(500)

    if (bookResults.length === 0) return 0

    const bookIds = bookResults.map(b => b.supabaseId ?? b._id)
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.or(...bookIds.map(id => q.eq(q.field('bookId'), id))))
      .take(500)

    const authorIds = new Set<string>()
    baResults.forEach(ba => authorIds.add(ba.authorId))
    return authorIds.size
  },
})