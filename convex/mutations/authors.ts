import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Create a new author
 */
export const createAuthor = mutation({
  args: {
    name: v.string(),
    bio: v.optional(v.string()),
    nationality: v.optional(v.string()),
    website: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return ctx.db.insert('authors', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * Update an existing author
 */
export const updateAuthor = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    nationality: v.optional(v.string()),
    website: v.optional(v.string()),
    twitterHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    // Find the author by id field (since our migrated data uses original UUIDs)
    const authors = await ctx.db.query('authors').collect()
    const author = authors.find((a: any) => a.id === id || a._id === id)
    
    if (!author) {
      throw new Error('Author not found')
    }

    return ctx.db.patch(author._id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Delete an author
 */
export const deleteAuthor = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const { id } = args
    const authors = await ctx.db.query('authors').collect()
    const author = authors.find((a: any) => a.id === id || a._id === id)
    
    if (!author) {
      throw new Error('Author not found')
    }

    return ctx.db.delete(author._id)
  },
})
