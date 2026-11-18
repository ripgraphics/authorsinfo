import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new book
 */
export const createBook = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    isbn10: v.optional(v.string()),
    publisherId: v.optional(v.string()),
    authorIds: v.array(v.string()),
    publishedAt: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
    format: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Insert the book
    const bookId = await ctx.db.insert('books', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })

    // Create book-author relationships if provided
    if (args.authorIds && args.authorIds.length > 0) {
      for (const authorId of args.authorIds) {
        await ctx.db.insert('book_authors', {
          bookId: bookId,
          authorId: authorId,
          role: 'author',
          order: 0,
          createdAt: now,
        })
      }
    }

    return bookId
  },
})

/**
 * Update an existing book
 */
export const updateBook = mutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    isbn13: v.optional(v.string()),
    isbn10: v.optional(v.string()),
    publisherId: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    pageCount: v.optional(v.number()),
    language: v.optional(v.string()),
    format: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    isAvailable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    
    // Find by id field
    const books = await ctx.db.query('books').collect()
    const book = books.find((b: any) => b.id === id || b._id === id)
    
    if (!book) {
      throw new Error('Book not found')
    }

    return ctx.db.patch(book._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Delete a book
 */
export const deleteBook = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const { id } = args
    
    // Find by id field
    const books = await ctx.db.query('books').collect()
    const book = books.find((b: any) => b.id === id || b._id === id)
    
    if (!book) {
      throw new Error('Book not found')
    }

    // Also delete related book_authors entries
    const bookAuthors = await ctx.db.query('book_authors').collect()
    for (const ba of bookAuthors) {
      if ((ba.bookId === id || ba.book_id === id) && ba._id) {
        await ctx.db.delete(ba._id)
      }
    }

    return ctx.db.delete(book._id)
  },
})
