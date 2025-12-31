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
  isbn13?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AddBookRequest = await request.json()

    console.log('=== ADD BOOK API START ===')
    console.log('Received book data:', body)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))

    // Validate required fields
    if (!body.title || !body.author_names || body.author_names.length === 0) {
      console.error('Validation failed:', { title: body.title, author_names: body.author_names })
      return NextResponse.json(
        { error: 'Title and at least one author are required' },
        { status: 400 }
      )
    }

    // First, handle authors
    const authorIds: string[] = []

    for (const authorName of body.author_names) {
      console.log('Processing author:', authorName)

      // Check if author already exists
      const { data: existingAuthor, error: authorCheckError } = await supabaseAdmin
        .from('authors')
        .select('id')
        .eq('name', authorName.trim())
        .single()

      if (authorCheckError && authorCheckError.code !== 'PGRST116') {
        console.error('Error checking existing author:', authorCheckError)
        return NextResponse.json({ error: 'Failed to check existing author' }, { status: 500 })
      }

      let authorId: string

      if (existingAuthor) {
        // Author exists, use existing ID
        authorId = existingAuthor.id
        console.log('Using existing author ID:', authorId)
      } else {
        // Create new author
        console.log('Creating new author:', authorName.trim())
        const { data: newAuthor, error: createAuthorError } = await supabaseAdmin
          .from('authors')
          .insert({
            name: authorName.trim(),
            bio: null,
            author_image_id: null,
            cover_image_id: null,
          })
          .select('id')
          .single()

        if (createAuthorError) {
          console.error('Error creating author:', createAuthorError)
          console.error('Author data attempted:', {
            name: authorName.trim(),
            bio: null,
            author_image_id: null,
            cover_image_id: null,
          })
          return NextResponse.json(
            { error: 'Failed to create author', details: createAuthorError },
            { status: 500 }
          )
        }

        authorId = newAuthor.id
        console.log('Created new author ID:', authorId)
      }

      authorIds.push(authorId)
    }

    // Handle publisher
    let publisherId: string | null = null

    if (body.publisher_name) {
      console.log('Processing publisher:', body.publisher_name)

      // Check if publisher already exists
      const { data: existingPublisher, error: publisherCheckError } = await supabaseAdmin
        .from('publishers')
        .select('id')
        .eq('name', body.publisher_name.trim())
        .single()

      if (publisherCheckError && publisherCheckError.code !== 'PGRST116') {
        console.error('Error checking existing publisher:', publisherCheckError)
        return NextResponse.json({ error: 'Failed to check existing publisher' }, { status: 500 })
      }

      if (existingPublisher) {
        // Publisher exists, use existing ID
        publisherId = existingPublisher.id
        console.log('Using existing publisher ID:', publisherId)
      } else {
        // Create new publisher
        console.log('Creating new publisher:', body.publisher_name.trim())
        const { data: newPublisher, error: createPublisherError } = await supabaseAdmin
          .from('publishers')
          .insert({
            name: body.publisher_name.trim(),
            about: null,
            website: null,
            founded_year: null,
          })
          .select('id')
          .single()

        if (createPublisherError) {
          console.error('Error creating publisher:', createPublisherError)
          console.error('Publisher data attempted:', {
            name: body.publisher_name.trim(),
            about: null,
            website: null,
            founded_year: null,
          })
          return NextResponse.json(
            { error: 'Failed to create publisher', details: createPublisherError },
            { status: 500 }
          )
        }

        publisherId = newPublisher.id
        console.log('Created new publisher ID:', publisherId)
      }
    }

    // Validate and assign ISBNs to correct columns
    const { extractISBNs } = await import('@/utils/isbnUtils')
    const { isbn10, isbn13 } = extractISBNs({
      isbn: body.isbn,
      isbn13: body.isbn13,
    })

    // Create the book with correct field names
    const bookData = {
      title: body.title,
      overview: body.description || null,
      original_image_url: body.cover_image_url || null,
      author_id: authorIds[0], // Use first author as primary
      publisher_id: publisherId,
      pages: body.page_count || null,
      publication_date: body.published_date
        ? new Date(body.published_date).toISOString().split('T')[0]
        : null,
      isbn10: isbn10, // Validated ISBN-10
      isbn13: isbn13, // Validated ISBN-13
      language: 'en',
      binding_type_id: null,
      format_type_id: null,
    }

    console.log('Creating book with data:', bookData)

    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .insert(bookData)
      .select('id')
      .single()

    if (bookError) {
      console.error('Error creating book:', bookError)
      return NextResponse.json(
        { error: 'Failed to create book', details: bookError },
        { status: 500 }
      )
    }

    console.log('Book created successfully with ID:', book.id)

    // If there are multiple authors, create book_authors relationships
    if (authorIds.length > 1) {
      console.log('Creating book-author relationships for additional authors')
      const bookAuthorRelations = authorIds.slice(1).map((authorId) => ({
        book_id: book.id,
        author_id: authorId,
      }))

      const { error: bookAuthorsError } = await supabaseAdmin
        .from('book_authors')
        .insert(bookAuthorRelations)

      if (bookAuthorsError) {
        console.error('Error creating book-author relationships:', bookAuthorsError)
        // Don't fail the request, just log the error
      } else {
        console.log('Book-author relationships created successfully')
      }
    }

    console.log('=== ADD BOOK API SUCCESS ===')
    console.log('Book created with ID:', book.id)
    console.log('Author IDs:', authorIds)
    console.log('Publisher ID:', publisherId)

    return NextResponse.json({
      success: true,
      bookId: book.id,
      message: 'Book added successfully',
    })
  } catch (error) {
    console.error('=== ADD BOOK API ERROR ===')
    console.error('Error in add-book API:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

