import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const pageSize = searchParams.get('pageSize') || '20'
    const page = searchParams.get('page') || '1'
    const sortBy = searchParams.get('sortBy') || 'date_published' // 'date_published' or 'newest_added'
    const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc' or 'desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const searchQuery = searchParams.get('searchQuery') || ''

    // Get ISBNdb API key from environment
    const apiKey = process.env.ISBNDB_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'ISBNdb API key not configured',
        },
        { status: 500 }
      )
    }

    let url: string
    let params: URLSearchParams

    if (sortBy === 'newest_added') {
      // For "newest added", we'll search for recent publication years
      // Since ISBNdb doesn't track "date added", we use recent years as proxy
      const currentYear = new Date().getFullYear()
      const searchText = searchQuery || `${currentYear}` // Use search query or default to current year

      // Use the /search/books endpoint for more flexibility
      url = `https://api2.isbndb.com/search/books`
      params = new URLSearchParams({
        text: searchText,
        pageSize,
        page,
      })
    } else {
      // Date range search or year-based search
      if (startDate && endDate) {
        // Use search endpoint for date range
        url = `https://api2.isbndb.com/search/books`
        params = new URLSearchParams({
          text: searchQuery || `${startDate} ${endDate}`,
          pageSize,
          page,
        })
      } else {
        // Original functionality for year-based search using /books/{year}
        url = `https://api2.isbndb.com/books/${year}`
        params = new URLSearchParams({
          pageSize,
          page,
          column: 'date_published',
        })
      }
    }

    const response = await fetch(`${url}?${params}`, {
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Handle different response formats
    let books = []
    if (sortBy === 'newest_added' || (startDate && endDate)) {
      // /search/books returns data in a different format
      books =
        data.data?.map((book: any) => ({
          title: book.title,
          title_long: book.title_long,
          image: book.image,
          image_original: book.image_original,
          authors: book.authors || [],
          date_published: book.date_published,
          publisher: book.publisher,
          pages: book.pages,
          dimensions: book.dimensions,
          edition: book.edition,
          msrp: book.msrp,
          dimensions_structured: book.dimensions_structured,
          isbn10: book.isbn,
          isbn13: book.isbn13,
          synopsis: book.synopsis,
          overview: book.overview,
          language: book.language,
          binding: book.binding,
        })) || []
    } else {
      // /books/{year} returns books directly
      books =
        data.books?.map((book: any) => ({
          title: book.title,
          title_long: book.title_long,
          image: book.image,
          image_original: book.image_original,
          authors: book.authors || [],
          date_published: book.date_published,
          publisher: book.publisher,
          pages: book.pages,
          dimensions: book.dimensions,
          edition: book.edition,
          msrp: book.msrp,
          dimensions_structured: book.dimensions_structured,
          isbn10: book.isbn,
          isbn13: book.isbn13,
          synopsis: book.synopsis,
          overview: book.overview,
          language: book.language,
          binding: book.binding,
        })) || []
    }

    // Filter by date range if specified
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      books = books.filter((book: any) => {
        if (!book.date_published) return false
        const bookDate = new Date(book.date_published)
        return bookDate >= start && bookDate <= end
      })
    }

    // Sort by publication date if requested
    if (sortOrder === 'desc') {
      books.sort((a: any, b: any) => {
        const dateA = new Date(a.date_published || '1900-01-01')
        const dateB = new Date(b.date_published || '1900-01-01')
        return dateB.getTime() - dateA.getTime()
      })
    } else if (sortOrder === 'asc') {
      books.sort((a: any, b: any) => {
        const dateA = new Date(a.date_published || '1900-01-01')
        const dateB = new Date(b.date_published || '1900-01-01')
        return dateA.getTime() - dateB.getTime()
      })
    }

    return NextResponse.json({
      books,
      total: data.total || books.length,
      year: sortBy === 'newest_added' ? 'recent' : year,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy,
      sortOrder,
      startDate,
      endDate,
      searchQuery,
      note:
        sortBy === 'newest_added'
          ? 'Showing recent publications (ISBNdb does not track "date added")'
          : null,
    })
  } catch (error) {
    console.error('Failed to fetch latest books from ISBNdb:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        books: [],
      },
      { status: 500 }
    )
  }
}
