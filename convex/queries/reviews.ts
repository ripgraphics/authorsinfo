import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get reviews for a specific book
 */
export const getReviewsByBook = query({
  args: {
    bookId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allReviews = await ctx.db.query('reviews').collect()
    const users = await ctx.db.query('users').collect()
    
    // Filter by book ID
    let reviews = allReviews.filter((r: any) => {
      const bookId = r.bookId || r.book_id
      return bookId === args.bookId
    })

    // Limit results
    const limit = args.limit ?? 100
    reviews = reviews.slice(0, limit)

    // Create users map for lookups
    const usersMap = new Map(users.map((u: any) => [u.id || u._id, u]))

    // Transform to include user data
    return reviews.map((r: any) => {
      const userId = r.userId || r.user_id
      const user = usersMap.get(userId)
      
      return {
        id: r.id || r._id,
        bookId: r.bookId || r.book_id,
        userId: r.userId || r.user_id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isPublic: r.isPublic ?? r.is_public ?? true,
        createdAt: r.createdAt ?? r.created_at,
        updatedAt: r.updatedAt ?? r.updated_at,
        user: user ? {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          avatarId: user.avatarId,
        } : null,
      }
    })
  },
})