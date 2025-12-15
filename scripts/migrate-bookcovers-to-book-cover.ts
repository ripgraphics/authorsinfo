/**
 * Migration Script: Move book covers from authorsinfo/bookcovers to authorsinfo/book_cover
 * 
 * This script:
 * 1. Finds all images in Supabase database with URLs in the 'authorsinfo/bookcovers' folder
 * 2. Uses Cloudinary Admin API to rename/move images from 'authorsinfo/bookcovers' to 'authorsinfo/book_cover'
 * 3. Updates Supabase database URLs to reflect the new paths
 * 
 * Usage:
 *   npx tsx scripts/migrate-bookcovers-to-book-cover.ts
 * 
 * Or if using ts-node:
 *   npx ts-node scripts/migrate-bookcovers-to-book-cover.ts
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Extract public_id from Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/authorsinfo/bookcovers/image.jpg
 * Returns: authorsinfo/bookcovers/image
 */
function extractPublicId(url: string): string | null {
  try {
    // Match pattern: /upload/(optional version)/folder/path/filename
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  } catch (error) {
    console.error(`Error extracting public_id from URL ${url}:`, error)
    return null
  }
}

/**
 * Convert old public_id to new public_id
 * authorsinfo/bookcovers/image -> authorsinfo/book_cover/image
 */
function convertPublicId(oldPublicId: string): string {
  return oldPublicId.replace(/^authorsinfo\/bookcovers\//, 'authorsinfo/book_cover/')
}

/**
 * Generate Cloudinary signature for admin API calls
 */
function generateSignature(params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc: Record<string, string>, key) => {
      acc[key] = params[key]
      return acc
    }, {})

  const signatureString =
    Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&') + apiSecret

  return crypto.createHash('sha1').update(signatureString).digest('hex')
}

/**
 * Rename/move an image in Cloudinary using the admin API
 */
async function renameImageInCloudinary(oldPublicId: string, newPublicId: string): Promise<boolean> {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000)
    
    const params: Record<string, string> = {
      from_public_id: oldPublicId,
      to_public_id: newPublicId,
      timestamp: timestamp.toString(),
    }

    const signature = generateSignature(params)

    const formData = new FormData()
    formData.append('from_public_id', oldPublicId)
    formData.append('to_public_id', newPublicId)
    formData.append('api_key', apiKey || '')
    formData.append('timestamp', timestamp.toString())
    formData.append('signature', signature)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/rename`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Failed to rename ${oldPublicId}:`, errorText)
      return false
    }

    const data = await response.json()
    if (data.public_id === newPublicId) {
      console.log(`✅ Successfully renamed: ${oldPublicId} -> ${newPublicId}`)
      return true
    } else {
      console.error(`❌ Rename returned unexpected public_id: ${data.public_id}`)
      return false
    }
  } catch (error) {
    console.error(`❌ Error renaming ${oldPublicId}:`, error)
    return false
  }
}

/**
 * Update URL in Supabase database
 */
function convertUrl(oldUrl: string): string {
  return oldUrl.replace('/authorsinfo/bookcovers/', '/authorsinfo/book_cover/')
}

async function updateDatabaseUrl(imageId: string, oldUrl: string, newUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('images')
      .update({ url: newUrl })
      .eq('id', imageId)

    if (error) {
      console.error(`❌ Failed to update database for image ${imageId}:`, error)
      return false
    }

    console.log(`✅ Updated database URL for image ${imageId}`)
    return true
  } catch (error) {
    console.error(`❌ Error updating database for image ${imageId}:`, error)
    return false
  }
}

/**
 * Main migration function
 */
async function migrateBookCovers() {
  console.log('🚀 Starting migration: bookcovers -> book_cover\n')

  try {
    // Step 1: Find all images with URLs containing 'authorsinfo/bookcovers'
    console.log('📋 Step 1: Finding all images in Supabase with bookcovers URLs...')
    
    const { data: images, error } = await supabase
      .from('images')
      .select('id, url, metadata')
      .like('url', '%authorsinfo/bookcovers%')

    if (error) {
      console.error('❌ Error querying images:', error)
      process.exit(1)
    }

    if (!images || images.length === 0) {
      console.log('✅ No images found in bookcovers folder. Migration complete!')
      return
    }

    console.log(`📊 Found ${images.length} images to migrate\n`)

    // Step 2: Process each image
    let successCount = 0
    let failureCount = 0
    const failures: Array<{ id: string; url: string; error: string }> = []

    for (const image of images) {
      const oldUrl = image.url
      const publicId = extractPublicId(oldUrl)

      if (!publicId || !publicId.includes('authorsinfo/bookcovers')) {
        console.log(`⚠️  Skipping image ${image.id}: Could not extract public_id or not in bookcovers folder`)
        continue
      }

      const newPublicId = convertPublicId(publicId)
      const newUrl = convertUrl(oldUrl)

      console.log(`\n📦 Processing image ${image.id}:`)
      console.log(`   Old URL: ${oldUrl}`)
      console.log(`   Old public_id: ${publicId}`)
      console.log(`   New public_id: ${newPublicId}`)
      console.log(`   New URL: ${newUrl}`)

      // Step 2a: Rename in Cloudinary
      const renamed = await renameImageInCloudinary(publicId, newPublicId)
      
      if (!renamed) {
        failureCount++
        failures.push({
          id: image.id,
          url: oldUrl,
          error: 'Failed to rename in Cloudinary'
        })
        continue
      }

      // Step 2b: Update database
      const updated = await updateDatabaseUrl(image.id, oldUrl, newUrl)
      
      if (!updated) {
        failureCount++
        failures.push({
          id: image.id,
          url: oldUrl,
          error: 'Failed to update database (image may have been renamed in Cloudinary)'
        })
        continue
      }

      successCount++

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Step 3: Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${successCount}`)
    console.log(`   ❌ Failed: ${failureCount}`)
    
    if (failures.length > 0) {
      console.log('\n❌ Failed images:')
      failures.forEach(failure => {
        console.log(`   - Image ${failure.id}: ${failure.error}`)
        console.log(`     URL: ${failure.url}`)
      })
    }
    
    console.log('='.repeat(60))

    if (failureCount > 0) {
      console.log('\n⚠️  Some images failed to migrate. Please review the errors above.')
      process.exit(1)
    } else {
      console.log('\n✅ Migration completed successfully!')
    }

  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
    process.exit(1)
  }
}

// Run the migration
migrateBookCovers()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

