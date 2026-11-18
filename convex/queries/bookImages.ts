import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Get all images for a book by its Supabase ID or Convex _id
 */
export const getBookImages = query({
  args: { bookId: v.string() },
  handler: async (ctx, args) => {
    // Try direct entity_id match first (most common case)
    let results = await ctx.db
      .query('images')
      .filter(q => q.eq(q.field('entity_id'), args.bookId))
      .collect()

    // Fallback: try matching by Convex _id
    if (results.length === 0) {
      const bookResults = await ctx.db
        .query('books')
        .filter(q => q.or(q.eq(q.field('supabaseId'), args.bookId), q.eq(q.field('_id'), args.bookId)))
        .take(1)
      
      const book = bookResults[0]
      if (!book) return []

      results = await ctx.db
        .query('images')
        .filter(q => q.eq(q.field('entity_id'), book.supabaseId ?? book._id))
        .collect()
    }
    
    // Map to expected format
    return results
      .map(img => ({
            id: img._id,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        large_url: img.large_url,
        medium_url: img.medium_url,
        alt_text: img.alt_text,
        caption: img.caption,
        image_type: img.image_type || 'unknown',
        is_featured: img.is_featured || false,
        created_at: img.created_at,
      }))
      .sort((a, b) => {
        // Sort by type: front cover first, then back cover, then gallery
        const order: Record<string, number> = {
          'book_cover_front': 0,
          'book_cover_back': 1,
          'book_gallery': 2,
        }
        return (order[a.image_type] ?? 99) - (order[b.image_type] ?? 99)
      })
  },
})
