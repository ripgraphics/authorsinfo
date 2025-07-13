import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

interface BookFilter {
  title?: string
  author?: string
  publisher?: string
  isbn?: string
  language?: string
  publishedYear?: string
  format?: string
  binding?: string
  minRating?: number
  maxRating?: number
  status?: string
  featured?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const offset = (page - 1) * pageSize
    
    // Sorting
    const sortField = searchParams.get('sort') || 'created_at'
    const sortDirection = searchParams.get('direction') || 'desc'
    
    // Filters
    const filters: BookFilter = {
      title: searchParams.get('title') || undefined,
      author: searchParams.get('author') || undefined,
      publisher: searchParams.get('publisher') || undefined,
      isbn: searchParams.get('isbn') || undefined,
      language: searchParams.get('language') || undefined,
      publishedYear: searchParams.get('publishedYear') || undefined,
      format: searchParams.get('format') || undefined,
      binding: searchParams.get('binding') || undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      maxRating: searchParams.get('maxRating') ? Number(searchParams.get('maxRating')) : undefined,
      status: searchParams.get('status') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : searchParams.get('featured') === 'false' ? false : undefined
    }

    // Build query
    let query = supabaseAdmin
      .from('books')
      .select(`
        *,
        author:authors!books_author_id_fkey(id, name, author_image:images!authors_author_image_id_fkey(url, alt_text)),
        publisher:publishers!books_publisher_id_fkey(id, name, publisher_image:images!publishers_publisher_image_id_fkey(url, alt_text)),
        binding_type:binding_types!books_binding_type_id_fkey(id, name),
        format_type:format_types!books_format_type_id_fkey(id, name),
        status:statuses!books_status_id_fkey(id, name),
        cover_image:images!books_cover_image_id_fkey(url, alt_text)
      `, { count: 'exact' })

    // Apply filters
    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`)
    }
    
    if (filters.author) {
      query = query.ilike('author.name', `%${filters.author}%`)
    }
    
    if (filters.publisher) {
      query = query.ilike('publisher.name', `%${filters.publisher}%`)
    }
    
    if (filters.isbn) {
      query = query.or(`isbn10.ilike.%${filters.isbn}%,isbn13.ilike.%${filters.isbn}%`)
    }
    
    if (filters.language) {
      query = query.eq('language', filters.language)
    }
    
    if (filters.publishedYear) {
      query = query.eq('publication_date', `${filters.publishedYear}-01-01`)
    }
    
    if (filters.format) {
      query = query.eq('format_type.name', filters.format)
    }
    
    if (filters.binding) {
      query = query.eq('binding_type.name', filters.binding)
    }
    
    if (filters.minRating !== undefined) {
      query = query.gte('average_rating', filters.minRating)
    }
    
    if (filters.maxRating !== undefined) {
      query = query.lte('average_rating', filters.maxRating)
    }
    
    if (filters.status) {
      query = query.eq('status.name', filters.status)
    }
    
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    // Apply sorting and pagination
    query = query
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(offset, offset + pageSize - 1)

    const { data: books, error, count } = await query

    if (error) {
      console.error('Error fetching books:', error)
      return NextResponse.json(
        { error: 'Failed to fetch books', details: error.message },
        { status: 500 }
      )
    }

    // Process books to include cover image URL
    const processedBooks = (books || []).map(book => ({
      ...book,
      cover_image_url: book.cover_image?.url || null
    }))

    return NextResponse.json({
      books: processedBooks,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })

  } catch (error) {
    console.error('Error in GET /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      featured: body.featured || false,
      synopsis: body.synopsis,
      overview: body.overview,
      dimensions: body.dimensions,
      weight: body.weight,
      list_price: body.list_price,
      cover_image_url: body.cover_image_url,
      original_image_url: body.original_image_url,
      author_id: body.author_id,
      publisher_id: body.publisher_id,
      binding_type_id: body.binding_type_id,
      format_type_id: body.format_type_id,
      status_id: body.status_id
    }

    // Remove undefined values
    Object.keys(bookData).forEach(key => {
      if (bookData[key as keyof typeof bookData] === undefined) {
        delete bookData[key as keyof typeof bookData]
      }
    })

    // Insert book
    const { data: book, error } = await supabaseAdmin
      .from('books')
      .insert(bookData)
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
      console.error('Error creating book:', error)
      return NextResponse.json(
        { error: 'Failed to create book', details: error.message },
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
      message: 'Book created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 