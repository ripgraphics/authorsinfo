import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get reading progress for books by a specific author
 */
export const getReadingProgressByAuthor = query({
  args: {
    authorId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First get all books by this author
    const bookAuthors = await ctx.db.query('book_authors').collect()
    const bookIds = bookAuthors
      .filter((ba: any) => ba.authorId === args.authorId || ba.author_id === args.authorId)
      .map((ba: any) => ba.bookId || ba.book_id)

    if (bookIds.length === 0) {
      return []
    }

    // Get reading progress for these books
    const progress = await ctx.db.query('reading_progress').collect()
    
    // Filter by book IDs and status
    let result = progress.filter((p: any) => 
      bookIds.includes(p.bookId || p.book_id) && p.status === 'in_progress'
    )

    // If userId provided, filter to that user's progress
    if (args.userId) {
      result = result.filter((p: any) => p.userId === args.userId || p.user_id === args.userId)
    }

    // Sort by updated_at descending
    return result.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  },
})

/**
 * Get books currently being read by users
 */
export const getCurrentlyReadingBooks = query({
  args: {
    bookIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.bookIds.length === 0) {
      return []
    }

    // Get reading progress for these books
    const allProgress = await ctx.db.query('reading_progress').collect()
    
    const progress = allProgress.filter((p: any) => {
      const bookId = p.bookId || p.book_id
          return bookId && args.bookIds.includes(bookId) && p.status === 'in_progress'
    })

    // Group by book and count unique readers
    const bookReaders = new Map<string, number>()
    for (const p of progress) {
      const bookId = p.bookId || p.book_id
          if (bookId) {
            bookReaders.set(bookId, (bookReaders.get(bookId) ?? 0) + 1)
          }
    }

    return Array.from(bookReaders.entries()).map(([bookId, count]) => ({
      bookId,
      readers: count,
    }))
  },
})

/**
 * Get reading progress for a specific book by user (or all users)
 */
export const getReadingProgressByBook = query({
  args: {
    bookId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allProgress = await ctx.db.query('reading_progress').collect()
    
    let result = allProgress.filter((p: any) => {
      const bookId = p.bookId || p.book_id
      return bookId === args.bookId
    })

    // If userId provided, filter to that user's progress
    if (args.userId) {
      result = result.filter((p: any) => {
        const userId = p.userId || p.user_id
        return userId === args.userId
      })
      
      // Return single record if exists
      return result.length > 0 ? result[0] : null
    }

    return result.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  },
})
