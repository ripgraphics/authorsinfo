/**
 * Script to find orphaned avatar images for a user
 * (images uploaded but not linked to profile)
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
    persistSession: false
  }
})

async function findOrphanedAvatar(userIdentifier: string) {
  console.log(`\n🔍 Finding orphaned avatars for: ${userIdentifier}\n`)
  
  // Find user
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)
  
  const { data: user } = await (isUUID 
    ? supabase.from('users').select('id, name, permalink').eq('id', userIdentifier).single()
    : supabase.from('users').select('id, name, permalink').eq('permalink', userIdentifier).single())
  
  if (!user) {
    console.error('❌ User not found')
    return
  }
  
  console.log(`✅ User: ${user.name} (${user.id})\n`)
  
  // Check entity_images for avatar entries
  const { data: entityImages } = await supabase
    .from('entity_images')
    .select('image_id, created_at, is_cover, is_featured')
    .eq('entity_id', user.id)
    .eq('entity_type', 'user')
    .eq('album_purpose', 'avatar')
    .order('created_at', { ascending: false })
  
  if (entityImages && entityImages.length > 0) {
    console.log(`📁 Found ${entityImages.length} avatar entry/entries in entity_images:\n`)
    
    for (const entry of entityImages) {
      const { data: image } = await supabase
        .from('images')
        .select('id, url, created_at, metadata')
        .eq('id', entry.image_id)
        .single()
      
      if (image) {
        console.log(`   Image ID: ${image.id}`)
        console.log(`   URL: ${image.url}`)
        console.log(`   Created: ${image.created_at}`)
        console.log(`   Is Cover: ${entry.is_cover}`)
        console.log(`   Is Featured: ${entry.is_featured}`)
        if (image.metadata) {
          console.log(`   Metadata:`, JSON.stringify(image.metadata, null, 2))
        }
        console.log('')
      }
    }
    
    // Check if profile has avatar_image_id set
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_image_id')
      .eq('user_id', user.id)
      .single()
    
    if (profile) {
      if (profile.avatar_image_id) {
        console.log(`✅ Profile has avatar_image_id: ${profile.avatar_image_id}`)
        const latestImage = entityImages[0]
        if (profile.avatar_image_id !== latestImage.image_id) {
          console.log(`⚠️  Profile avatar_image_id (${profile.avatar_image_id}) doesn't match latest album entry (${latestImage.image_id})`)
        }
      } else {
        console.log(`❌ Profile does NOT have avatar_image_id set`)
        console.log(`\n💡 Solution: Update profile with latest avatar image ID`)
        console.log(`   Latest avatar image ID: ${entityImages[0].image_id}`)
      }
    }
  } else {
    console.log('❌ No avatar entries found in entity_images table')
    
    // Check for recent images that might be avatars
    console.log('\n🔍 Checking for recent images that might be avatars...')
    const { data: recentImages } = await supabase
      .from('images')
      .select('id, url, created_at, metadata, storage_path')
      .or('storage_path.ilike.%user_avatar%,metadata->entity_type.eq.user')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (recentImages && recentImages.length > 0) {
      console.log(`\n📸 Found ${recentImages.length} recent images that might be avatars:\n`)
      recentImages.forEach((img, idx) => {
        console.log(`${idx + 1}. Image ID: ${img.id}`)
        console.log(`   URL: ${img.url}`)
        console.log(`   Created: ${img.created_at}`)
        console.log(`   Storage Path: ${img.storage_path || 'N/A'}`)
        if (img.metadata) {
          const meta = typeof img.metadata === 'string' ? JSON.parse(img.metadata) : img.metadata
          if (meta.entity_id === user.id) {
            console.log(`   ⭐ This image belongs to this user!`)
          }
        }
        console.log('')
      })
    }
  }
}

const userIdentifier = process.argv[2] || 'grace.garcia'
findOrphanedAvatar(userIdentifier)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })

