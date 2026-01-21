import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// Disable caching for this route to ensure fresh data from Supabase
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    console.log(`Fetching book: ${bookId}`)

    // Fetch book with related data
    const { data, error } = await supabaseAdmin
      .from('books')
      .select(
        `
        *,
        cover_image:images!cover_image_id(id, url, alt_text),
        binding_type:binding_types(id, name),
        format_type:format_types(id, name)
      `
      )
      .eq('id', bookId)
      .single()

    if (error) {
      console.error('Database error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Prefer the FRONT cover from the book images album system.
    // This ensures the book page header/avatar fallback always uses the front cover,
    // even if books.cover_image_id was previously overwritten.
    try {
      const { data: frontImages, error: frontError } = await supabaseAdmin.rpc('get_book_images', {
        p_book_id: bookId,
        p_image_type: 'book_cover_front',
      } as any)

      const front = Array.isArray(frontImages) ? frontImages[0] : null

      if (!frontError && front && (front as any).image_id && (front as any).image_url) {
        data.cover_image = {
          id: (front as any).image_id,
          url: (front as any).image_url,
          alt_text: (front as any).alt_text,
        } as any

        // Repair legacy state: ensure books.cover_image_id points to the front cover
        if ((data as any).cover_image_id !== (front as any).image_id) {
          const { error: repairError } = await (supabaseAdmin.from('books') as any)
            .update({ cover_image_id: (front as any).image_id })
            .eq('id', bookId)

          if (repairError) {
            console.warn('⚠️ Failed to repair books.cover_image_id to front cover:', repairError)
          }
        }
      }
    } catch (frontCoverError) {
      console.warn('⚠️ Failed to fetch/repair front cover from album system:', frontCoverError)
    }

    // If cover_image is not available from foreign key, try to get it from album
    if (!data.cover_image) {
      console.log('Cover image not found via foreign key, checking album...')

      // Find the "Cover Images" album for this book
      const { data: album } = await supabaseAdmin
        .from('photo_albums')
        .select('id')
        .eq('entity_type', 'book')
        .eq('entity_id', bookId)
        .eq('name', 'Cover Images')
        .maybeSingle()

      if (album) {
        // Get the cover image from the album
        const { data: albumImage } = await supabaseAdmin
          .from('album_images')
          .select(
            `
            image_id,
            images!inner(id, url, alt_text)
          `
          )
          .eq('album_id', album.id)
          .eq('is_cover', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (albumImage && albumImage.images) {
          data.cover_image = albumImage.images as any
          console.log('✅ Found cover image from album:', data.cover_image.url)
        }
      }
    }

    console.log('Book fetched successfully')
    console.log('Book data:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params
    const updateData = await request.json()

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    // Helper function to validate UUID format
    const isValidUuid = (value: string | null | undefined): boolean => {
      if (!value || value === '') return false
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(value)
    }

    // Validate UUID fields before database update
    const uuidFields = ['binding_type_id', 'format_type_id', 'status_id', 'author_id', 'publisher_id', 'cover_image_id']
    for (const field of uuidFields) {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        if (!isValidUuid(updateData[field])) {
          return NextResponse.json(
            { error: `Invalid UUID format for field '${field}': ${updateData[field]}` },
            { status: 400 }
          )
        }
      }
    }

    console.log(`Updating book: ${bookId}`)
    console.log('Update data:', updateData)

    // Perform the update
    const { data, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Update successful:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
