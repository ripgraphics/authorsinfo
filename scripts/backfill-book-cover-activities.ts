/**
 * Backfill Script: Create timeline activities for existing books with cover images
 * 
 * This script creates activities in the activities table for all existing books
 * that have cover images but don't have corresponding timeline activities.
 * 
 * Usage: npx tsx scripts/backfill-book-cover-activities.ts
 */

import { createClient } from '@supabase/supabase-js'
import { createActivityWithValidation } from '../app/actions/create-activity-with-validation'
import { ActivityTypes } from '../app/actions/activities'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface BookWithCover {
  book_id: string
  book_title: string
  image_id: string
  image_url: string
  image_alt_text: string | null
  image_type: string
  created_at: string
}

async function getBooksWithCoverImages(): Promise<BookWithCover[]> {
  console.log('📚 Fetching books with cover images...')

  const booksWithCovers: BookWithCover[] = []

  // Method 1: Books with cover_image_id (direct reference)
  const { data: booksWithCoverId, error: booksError } = await supabase
    .from('books')
    .select('id, title, cover_image_id')
    .not('cover_image_id', 'is', null)

  if (booksError) {
    console.error('❌ Error fetching books with cover_image_id:', booksError)
  } else if (booksWithCoverId) {
    console.log(`   Found ${booksWithCoverId.length} books with cover_image_id`)

    // Get image URLs for these books
    const imageIds = booksWithCoverId
      .map((b) => (b as any).cover_image_id)
      .filter(Boolean)

    if (imageIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('id, url, alt_text, created_at')
        .in('id', imageIds)

      if (imagesError) {
        console.error('❌ Error fetching images:', imagesError)
      } else if (images) {
        const imageMap = new Map(images.map((img) => [img.id, img]))

        for (const book of booksWithCoverId) {
          const imageId = (book as any).cover_image_id
          const image = imageMap.get(imageId)

          if (image) {
            booksWithCovers.push({
              book_id: book.id,
              book_title: book.title || 'Untitled Book',
              image_id: imageId,
              image_url: image.url,
              image_alt_text: image.alt_text || null,
              image_type: 'book_cover_front',
              created_at: image.created_at || new Date().toISOString(),
            })
          }
        }
      }
    }
  }

  // Method 2: Books with cover images via album_images (book_cover_front or book_cover_back)
  const { data: albumImages, error: albumError } = await supabase
    .from('album_images')
    .select('id, entity_id, image_id, image_type, created_at')
    .eq('entity_type', 'book')
    .in('image_type', ['book_cover_front', 'book_cover_back'])

  if (albumError) {
    console.error('❌ Error fetching album_images:', albumError)
  } else if (albumImages) {
    console.log(`   Found ${albumImages.length} album_images with cover types`)

    // Get unique image IDs and book IDs
    const imageIds = [...new Set(albumImages.map((ai) => ai.image_id).filter(Boolean))]
    const bookIds = [...new Set(albumImages.map((ai) => ai.entity_id).filter(Boolean))]

    // Get image URLs
    if (imageIds.length > 0) {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('id, url, alt_text, created_at')
        .in('id', imageIds)

      if (imagesError) {
        console.error('❌ Error fetching images for album_images:', imagesError)
      } else if (images) {
        const imageMap = new Map(images.map((img) => [img.id, img]))

        // Get book titles
        const { data: books, error: booksError2 } = await supabase
          .from('books')
          .select('id, title')
          .in('id', bookIds)

        const bookMap = new Map(
          books?.map((b) => [b.id, b.title || 'Untitled Book']) || []
        )

        // Create entries for album_images, avoiding duplicates from Method 1
        const existingBookIds = new Set(booksWithCovers.map((b) => b.book_id))

        for (const albumImage of albumImages) {
          if (!existingBookIds.has(albumImage.entity_id)) {
            const image = imageMap.get(albumImage.image_id)
            const bookTitle = bookMap.get(albumImage.entity_id) || 'Untitled Book'

            if (image) {
              booksWithCovers.push({
                book_id: albumImage.entity_id,
                book_title: bookTitle,
                image_id: albumImage.image_id,
                image_url: image.url,
                image_alt_text: image.alt_text || null,
                image_type: albumImage.image_type || 'book_cover_front',
                created_at: albumImage.created_at || image.created_at || new Date().toISOString(),
              })
            }
          }
        }
      }
    }
  }

  console.log(`✅ Total books with cover images found: ${booksWithCovers.length}`)
  return booksWithCovers
}

async function checkExistingActivities(bookIds: string[]): Promise<Set<string>> {
  console.log('🔍 Checking for existing activities...')

  const { data: existingActivities, error } = await supabase
    .from('activities')
    .select('entity_id')
    .eq('entity_type', 'book')
    .eq('activity_type', ActivityTypes.PHOTO_ADDED)
    .in('entity_id', bookIds)

  if (error) {
    console.error('❌ Error checking existing activities:', error)
    return new Set()
  }

  const bookIdsWithActivities = new Set(
    existingActivities?.map((a) => a.entity_id).filter(Boolean) || []
  )

  console.log(
    `   Found ${bookIdsWithActivities.size} books that already have photo_added activities`
  )

  return bookIdsWithActivities
}

async function getSystemUser(): Promise<string | null> {
  // Get first admin user or first user as fallback
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single()

  return adminUser?.id || null
}

async function backfillActivities() {
  console.log('🚀 Starting backfill of book cover activities...\n')

  try {
    // Get all books with cover images
    const booksWithCovers = await getBooksWithCoverImages()

    if (booksWithCovers.length === 0) {
      console.log('✅ No books with cover images found. Nothing to backfill.')
      return
    }

    // Check which books already have activities
    const bookIds = booksWithCovers.map((b) => b.book_id)
    const existingActivities = await checkExistingActivities(bookIds)

    // Filter out books that already have activities
    const booksToProcess = booksWithCovers.filter(
      (b) => !existingActivities.has(b.book_id)
    )

    console.log(`\n📋 Books to process: ${booksToProcess.length}`)
    console.log(`   (Skipping ${existingActivities.size} books with existing activities)\n`)

    if (booksToProcess.length === 0) {
      console.log('✅ All books already have activities. Nothing to backfill.')
      return
    }

    // Get system user for activity attribution
    const systemUserId = await getSystemUser()
    if (!systemUserId) {
      console.error('❌ Could not find system user for activity attribution')
      return
    }

    // Process in batches
    const batchSize = 50
    let processed = 0
    let created = 0
    let errors = 0

    for (let i = 0; i < booksToProcess.length; i += batchSize) {
      const batch = booksToProcess.slice(i, i + batchSize)
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(booksToProcess.length / batchSize)} (${batch.length} books)...`)

      for (const book of batch) {
        try {
          const result = await createActivityWithValidation({
            user_id: systemUserId,
            activity_type: ActivityTypes.PHOTO_ADDED,
            content_type: 'image',
            image_url: book.image_url,
            entity_type: 'book',
            entity_id: book.book_id,
            metadata: {
              image_type: book.image_type,
              alt_text: book.image_alt_text || book.book_title,
              source: 'backfill_script',
            },
            publish_status: 'published',
            published_at: book.created_at,
            created_at: book.created_at,
            updated_at: new Date().toISOString(),
          })

          if (result.success) {
            created++
          } else {
            console.error(
              `   ❌ Failed to create activity for book "${book.book_title}": ${result.error}`
            )
            errors++
          }
        } catch (error) {
          console.error(
            `   ❌ Error creating activity for book "${book.book_title}":`,
            error
          )
          errors++
        }

        processed++

        // Progress indicator
        if (processed % 10 === 0) {
          console.log(`   Progress: ${processed}/${booksToProcess.length} (${created} created, ${errors} errors)`)
        }
      }
    }

    console.log('\n✅ Backfill completed!')
    console.log(`   Total processed: ${processed}`)
    console.log(`   Activities created: ${created}`)
    console.log(`   Errors: ${errors}`)
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error)
    process.exit(1)
  }
}

// Run the backfill
backfillActivities()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
