import { mutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Migration to fix entity_id in images table by matching alt_text to book titles
 */
export const fixImageEntityIds = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all books
    const books = await ctx.db.query('books').collect()
    console.log(`Found ${books.length} books`)

    // Get all images with entity_type_id = 'book'
    const images = await ctx.db
      .query('images')
      .filter(q => q.eq(q.field('entity_type_id'), 'book'))
      .collect()
    console.log(`Found ${images.length} book images`)

    // Build a map of book title -> book
    const bookByTitle = new Map<string, any>()
    books.forEach(book => {
      if (book.title) {
        bookByTitle.set(book.title.toLowerCase().trim(), book)
      }
    })

    // Build a map of image alt_text -> image
    const imageByAltText = new Map<string, any>()
    images.forEach(img => {
      if (img.alt_text) {
        imageByAltText.set(img.alt_text.toLowerCase().trim(), img)
      }
    })

    console.log(`Book titles: ${bookByTitle.size}`)
    console.log(`Image alt_texts: ${imageByAltText.size}`)

    let matched = 0
    let unmatched = 0

    // Try to match by exact title
    for (const [title, book] of bookByTitle) {
      const image = imageByAltText.get(title)
      if (image) {
        console.log(`Matched: "${title}" -> ${image.url}`)
        matched++
        
        // Update the image with the book's supabaseId
        await ctx.db.patch(image._id, {
          entity_id: book.supabaseId ?? book._id,
          metadata: {
            ...image.metadata,
            entity_id: book.supabaseId ?? book._id,
            entity_type: 'book',
          }
        })
      } else {
        unmatched++
      }
    }

    console.log(`Matched: ${matched}, Unmatched: ${unmatched}`)
    
    // Also try fuzzy matching for remaining
    if (unmatched > 0) {
      console.log('\nTrying fuzzy matching...')
      for (const [title, book] of bookByTitle) {
        if (imageByAltText.has(title)) continue
        
        // Try partial match
        for (const [altText, image] of imageByAltText) {
          if (altText.includes(title) || title.includes(altText)) {
            console.log(`Fuzzy matched: "${title}" ~ "${altText}" -> ${image.url}`)
            matched++
            
            await ctx.db.patch(image._id, {
              entity_id: book.supabaseId ?? book._id,
              metadata: {
                ...image.metadata,
                entity_id: book.supabaseId ?? book._id,
                entity_type: 'book',
              }
            })
            break
          }
        }
      }
    }

    return { matched, unmatched }
  },
})