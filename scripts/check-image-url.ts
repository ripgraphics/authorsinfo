/**
 * Script to check if a specific image URL exists in Supabase and is linked to a user profile
 * Usage: npx tsx scripts/check-image-url.ts <image-url>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

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
    persistSession: false
  }
})

async function checkImageUrl(imageUrl: string) {
  console.log(`\n🔍 Checking image URL in Supabase...\n`)
  console.log(`URL: ${imageUrl}\n`)
  
  try {
    // Step 1: Check if image exists in images table
    console.log('📋 Step 1: Checking images table...')
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, url, alt_text, storage_provider, storage_path, created_at, updated_at, metadata')
      .eq('url', imageUrl)
      .maybeSingle()
    
    if (imageError && imageError.code !== 'PGRST116') {
      console.error('❌ Error querying images table:', imageError.message)
      return
    }
    
    if (!image) {
      console.log('❌ Image NOT found in Supabase images table')
      console.log('\n💡 This image URL is not stored in your database.')
      console.log('   It may be:')
      console.log('   - An external image not uploaded through your system')
      console.log('   - An orphaned image that was deleted from the database')
      console.log('   - A Cloudinary image that was never saved to Supabase')
      return
    }
    
    console.log('✅ Image found in Supabase images table:')
    console.log(`   Image ID: ${image.id}`)
    console.log(`   URL: ${image.url}`)
    console.log(`   Alt Text: ${image.alt_text || 'N/A'}`)
    console.log(`   Storage Provider: ${image.storage_provider || 'N/A'}`)
    console.log(`   Storage Path: ${image.storage_path || 'N/A'}`)
    console.log(`   Created At: ${image.created_at}`)
    console.log(`   Updated At: ${image.updated_at || 'N/A'}`)
    if (image.metadata) {
      console.log(`   Metadata:`, JSON.stringify(image.metadata, null, 2))
    }
    
    // Step 2: Check if this image is linked to any user profile via avatar_image_id
    console.log('\n📋 Step 2: Checking if linked to user profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, avatar_image_id, cover_image_id, created_at')
      .eq('avatar_image_id', image.id)
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError.message)
    } else if (profiles && profiles.length > 0) {
      console.log(`✅ Found ${profiles.length} user profile(s) with this avatar:\n`)
      
      for (const profile of profiles) {
        // Get user details
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email, permalink, created_at')
          .eq('id', profile.user_id)
          .single()
        
        if (user) {
          console.log(`   👤 User: ${user.name || 'Unknown'}`)
          console.log(`      ID: ${user.id}`)
          console.log(`      Permalink: ${user.permalink || 'N/A'}`)
          console.log(`      Email: ${user.email || 'N/A'}`)
          console.log(`      Profile ID: ${profile.id}`)
          console.log(`      Avatar Image ID: ${profile.avatar_image_id}`)
          console.log(`      Cover Image ID: ${profile.cover_image_id || 'N/A'}`)
          console.log('')
        } else {
          console.log(`   ⚠️  Profile ${profile.id} linked to user ${profile.user_id} (user not found)`)
        }
      }
    } else {
      console.log('❌ Image is NOT linked to any user profile')
      console.log('   This image exists in the database but is not set as any user\'s avatar.')
    }
    
    // Step 3: Check if this image is in any album_images entries
    console.log('\n📋 Step 3: Checking album_images (album entries)...')
    const { data: albumImages, error: albumImagesError } = await supabase
      .from('album_images')
      .select('id, entity_id, entity_type_id, image_id, is_cover, is_featured, created_at, album_id')
      .eq('image_id', image.id)
    
    if (albumImagesError) {
      console.error('❌ Error querying album_images:', albumImagesError.message)
    } else if (albumImages && albumImages.length > 0) {
      console.log(`✅ Found ${albumImages.length} album entry/entries:\n`)
      
      for (const entry of albumImages) {
        console.log(`   📁 Entry ID: ${entry.id}`)
        console.log(`      Album ID: ${entry.album_id}`)
        console.log(`      Entity ID: ${entry.entity_id || 'N/A'}`)
        console.log(`      Entity Type ID: ${entry.entity_type_id || 'N/A'}`)
        console.log(`      Is Cover: ${entry.is_cover || false}`)
        console.log(`      Is Featured: ${entry.is_featured || false}`)
        console.log(`      Created At: ${entry.created_at}`)
        
        // If entity_id exists, try to get user details
        if (entry.entity_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, name, permalink')
            .eq('id', entry.entity_id)
            .single()
          
          if (user) {
            console.log(`      User: ${user.name} (${user.permalink || user.id})`)
          }
        }
        console.log('')
      }
    } else {
      console.log('❌ Image is NOT in any album_images entries')
      console.log('   This image is not part of any user\'s album.')
    }
    
    // Step 4: Check if this image is used as cover_image_id in profiles
    console.log('\n📋 Step 4: Checking if used as cover image...')
    const { data: coverProfiles, error: coverProfilesError } = await supabase
      .from('profiles')
      .select('id, user_id, cover_image_id')
      .eq('cover_image_id', image.id)
    
    if (coverProfilesError) {
      console.error('❌ Error querying profiles for cover:', coverProfilesError.message)
    } else if (coverProfiles && coverProfiles.length > 0) {
      console.log(`✅ Found ${coverProfiles.length} profile(s) using this as cover image:\n`)
      
      for (const profile of coverProfiles) {
        const { data: user } = await supabase
          .from('users')
          .select('id, name, permalink')
          .eq('id', profile.user_id)
          .single()
        
        if (user) {
          console.log(`   👤 User: ${user.name || 'Unknown'} (${user.permalink || user.id})`)
        }
      }
    } else {
      console.log('ℹ️  Not used as a cover image')
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`${image ? '✅' : '❌'} Image in Supabase: ${image ? 'YES' : 'NO'}`)
    if (image) {
      console.log(`${profiles && profiles.length > 0 ? '✅' : '❌'} Linked to user profile: ${profiles && profiles.length > 0 ? `YES (${profiles.length} profile(s))` : 'NO'}`)
      console.log(`${albumImages && albumImages.length > 0 ? '✅' : '❌'} In album_images: ${albumImages && albumImages.length > 0 ? `YES (${albumImages.length} entry/entries)` : 'NO'}`)
      console.log(`${coverProfiles && coverProfiles.length > 0 ? '✅' : 'ℹ️ '} Used as cover image: ${coverProfiles && coverProfiles.length > 0 ? `YES (${coverProfiles.length} profile(s))` : 'NO'}`)
      
      // Check metadata for user info
      if (image.metadata && typeof image.metadata === 'object' && (image.metadata as any).entity_id) {
        const userId = (image.metadata as any).entity_id
        const { data: user } = await supabase
          .from('users')
          .select('id, name, permalink, email')
          .eq('id', userId)
          .single()
        
        if (user) {
          console.log(`\n📌 Image metadata indicates it belongs to:`)
          console.log(`   User: ${user.name || 'Unknown'}`)
          console.log(`   ID: ${user.id}`)
          console.log(`   Permalink: ${user.permalink || 'N/A'}`)
          console.log(`   Email: ${user.email || 'N/A'}`)
        }
      }
    }
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

// Get image URL from command line
const imageUrl = process.argv[2]

if (!imageUrl) {
  console.error('❌ Please provide an image URL')
  console.log('\nUsage: npx tsx scripts/check-image-url.ts <image-url>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/check-image-url.ts "https://res.cloudinary.com/dj8yugwyp/image/upload/v1765837339/authorsinfo/avatar/vc8x5qtnfmcyzgkwi5va.webp"')
  process.exit(1)
}

checkImageUrl(imageUrl)
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

