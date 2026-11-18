import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get books associated with an author (by Supabase UUID or Convex _id)
 */
export const getBooksByAuthor = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    // Resolve author to their Convex _id
    const authorResults = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.authorId), q.eq(q.field('_id'), args.authorId)))
      .take(1)
    const author = authorResults[0]
    if (!author) return []

    // Find all book_author links for this author (using supabaseId which stores the original UUID)
    const authorSupabaseId = author.supabaseId ?? author._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('authorId'), authorSupabaseId))
      .take(500)
    const bookIds = baResults.map(ba => ba.bookId)

    // Fetch those books
    if (bookIds.length === 0) return []
    const allBooks = await ctx.db.query('books').collect()
    return allBooks.filter(b => bookIds.includes(b.supabaseId ?? b._id))
  },
})

/**
 * Get authors associated with a book (by Supabase UUID or Convex _id)
 */
export const getAuthorsByBook = query({
  args: { bookId: v.string() },
  handler: async (ctx, args) => {
    // Resolve book to Convex _id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.bookId), q.eq(q.field('_id'), args.bookId)))
      .take(1)
    const book = bookResults[0]
    if (!book) return []

    // Find all book_author links for this book (using supabaseId which stores the original UUID)
    const bookSupabaseId = book.supabaseId ?? book._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('bookId'), bookSupabaseId))
      .take(500)
    const authorIds = baResults.map(ba => ba.authorId)

    if (authorIds.length === 0) return []
    const allAuthors = await ctx.db.query('authors').collect()
    return allAuthors.filter(a => authorIds.includes(a.supabaseId ?? a._id))
  },
})

/**
 * Get authors by book ID (alias for getAuthorsByBook)
 */
export const getAuthorsByBookId = query({
  args: { bookId: v.string() },
  handler: async (ctx, args) => {
    // Resolve book to Convex _id
    const bookResults = await ctx.db
      .query('books')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.bookId), q.eq(q.field('_id'), args.bookId)))
      .take(1)
    const book = bookResults[0]
    if (!book) return []

    // Find all book_author links for this book (using supabaseId which stores the original UUID)
    const bookSupabaseId = book.supabaseId ?? book._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('bookId'), bookSupabaseId))
      .take(500)
    const authorIds = baResults.map(ba => ba.authorId)

    if (authorIds.length === 0) return []
    const allAuthors = await ctx.db.query('authors').collect()
    return allAuthors.filter(a => authorIds.includes(a.supabaseId ?? a._id))
  },
})

/**
 * Get books by author ID (alias for getBooksByAuthor)
 */
export const getBooksByAuthorId = query({
  args: { authorId: v.string() },
  handler: async (ctx, args) => {
    // Resolve author to their Convex _id
    const authorResults = await ctx.db
      .query('authors')
      .filter(q => q.or(q.eq(q.field('supabaseId'), args.authorId), q.eq(q.field('_id'), args.authorId)))
      .take(1)
    const author = authorResults[0]
    if (!author) return []

    // Find all book_author links for this author (using supabaseId which stores the original UUID)
    const authorSupabaseId = author.supabaseId ?? author._id
    const baResults = await ctx.db
      .query('bookAuthors')
      .filter(q => q.eq(q.field('authorId'), authorSupabaseId))
      .take(500)
    const bookIds = baResults.map(ba => ba.bookId)

    // Fetch those books
    if (bookIds.length === 0) return []
    const allBooks = await ctx.db.query('books').collect()
    return allBooks.filter(b => bookIds.includes(b.supabaseId ?? b._id))
  },
})
