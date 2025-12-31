/**
 * Script to fix a user's avatar by finding the most recent avatar image
 * and updating the profile.avatar_image_id
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function fixUserAvatar(userIdentifier: string, imageId?: string) {
  console.log(`\n🔧 Fixing avatar for: ${userIdentifier}\n`)

  // Find user
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    userIdentifier
  )

  const { data: user, error: userError } = await (isUUID
    ? supabase.from('users').select('id, name, permalink').eq('id', userIdentifier).single()
    : supabase.from('users').select('id, name, permalink').eq('permalink', userIdentifier).single())

  if (userError || !user) {
    console.error('❌ User not found:', userError?.message)
    return
  }

  console.log(`✅ User: ${user.name} (${user.id})\n`)

  let targetImageId = imageId

  // If no image ID provided, try to find the most recent avatar
  if (!targetImageId) {
    console.log('🔍 Searching for avatar images...\n')

    // Method 1: Check entity_images for avatar entries
    const { data: entityImages } = await supabase
      .from('entity_images')
      .select('image_id, created_at')
      .eq('entity_id', user.id)
      .eq('entity_type', 'user')
      .eq('album_purpose', 'avatar')
      .order('created_at', { ascending: false })
      .limit(1)

    if (entityImages && entityImages.length > 0) {
      targetImageId = entityImages[0].image_id
      console.log(`✅ Found avatar in entity_images: ${targetImageId}`)
    } else {
      // Method 2: Search images table for user avatars
      const { data: images } = await supabase
        .from('images')
        .select('id, url, created_at, metadata, storage_path')
        .or('storage_path.ilike.%user_avatar%')
        .order('created_at', { ascending: false })
        .limit(20)

      if (images && images.length > 0) {
        // Filter by metadata to find images for this user
        const userImages = images.filter((img) => {
          if (!img.metadata) return false
          const meta = typeof img.metadata === 'string' ? JSON.parse(img.metadata) : img.metadata
          return meta.entity_id === user.id && meta.image_type === 'avatar'
        })

        if (userImages.length > 0) {
          targetImageId = userImages[0].id
          console.log(`✅ Found avatar in images table: ${targetImageId}`)
        } else {
          console.log('⚠️  Found images but none match this user')
          console.log('\nAvailable images:')
          images.forEach((img, idx) => {
            console.log(`  ${idx + 1}. ID: ${img.id}, URL: ${img.url}`)
            if (img.metadata) {
              const meta =
                typeof img.metadata === 'string' ? JSON.parse(img.metadata) : img.metadata
              console.log(`     Entity ID: ${meta.entity_id}, Type: ${meta.image_type}`)
            }
          })
        }
      } else {
        console.log('❌ No avatar images found')
        return
      }
    }
  }

  if (!targetImageId) {
    console.log('\n❌ Could not find an avatar image to use')
    console.log('   Please provide an image ID manually:')
    console.log(`   npx tsx scripts/fix-user-avatar.ts ${userIdentifier} <image-id>`)
    return
  }

  // Verify the image exists
  const { data: image, error: imageError } = await supabase
    .from('images')
    .select('id, url, created_at')
    .eq('id', targetImageId)
    .single()

  if (imageError || !image) {
    console.error(`❌ Image not found: ${targetImageId}`, imageError?.message)
    return
  }

  console.log(`\n✅ Image verified:`)
  console.log(`   ID: ${image.id}`)
  console.log(`   URL: ${image.url}`)
  console.log(`   Created: ${image.created_at}`)

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, avatar_image_id')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    if (profileError.code === 'PGRST116') {
      console.log('\n⚠️  Profile does not exist. Creating profile...')
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          avatar_image_id: targetImageId,
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create profile:', createError.message)
        return
      }
      console.log('✅ Profile created with avatar_image_id')
    } else {
      console.error('❌ Error checking profile:', profileError.message)
      return
    }
  } else {
    console.log(`\n📋 Current profile:`)
    console.log(`   Profile ID: ${profile.id}`)
    console.log(`   Current avatar_image_id: ${profile.avatar_image_id || 'NOT SET'}`)

    if (profile.avatar_image_id === targetImageId) {
      console.log('\n✅ Profile already has the correct avatar_image_id!')
      return
    }

    // Update profile
    console.log(`\n🔄 Updating profile.avatar_image_id to ${targetImageId}...`)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_image_id: targetImageId })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Failed to update profile:', updateError.message)
      return
    }

    console.log('✅ Profile updated successfully!')
  }

  // Ensure there's an entity_images entry
  console.log('\n📁 Checking entity_images entry...')
  const { data: existingEntry } = await supabase
    .from('entity_images')
    .select('id')
    .eq('entity_id', user.id)
    .eq('entity_type', 'user')
    .eq('album_purpose', 'avatar')
    .eq('image_id', targetImageId)
    .single()

  if (!existingEntry) {
    console.log('   Creating entity_images entry...')
    const { error: entityError } = await supabase.from('entity_images').insert({
      entity_id: user.id,
      entity_type: 'user',
      album_purpose: 'avatar',
      image_id: targetImageId,
      is_cover: true,
      is_featured: true,
    })

    if (entityError) {
      console.warn('⚠️  Failed to create entity_images entry:', entityError.message)
    } else {
      console.log('✅ Entity_images entry created')
    }
  } else {
    console.log('✅ Entity_images entry already exists')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ FIX COMPLETE')
  console.log('='.repeat(60))
  console.log(`User: ${user.name}`)
  console.log(`Avatar Image ID: ${targetImageId}`)
  console.log(`Avatar URL: ${image.url}`)
  console.log('='.repeat(60))
}

const userIdentifier = process.argv[2]
const imageId = process.argv[3]

if (!userIdentifier) {
  console.error('❌ Please provide a user permalink or ID')
  console.log('\nUsage: npx tsx scripts/fix-user-avatar.ts <user-permalink-or-id> [image-id]')
  console.log('\nExample:')
  console.log('  npx tsx scripts/fix-user-avatar.ts grace.garcia')
  console.log('  npx tsx scripts/fix-user-avatar.ts grace.garcia <image-id>')
  process.exit(1)
}

fixUserAvatar(userIdentifier, imageId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
