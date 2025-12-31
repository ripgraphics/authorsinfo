import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { bookId, cloudinaryPublicId } = await request.json()

    if (!bookId || !cloudinaryPublicId) {
      return NextResponse.json(
        { error: 'Book ID and Cloudinary public ID are required' },
        { status: 400 }
      )
    }

    console.log(`Linking Cloudinary image ${cloudinaryPublicId} to book ${bookId}`)

    // First, check if the book exists
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, title')
      .eq('id', bookId)
      .single()

    if (bookError || !book) {
      console.error('Book not found:', bookError)
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check if an image record already exists for this Cloudinary public ID
    const { data: existingImages, error: imageError } = await supabaseAdmin
      .from('images')
      .select('id, url, metadata')
      .or(
        `metadata->>'cloudinary_public_id'.eq.${cloudinaryPublicId},url.ilike.%${cloudinaryPublicId}%`
      )
      .limit(1)

    let imageId: string

    if (existingImages && existingImages.length > 0) {
      console.log(`Using existing image record: ${existingImages[0].id}`)
      imageId = existingImages[0].id
    } else {
      // Create a new image record
      const { data: newImage, error: createError } = await supabaseAdmin
        .from('images')
        .insert({
          url: `https://res.cloudinary.com/demo/image/upload/${cloudinaryPublicId}`,
          alt_text: `Cover image for ${book.title}`,
          metadata: {
            cloudinary_public_id: cloudinaryPublicId,
            entity_type: 'book',
            entity_id: bookId,
          },
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating image record:', createError)
        return NextResponse.json({ error: 'Failed to create image record' }, { status: 500 })
      }

      imageId = newImage.id
      console.log(`Created new image record: ${imageId}`)
    }

    // Update the book with the image ID and URL
    const { data: updatedBook, error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        cover_image_id: imageId,
        original_image_url: `https://res.cloudinary.com/demo/image/upload/${cloudinaryPublicId}`,
      })
      .eq('id', bookId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating book:', updateError)
      return NextResponse.json({ error: 'Failed to update book' }, { status: 500 })
    }

    console.log('Book updated successfully:', updatedBook)

    return NextResponse.json({
      success: true,
      book: updatedBook,
      imageId: imageId,
    })
  } catch (error) {
    console.error('Error in link-cover-image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

