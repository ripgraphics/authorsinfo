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

console.log(`\n🔍 Searching IMAGES TABLE directly for all images related to book: ${bookId}\n`)
console.log('Using Supabase as single source of truth - querying images table directly\n')

// Query images table directly - check all columns that might link to books
console.log('📊 Querying images table directly...\n')

// Get book info first
const { data: bookData } = await supabase
  .from('books')
  .select('id, title, cover_image_id')
  .eq('id', bookId)
  .single()

if (bookData) {
  console.log(`Book: ${bookData.title}`)
  console.log(`Book ID: ${bookData.id}`)
  console.log(`Cover Image ID (from books table): ${bookData.cover_image_id}\n`)
}

// Query 1: Images table - check if there's metadata linking to books
console.log('1️⃣ Images with metadata containing this book ID:')
const { data: metadataImages, error: metadataError } = await supabase
  .from('images')
  .select('id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at, deleted_at, metadata')
  .eq('metadata->>entity_id', bookId)
  .eq('metadata->>entity_type', 'book')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })

if (metadataError) {
  console.error('Error:', metadataError.message)
} else {
  console.log(`Found ${metadataImages?.length || 0} images with metadata linking to this book:`)
  if (metadataImages && metadataImages.length > 0) {
    metadataImages.forEach((img, idx) => {
      console.log(`\n  Image ${idx + 1}:`)
      console.log(`    ID: ${img.id}`)
      console.log(`    URL: ${img.url?.substring(0, 80)}...`)
      console.log(`    Alt Text: ${img.alt_text || 'N/A'}`)
      console.log(`    Metadata:`, JSON.stringify(img.metadata, null, 2))
      console.log(`    Created: ${img.created_at}`)
    })
  } else {
    console.log('  ❌ No images found with metadata linking to this book')
  }
}

// Query 2: All images that might be related via foreign keys or other relationships
console.log('\n\n2️⃣ All images in images table (checking all possible relationships):')
const { data: allImages, error: allImagesError } = await supabase
  .from('images')
  .select('id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at, deleted_at, metadata, entity_type_id')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(1000)

if (allImagesError) {
  console.error('Error:', allImagesError.message)
} else {
  // Filter images related to this book
  const relatedImages = allImages?.filter(img => {
    // Check if metadata contains book ID
    if (img.metadata?.entity_id === bookId || img.metadata?.entityId === bookId) return true
    // Check if this is the cover image ID
    if (img.id === bookData?.cover_image_id) return true
    // Check alt_text for book reference
    if (img.alt_text && img.alt_text.toLowerCase().includes(bookData?.title?.toLowerCase().substring(0, 20))) return true
    return false
  }) || []

  console.log(`\nFound ${relatedImages.length} potentially related images:`)
  relatedImages.forEach((img, idx) => {
    console.log(`\n  Image ${idx + 1}:`)
    console.log(`    ID: ${img.id}`)
    console.log(`    URL: ${img.url?.substring(0, 80)}...`)
    console.log(`    Alt Text: ${img.alt_text || 'N/A'}`)
    console.log(`    Metadata:`, img.metadata ? JSON.stringify(img.metadata, null, 2) : 'N/A')
    console.log(`    Entity Type ID: ${img.entity_type_id || 'N/A'}`)
    console.log(`    Created: ${img.created_at}`)
  })
}

// Query 3: Check the specific cover image ID from books table
if (bookData?.cover_image_id) {
  console.log('\n\n3️⃣ Cover Image (via books.cover_image_id):')
  const { data: coverImage, error: coverError } = await supabase
    .from('images')
    .select('id, url, alt_text, thumbnail_url, large_url, medium_url, caption, created_at, deleted_at, metadata')
    .eq('id', bookData.cover_image_id)
    .is('deleted_at', null)
    .single()

  if (coverError) {
    console.error('Error:', coverError.message)
  } else if (coverImage) {
    console.log(`Found cover image in images table:`)
    console.log(`  ID: ${coverImage.id}`)
    console.log(`  URL: ${coverImage.url?.substring(0, 80)}...`)
    console.log(`  Alt Text: ${coverImage.alt_text || 'N/A'}`)
    console.log(`  Metadata:`, coverImage.metadata ? JSON.stringify(coverImage.metadata, null, 2) : 'N/A')
    console.log(`  Created: ${coverImage.created_at}`)
  } else {
    console.log('❌ Cover image not found in images table')
  }
}

console.log('\n✅ Query complete!\n')
