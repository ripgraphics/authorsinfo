import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get activities/posts related to an author's books
 */
export const getAuthorActivities = query({
  args: {
    authorId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10

    // First get books by this author
    const bookAuthors = await ctx.db.query('book_authors').collect()
    const bookIds = bookAuthors
      .filter((ba: any) => ba.authorId === args.authorId || ba.author_id === args.authorId)
      .map((ba: any) => ba.bookId || ba.book_id)

    if (bookIds.length === 0) {
      return []
    }

    // Get posts/activities related to these books
    const posts = await ctx.db.query('posts').collect()
    
    const activities = posts
      .filter((p: any) => {
        const entityId = p.entity_id || p.book_id
        return bookIds.includes(entityId) && p.publish_status === 'published'
      })
      .sort((a: any, b: any) => (b.created_at ?? 0) - (a.created_at ?? 0))
      .slice(0, limit)

    return activities
  },
})

/**
 * Get photo albums for an entity
 */
export const getAlbums = query({
  args: {
    entityId: v.string(),
    entityType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const entityType = args.entityType ?? 'author'
    
    // Get all photo albums
    const albums = await ctx.db.query('photo_albums').collect()
    
    // Filter by entity
    const filtered = albums.filter((a: any) => {
      const entityField = a.entity_id || a.entityId
      return entityField === args.entityId && a.entity_type === entityType
    })

    // Sort by created date descending
    return filtered.sort((a: any, b: any) => (b.created_at ?? 0) - (a.created_at ?? 0))
  },
})
