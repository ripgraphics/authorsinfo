/**
 * Script to check if a user's avatar is properly saved in Supabase and Cloudinary
 * Usage: npx tsx scripts/check-user-avatar.ts <user-permalink-or-id>
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

async function checkUserAvatar(userIdentifier: string) {
  console.log(`\n🔍 Checking avatar for user: ${userIdentifier}\n`)
  
  try {
    // Step 1: Find the user by permalink or ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)
    
    let user: any = null
    let userQuery
    
    if (isUUID) {
      // Try UUID first
      userQuery = supabase
        .from('users')
        .select('id, name, email, permalink, created_at')
        .eq('id', userIdentifier)
        .single()
    } else {
      // Try permalink
      userQuery = supabase
        .from('users')
        .select('id, name, email, permalink, created_at')
        .eq('permalink', userIdentifier)
        .single()
    }
    
    const { data: userData, error: userError } = await userQuery
    
    if (userError || !userData) {
      console.error('❌ User not found:', userError?.message || 'No user found')
      return
    }
    
    user = userData
    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Permalink: ${user.permalink}`)
    console.log(`   Email: ${user.email || 'N/A'}`)
    
    // Step 2: Check profile for avatar_image_id
    console.log('\n📋 Checking profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, avatar_image_id, cover_image_id, created_at')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message)
      console.log('   This user may not have a profile record yet.')
      return
    }
    
    console.log('✅ Profile found:')
    console.log(`   Profile ID: ${profile.id}`)
    console.log(`   Avatar Image ID: ${profile.avatar_image_id || '❌ NOT SET'}`)
    console.log(`   Cover Image ID: ${profile.cover_image_id || 'N/A'}`)
    
    if (!profile.avatar_image_id) {
      console.log('\n⚠️  WARNING: No avatar_image_id in profile!')
      console.log('   The avatar upload may have failed to update the profile.')
      return
    }
    
    // Step 3: Check if image exists in images table
    console.log('\n🖼️  Checking image record...')
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('id, url, alt_text, storage_provider, storage_path, created_at, metadata')
      .eq('id', profile.avatar_image_id)
      .single()
    
    if (imageError || !image) {
      console.error('❌ Image record not found:', imageError?.message || 'No image found')
      console.log(`   Looking for image ID: ${profile.avatar_image_id}`)
      return
    }
    
    console.log('✅ Image record found:')
    console.log(`   Image ID: ${image.id}`)
    console.log(`   URL: ${image.url}`)
    console.log(`   Alt Text: ${image.alt_text || 'N/A'}`)
    console.log(`   Storage Provider: ${image.storage_provider || 'N/A'}`)
    console.log(`   Storage Path: ${image.storage_path || 'N/A'}`)
    console.log(`   Created At: ${image.created_at}`)
    if (image.metadata) {
      console.log(`   Metadata:`, JSON.stringify(image.metadata, null, 2))
    }
    
    // Step 4: Verify Cloudinary URL
    console.log('\n☁️  Checking Cloudinary URL...')
    const cloudinaryUrl = image.url
    
    if (!cloudinaryUrl) {
      console.error('❌ No URL in image record!')
      return
    }
    
    if (!cloudinaryUrl.includes('cloudinary.com')) {
      console.warn('⚠️  URL does not appear to be a Cloudinary URL:')
      console.log(`   ${cloudinaryUrl}`)
    } else {
      console.log('✅ Cloudinary URL detected:')
      console.log(`   ${cloudinaryUrl}`)
      
      // Extract public_id from URL
      const urlParts = cloudinaryUrl.split('/')
      const uploadIndex = urlParts.findIndex((part: string) => part === 'upload')
      if (uploadIndex > -1) {
        const pathParts = urlParts.slice(uploadIndex + 1)
        const filename = pathParts[pathParts.length - 1]
        const publicId = filename.split('.')[0]
        console.log(`   Extracted Public ID: ${publicId}`)
      }
      
      // Try to fetch the image to verify it exists
      console.log('\n🌐 Verifying image is accessible...')
      try {
        const response = await fetch(cloudinaryUrl, { method: 'HEAD' })
        if (response.ok) {
          console.log('✅ Image is accessible via HTTP')
          console.log(`   Status: ${response.status}`)
          console.log(`   Content-Type: ${response.headers.get('content-type') || 'N/A'}`)
        } else {
          console.warn(`⚠️  Image returned status: ${response.status}`)
        }
      } catch (fetchError) {
        console.error('❌ Error fetching image:', fetchError instanceof Error ? fetchError.message : 'Unknown error')
      }
    }
    
    // Step 5: Check if there are any album entries for this avatar
    console.log('\n📁 Checking album entries...')
    const { data: albumEntries, error: albumError } = await supabase
      .from('entity_images')
      .select('id, entity_id, entity_type, album_purpose, image_id, is_cover, is_featured, created_at')
      .eq('entity_id', user.id)
      .eq('entity_type', 'user')
      .eq('album_purpose', 'avatar')
      .eq('image_id', profile.avatar_image_id)
    
    if (albumError) {
      console.warn('⚠️  Error checking album entries:', albumError.message)
    } else if (albumEntries && albumEntries.length > 0) {
      console.log(`✅ Found ${albumEntries.length} album entry/entries:`)
      albumEntries.forEach((entry, index) => {
        console.log(`   Entry ${index + 1}:`)
        console.log(`     ID: ${entry.id}`)
        console.log(`     Is Cover: ${entry.is_cover}`)
        console.log(`     Is Featured: ${entry.is_featured}`)
        console.log(`     Created At: ${entry.created_at}`)
      })
    } else {
      console.warn('⚠️  No album entries found for this avatar')
      console.log('   The avatar may not be in the user\'s album.')
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ User: ${user.name} (${user.permalink})`)
    console.log(`${profile.avatar_image_id ? '✅' : '❌'} Profile has avatar_image_id: ${profile.avatar_image_id || 'MISSING'}`)
    console.log(`${image ? '✅' : '❌'} Image record exists: ${image ? image.id : 'MISSING'}`)
    console.log(`${cloudinaryUrl ? '✅' : '❌'} Image URL: ${cloudinaryUrl ? 'SET' : 'MISSING'}`)
    console.log(`${albumEntries && albumEntries.length > 0 ? '✅' : '⚠️ '} Album entries: ${albumEntries?.length || 0}`)
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

// Get user identifier from command line
const userIdentifier = process.argv[2]

if (!userIdentifier) {
  console.error('❌ Please provide a user permalink or ID')
  console.log('\nUsage: npx tsx scripts/check-user-avatar.ts <user-permalink-or-id>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/check-user-avatar.ts grace.garcia')
  console.log('  npx tsx scripts/check-user-avatar.ts 123e4567-e89b-12d3-a456-426614174000')
  process.exit(1)
}

checkUserAvatar(userIdentifier)
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

