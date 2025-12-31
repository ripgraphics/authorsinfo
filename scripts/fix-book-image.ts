import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const bookId = '383abdce-1194-4398-afce-2cb211e3d4a1'
const bookCoverEntityTypeId = '9d91008f-4f24-4501-b18a-922e2cfd6d34'

async function fixBookImage() {
  console.log(`\n🔍 Checking book: ${bookId}\n`)

  // Get book data
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select(
      `
      id,
      title,
      isbn13,
      cover_image_id,
      original_image_url,
      image,
      image_original,
      cover_image:images!cover_image_id(id, url, alt_text, metadata)
    `
    )
    .eq('id', bookId)
    .single()

  if (bookError) {
    console.error('❌ Error fetching book:', bookError)
    return
  }

  console.log('📖 Book:', {
    title: book.title,
    isbn13: book.isbn13,
    cover_image_id: book.cover_image_id,
    original_image_url: book.original_image_url,
    image: book.image,
    image_original: book.image_original,
  })

  // Check cover_image relation
  // Handle both array and single object responses
  const coverImage = Array.isArray(book.cover_image) ? book.cover_image[0] : book.cover_image
  if (coverImage) {
    console.log('✅ Cover image relation exists:', {
      id: coverImage.id,
      url: coverImage.url,
      alt_text: coverImage.alt_text,
    })
  } else {
    console.log('❌ No cover_image relation found')
  }

  // Check if we need to fix
  const imageUrl = book.image_original || book.image
  if (!imageUrl) {
    console.log('❌ No image URL found in book record')
    return
  }

  if (!book.cover_image_id || !coverImage) {
    console.log('\n🔧 Fixing image...\n')

    try {
      // Upload to Cloudinary
      console.log('📤 Uploading to Cloudinary...')
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'authorsinfo/bookcovers',
        transformation: [{ height: 900, crop: 'fit', format: 'webp' }],
      })

      console.log('✅ Uploaded to Cloudinary:', uploadResult.secure_url)

      let imageId: number | null = null

      if (book.cover_image_id) {
        // Update existing image record
        console.log('🔄 Updating existing image record...')
        const { data: updatedImage, error: updateError } = await supabase
          .from('images')
          .update({
            url: uploadResult.secure_url,
            alt_text: book.title || 'Book cover',
            metadata: {
              cloudinary_public_id: uploadResult.public_id,
              entity_type: 'book',
              entity_id: bookId,
            },
          })
          .eq('id', book.cover_image_id)
          .select('id')
          .single()

        if (updateError) {
          console.log('⚠️ Update failed, creating new record...')
          const { data: newImage, error: createError } = await supabase
            .from('images')
            .insert({
              url: uploadResult.secure_url,
              alt_text: book.title || 'Book cover',
              entity_type_id: bookCoverEntityTypeId,
              metadata: {
                cloudinary_public_id: uploadResult.public_id,
                entity_type: 'book',
                entity_id: bookId,
              },
            })
            .select('id')
            .single()

          if (createError) {
            console.error('❌ Failed to create image record:', createError)
            return
          }

          imageId = newImage.id
        } else {
          imageId = updatedImage.id
        }
      } else {
        // Create new image record
        console.log('➕ Creating new image record...')
        const { data: newImage, error: createError } = await supabase
          .from('images')
          .insert({
            url: uploadResult.secure_url,
            alt_text: book.title || 'Book cover',
            entity_type_id: bookCoverEntityTypeId,
            metadata: {
              cloudinary_public_id: uploadResult.public_id,
              entity_type: 'book',
              entity_id: bookId,
            },
          })
          .select('id')
          .single()

        if (createError) {
          console.error('❌ Failed to create image record:', createError)
          return
        }

        imageId = newImage.id
      }

      // Update book with cover_image_id
      console.log('🔗 Linking image to book...')
      const { error: updateBookError } = await supabase
        .from('books')
        .update({
          cover_image_id: imageId,
          original_image_url: uploadResult.secure_url,
        })
        .eq('id', bookId)

      if (updateBookError) {
        console.error('❌ Failed to update book:', updateBookError)
        return
      }

      console.log('\n✅ SUCCESS! Image fixed and linked to book')
      console.log(`   Image ID: ${imageId}`)
      console.log(`   Cloudinary URL: ${uploadResult.secure_url}\n`)
    } catch (error) {
      console.error('❌ Error fixing image:', error)
    }
  } else {
    console.log('\n✅ Book already has cover image linked')

    // Verify Cloudinary
    if (coverImage?.url && coverImage.url.includes('cloudinary.com')) {
      const publicId =
        coverImage.metadata?.cloudinary_public_id ||
        coverImage.url
          .split('/')
          .slice(-2)
          .join('/')
          .replace(/\.[^/.]+$/, '')

      try {
        const resource = await cloudinary.api.resource(publicId)
        console.log('✅ Cloudinary image verified:', resource.secure_url)
      } catch (error: any) {
        console.log('❌ Cloudinary image not found:', error.message)
        console.log('   Need to re-upload image')
      }
    }
  }
}

fixBookImage().catch(console.error)
