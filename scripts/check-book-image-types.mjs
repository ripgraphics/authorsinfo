import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const bookId = '601d5c40-47a7-453b-a1dc-ebe19485a372'

console.log(`\n🔍 Checking all image_type values for book: ${bookId}\n`)

// Query all images for this book
const { data: images, error } = await supabase
  .from('images')
  .select('id, url, alt_text, image_type, entity_id, created_at, metadata')
  .eq('entity_id', bookId)
  .is('deleted_at', null)
  .order('created_at', { ascending: false })

if (error) {
  console.error('Error:', error)
  process.exit(1)
}

console.log(`Found ${images?.length || 0} images with entity_id = ${bookId}:\n`)

if (images && images.length > 0) {
  // Group by image_type
  const grouped = images.reduce((acc, img) => {
    const type = img.image_type || 'NULL'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(img)
    return acc
  }, {})

  Object.keys(grouped).forEach(imageType => {
    console.log(`\n📸 Image Type: ${imageType === 'NULL' ? '(NULL - no image_type set)' : imageType}`)
    console.log(`   Count: ${grouped[imageType].length}`)
    grouped[imageType].forEach((img, idx) => {
      console.log(`   ${idx + 1}. ID: ${img.id}`)
      console.log(`      URL: ${img.url?.substring(0, 80)}...`)
      console.log(`      Alt: ${img.alt_text || 'N/A'}`)
      if (img.metadata?.image_type) {
        console.log(`      Metadata image_type: ${img.metadata.image_type}`)
      }
    })
  })
} else {
  console.log('❌ No images found')
}

console.log('\n✅ Query complete!\n')
