'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

interface SyncResult {
  success: boolean
  totalPublishers: number
  updatedCount: number
  skippedCount: number
  errors: string[]
}

/**
 * Syncs publisher_image_id for all publishers that have avatars in albums
 * This is a one-time migration script to backfill existing data
 */
export async function syncPublisherAvatars(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    totalPublishers: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [],
  }

  try {
    console.log('🔄 Starting publisher avatar sync...')

    // Get all publishers
    const { data: publishers, error: publishersError } = await supabaseAdmin
      .from('publishers')
      .select('id, name, publisher_image_id')

    if (publishersError) {
      throw new Error(`Failed to fetch publishers: ${publishersError.message}`)
    }

    if (!publishers || publishers.length === 0) {
      console.log('⚠️ No publishers found')
      return result
    }

    result.totalPublishers = publishers.length
    console.log(`📊 Found ${publishers.length} publishers`)

    // Process each publisher
    for (const publisher of publishers as any[]) {
      try {
        // Skip if already has publisher_image_id
        if ((publisher as any).publisher_image_id) {
          result.skippedCount++
          console.log(`⏭️  Skipping ${(publisher as any).name} - already has publisher_image_id`)
          continue
        }

        // Find "Avatar Images" album for this publisher
        const { data: avatarAlbums, error: albumsError } = await supabaseAdmin
          .from('photo_albums')
          .select('id')
          .eq('entity_type', 'publisher')
          .eq('entity_id', (publisher as any).id)
          .eq('name', 'Avatar Images')
          .limit(1)
          .maybeSingle()

        if (albumsError) {
          result.errors.push(
            `Error fetching album for ${(publisher as any).name}: ${albumsError.message}`
          )
          continue
        }

        if (!avatarAlbums) {
          result.skippedCount++
          console.log(`⏭️  Skipping ${(publisher as any).name} - no avatar album found`)
          continue
        }

        // Get the cover image (or first image if no cover)
        const { data: coverImage, error: coverError } = await supabaseAdmin
          .from('album_images')
          .select(
            `
            image_id,
            is_cover,
            image:images(id)
          `
          )
          .eq('album_id', (avatarAlbums as any).id)
          .order('is_cover', { ascending: false })
          .order('display_order', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (coverError) {
          result.errors.push(
            `Error fetching cover image for ${(publisher as any).name}: ${coverError.message}`
          )
          continue
        }

        if (!coverImage || !(coverImage as any).image_id) {
          result.skippedCount++
          console.log(`⏭️  Skipping ${(publisher as any).name} - no images in album`)
          continue
        }

        // Update publisher_image_id
        const { error: updateError } = await (supabaseAdmin.from('publishers') as any)
          .update({ publisher_image_id: (coverImage as any).image_id })
          .eq('id', (publisher as any).id)

        if (updateError) {
          result.errors.push(`Error updating ${(publisher as any).name}: ${updateError.message}`)
          continue
        }

        result.updatedCount++
        console.log(
          `✅ Updated ${(publisher as any).name} with image_id: ${(coverImage as any).image_id}`
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.errors.push(`Error processing ${(publisher as any).name}: ${errorMessage}`)
        console.error(`❌ Error processing ${(publisher as any).name}:`, error)
      }
    }

    console.log(`\n📊 Sync complete:`)
    console.log(`   Total publishers: ${result.totalPublishers}`)
    console.log(`   Updated: ${result.updatedCount}`)
    console.log(`   Skipped: ${result.skippedCount}`)
    console.log(`   Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered:`)
      result.errors.forEach((error) => console.log(`   - ${error}`))
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    result.success = false
    result.errors.push(`Fatal error: ${errorMessage}`)
    console.error('❌ Fatal error in sync:', error)
    return result
  }
}
