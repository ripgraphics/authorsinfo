import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: book, error } = await supabaseAdmin
      .from('books')
      .select(`
        *,
        author:authors!books_author_id_fkey(id, name, author_image:images!authors_author_image_id_fkey(url, alt_text)),
        publisher:publishers!books_publisher_id_fkey(id, name),
        binding_type:binding_types!books_binding_type_id_fkey(id, name),
        format_type:format_types!books_format_type_id_fkey(id, name),
        status:statuses!books_status_id_fkey(id, name),
        cover_image:images!books_cover_image_id_fkey(url, alt_text)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching book:', error)
      return NextResponse.json(
        { error: 'Book not found', details: error.message },
        { status: 404 }
      )
    }

    // Process book to include cover image URL
    const processedBook = {
      ...book,
      cover_image_url: book.cover_image?.url || null
    }

    return NextResponse.json({ book: processedBook })

  } catch (error) {
    console.error('Error in GET /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Prepare book data
    const bookData = {
      title: body.title,
      title_long: body.title_long,
      isbn10: body.isbn10,
      isbn13: body.isbn13,
      publication_date: body.publication_date,
      language: body.language,
      pages: body.pages,
      average_rating: body.average_rating,
      review_count: body.review_count,
      featured: body.featured,
      synopsis: body.synopsis,
      overview: body.overview,
      dimensions: body.dimensions,
      weight: body.weight,
      list_price: body.list_price,
      original_image_url: body.original_image_url,
      author_id: body.author_id,
      publisher_id: body.publisher_id,
      binding_type_id: body.binding_type_id,
      format_type_id: body.format_type_id,
      status_id: body.status_id,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(bookData).forEach(key => {
      if (bookData[key as keyof typeof bookData] === undefined) {
        delete bookData[key as keyof typeof bookData]
      }
    })

    // Update book
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .update(bookData)
      .eq('id', id)
      .select(`
        *,
        author:authors!books_author_id_fkey(id, name, author_image:images!authors_author_image_id_fkey(url, alt_text)),
        publisher:publishers!books_publisher_id_fkey(id, name),
        binding_type:binding_types!books_binding_type_id_fkey(id, name),
        format_type:format_types!books_format_type_id_fkey(id, name),
        status:statuses!books_status_id_fkey(id, name),
        cover_image:images!books_cover_image_id_fkey(url, alt_text)
      `)
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json(
        { error: 'Failed to update book', details: error.message },
        { status: 500 }
      )
    }

    // Process book to include cover image URL
    const processedBook = {
      ...book,
      cover_image_url: book.cover_image?.url || null
    }

    return NextResponse.json({
      book: processedBook,
      message: 'Book updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First, get the book to check if it exists and get cover image info
    const { data: existingBook, error: fetchError } = await supabaseAdmin
      .from('books')
      .select('cover_image_id, original_image_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching book for deletion:', fetchError)
      return NextResponse.json(
        { error: 'Book not found', details: fetchError.message },
        { status: 404 }
      )
    }

    // Delete the book
    const { error: deleteError } = await supabaseAdmin
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting book:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete book', details: deleteError.message },
        { status: 500 }
      )
    }

    // TODO: Delete associated images from storage if needed
    // This would require additional logic to delete from Cloudinary or other storage

    return NextResponse.json({
      message: 'Book deleted successfully',
      deletedBookId: id
    })

  } catch (error) {
    console.error('Error in DELETE /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Add only the fields that are provided
    if (body.title !== undefined) updateData.title = body.title
    if (body.title_long !== undefined) updateData.title_long = body.title_long
    if (body.isbn10 !== undefined) updateData.isbn10 = body.isbn10
    if (body.isbn13 !== undefined) updateData.isbn13 = body.isbn13
    if (body.publication_date !== undefined) updateData.publication_date = body.publication_date
    if (body.language !== undefined) updateData.language = body.language
    if (body.pages !== undefined) updateData.pages = body.pages
    if (body.average_rating !== undefined) updateData.average_rating = body.average_rating
    if (body.review_count !== undefined) updateData.review_count = body.review_count
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.synopsis !== undefined) updateData.synopsis = body.synopsis
    if (body.overview !== undefined) updateData.overview = body.overview
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions
    if (body.weight !== undefined) updateData.weight = body.weight
    if (body.list_price !== undefined) updateData.list_price = body.list_price
    if (body.original_image_url !== undefined) updateData.original_image_url = body.original_image_url
    if (body.author_id !== undefined) updateData.author_id = body.author_id
    if (body.publisher_id !== undefined) updateData.publisher_id = body.publisher_id
    if (body.binding_type_id !== undefined) updateData.binding_type_id = body.binding_type_id
    if (body.format_type_id !== undefined) updateData.format_type_id = body.format_type_id
    if (body.status_id !== undefined) updateData.status_id = body.status_id

    // Update book
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:authors!books_author_id_fkey(id, name, author_image:images!authors_author_image_id_fkey(url, alt_text)),
        publisher:publishers!books_publisher_id_fkey(id, name),
        binding_type:binding_types!books_binding_type_id_fkey(id, name),
        format_type:format_types!books_format_type_id_fkey(id, name),
        status:statuses!books_status_id_fkey(id, name),
        cover_image:images!books_cover_image_id_fkey(url, alt_text)
      `)
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json(
        { error: 'Failed to update book', details: error.message },
        { status: 500 }
      )
    }

    // Process book to include cover image URL
    const processedBook = {
      ...book,
      cover_image_url: book.cover_image?.url || null
    }

    return NextResponse.json({
      book: processedBook,
      message: 'Book updated successfully'
    })

  } catch (error) {
    console.error('Error in PATCH /api/admin/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 