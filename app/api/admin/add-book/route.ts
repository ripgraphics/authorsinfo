import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

interface AddBookRequest {
  title: string
  description: string
  cover_image_url: string
  author_names: string[]
  publisher_name: string
  page_count: number
  published_date: string
  isbn: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AddBookRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.author_names || body.author_names.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one author are required' },
        { status: 400 }
      )
    }

    // First, handle authors
    const authorIds: string[] = []
    
    for (const authorName of body.author_names) {
      // Check if author already exists
      const { data: existingAuthor, error: authorCheckError } = await supabaseAdmin
        .from('authors')
        .select('id')
        .eq('name', authorName.trim())
        .single()

      if (authorCheckError && authorCheckError.code !== 'PGRST116') {
        console.error('Error checking existing author:', authorCheckError)
        return NextResponse.json(
          { error: 'Failed to check existing author' },
          { status: 500 }
        )
      }

      let authorId: string

      if (existingAuthor) {
        // Author exists, use existing ID
        authorId = existingAuthor.id
      } else {
        // Create new author
        const { data: newAuthor, error: createAuthorError } = await supabaseAdmin
          .from('authors')
          .insert({
            name: authorName.trim(),
            bio: null,
            photo_url: null,
            author_image: null,
            cover_image_id: null
          })
          .select('id')
          .single()

        if (createAuthorError) {
          console.error('Error creating author:', createAuthorError)
          return NextResponse.json(
            { error: 'Failed to create author' },
            { status: 500 }
          )
        }

        authorId = newAuthor.id
      }

      authorIds.push(authorId)
    }

    // Handle publisher
    let publisherId: string | null = null
    
    if (body.publisher_name) {
      // Check if publisher already exists
      const { data: existingPublisher, error: publisherCheckError } = await supabaseAdmin
        .from('publishers')
        .select('id')
        .eq('name', body.publisher_name.trim())
        .single()

      if (publisherCheckError && publisherCheckError.code !== 'PGRST116') {
        console.error('Error checking existing publisher:', publisherCheckError)
        return NextResponse.json(
          { error: 'Failed to check existing publisher' },
          { status: 500 }
        )
      }

      if (existingPublisher) {
        // Publisher exists, use existing ID
        publisherId = existingPublisher.id
      } else {
        // Create new publisher
        const { data: newPublisher, error: createPublisherError } = await supabaseAdmin
          .from('publishers')
          .insert({
            name: body.publisher_name.trim(),
            description: null,
            logo_url: null,
            website: null,
            founded_year: null
          })
          .select('id')
          .single()

        if (createPublisherError) {
          console.error('Error creating publisher:', createPublisherError)
          return NextResponse.json(
            { error: 'Failed to create publisher' },
            { status: 500 }
          )
        }

        publisherId = newPublisher.id
      }
    }

    // Create the book
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .insert({
        title: body.title,
        description: body.description || null,
        cover_image_url: body.cover_image_url || null,
        author_id: authorIds[0], // Use first author as primary
        publisher_id: publisherId,
        page_count: body.page_count || null,
        published_date: body.published_date ? new Date(body.published_date).toISOString() : null,
        isbn: body.isbn || null,
        price: null,
        list_price: null,
        average_rating: null,
        rating_count: 0,
        series_name: null,
        series_number: null,
        language: 'en',
        binding_type_id: null,
        format_type_id: null
      })
      .select('id')
      .single()

    if (bookError) {
      console.error('Error creating book:', bookError)
      return NextResponse.json(
        { error: 'Failed to create book' },
        { status: 500 }
      )
    }

    // If there are multiple authors, create book_authors relationships
    if (authorIds.length > 1) {
      const bookAuthorRelations = authorIds.slice(1).map(authorId => ({
        book_id: book.id,
        author_id: authorId
      }))

      const { error: bookAuthorsError } = await supabaseAdmin
        .from('book_authors')
        .insert(bookAuthorRelations)

      if (bookAuthorsError) {
        console.error('Error creating book-author relationships:', bookAuthorsError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      bookId: book.id,
      message: 'Book added successfully'
    })

  } catch (error) {
    console.error('Error in add-book API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 