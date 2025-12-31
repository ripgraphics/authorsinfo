import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ISBNdbDataCollector } from '@/lib/isbndb-data-collector'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const subject = searchParams.get('subject')
    const page = searchParams.get('page') || '1'
    const pageSize = searchParams.get('pageSize') || '20'
    const searchType = searchParams.get('searchType') || 'subject' // 'recent', 'year', or 'subject' - default to 'subject'
    const withPrices = searchParams.get('withPrices') === 'true'

    const isbndbApiKey = process.env.ISBNDB_API_KEY
    if (!isbndbApiKey || isbndbApiKey === 'your-isbndb-api-key' || isbndbApiKey.includes('your-')) {
      return NextResponse.json(
        {
          error: 'ISBNdb API key not configured',
          details: 'Please set ISBNDB_API_KEY in your .env.local file with a valid ISBNdb API key',
        },
        { status: 500 }
      )
    }

    const collector = new ISBNdbDataCollector(isbndbApiKey)

    let result: any

    // Handle subject search
    if (searchType === 'subject') {
      if (!subject || subject.trim() === '') {
        return NextResponse.json(
          { error: 'Subject parameter is required for subject search' },
          { status: 400 }
        )
      }

      // Search books by subject with optional year filter
      // Always filter by English language
      result = await collector.searchBooks(subject.trim(), {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        column: 'subjects',
        year: year ? parseInt(year) : undefined,
        language: 'en', // Automatically filter to English only
        withPrices,
      })
    } else {
      // Handle year-based search (existing functionality)
      if (!year) {
        return NextResponse.json(
          { error: 'Year parameter is required for year-based search' },
          { status: 400 }
        )
      }

      result = await collector.fetchBooksByYear(parseInt(year), {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        searchType: searchType as 'recent' | 'year',
        withPrices,
      })
    }

    // CRITICAL: Filter out books that already exist in Supabase BEFORE returning
    // This prevents wasting API quota on books we already have
    // Extract all ISBNs from search results
    const allIsbns: string[] = []
    result.books.forEach((book: any) => {
      if (book.isbn13) allIsbns.push(book.isbn13.replace(/[-\s]/g, ''))
      if (book.isbn) {
        const normalized = book.isbn.replace(/[-\s]/g, '')
        allIsbns.push(normalized)
      }
    })

    // Check which ISBNs already exist in Supabase (single query)
    const existingIsbns = new Set<string>()
    if (allIsbns.length > 0) {
      try {
        const { data: existingBooks, error: checkError } = await supabase
          .from('books')
          .select('isbn10, isbn13')

        if (!checkError && existingBooks) {
          existingBooks.forEach((book) => {
            if (book.isbn10) {
              const normalized = book.isbn10.replace(/[-\s]/g, '')
              existingIsbns.add(normalized)
            }
            if (book.isbn13) {
              const normalized = book.isbn13.replace(/[-\s]/g, '')
              existingIsbns.add(normalized)
            }
          })
        }
      } catch (checkError) {
        console.error('Error checking existing books:', checkError)
        // Continue even if check fails - better to show all books than fail completely
      }
    }

    // Filter out books that already exist in Supabase
    const newBooks = result.books.filter((book: any) => {
      const isbn10 =
        book.isbn && /^[0-9X]{10}$/.test(book.isbn.replace(/[-\s]/g, ''))
          ? book.isbn.replace(/[-\s]/g, '')
          : null
      const isbn13 =
        book.isbn13 && /^[0-9]{13}$/.test(book.isbn13.replace(/[-\s]/g, ''))
          ? book.isbn13.replace(/[-\s]/g, '')
          : null
      const isbnAsIsbn13 =
        book.isbn && /^[0-9]{13}$/.test(book.isbn.replace(/[-\s]/g, ''))
          ? book.isbn.replace(/[-\s]/g, '')
          : null

      // Return false (filter out) if any ISBN matches an existing one
      return !(
        (isbn10 && existingIsbns.has(isbn10)) ||
        (isbn13 && existingIsbns.has(isbn13)) ||
        (isbnAsIsbn13 && existingIsbns.has(isbnAsIsbn13))
      )
    })

    const filteredCount = result.books.length - newBooks.length
    if (filteredCount > 0) {
      console.log(
        `[fetch-by-year] Filtered out ${filteredCount} books that already exist in Supabase`
      )
    }

    return NextResponse.json({
      total: result.total, // Keep original total for reference
      books: newBooks, // Return only new books
      stats: {
        ...result.stats,
        filteredOut: filteredCount,
        newBooks: newBooks.length,
      },
      searchType,
      subject: subject || undefined,
      year: year || undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      withPrices,
    })
  } catch (error) {
    console.error('Error fetching books from ISBNdb:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    // Check for specific error types
    const isDailyLimit = errorMessage.includes('403') || errorMessage.includes('daily limit')
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429')

    let statusCode = 500
    if (isDailyLimit) {
      statusCode = 403
    } else if (isRateLimit) {
      statusCode = 429
    }

    return NextResponse.json(
      {
        error: isDailyLimit
          ? 'Daily API limit exceeded'
          : isRateLimit
            ? 'Rate limit exceeded'
            : 'Failed to fetch books from ISBNdb',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isbns, withPrices = false } = await request.json()

    if (!Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 })
    }

    const isbndbApiKey = process.env.ISBNDB_API_KEY
    if (!isbndbApiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 })
    }

    const collector = new ISBNdbDataCollector(isbndbApiKey)

    // Use bulk fetching instead of individual requests for better performance
    // This batches up to 100 books per request instead of 200 individual requests
    const detailedBooks = await collector.fetchBulkBookDetails(isbns, withPrices)

    const validBooks = detailedBooks.filter((book) => book !== null)

    // Store books in database with comprehensive data collection
    const storedBooks = await Promise.all(
      validBooks.map(async (book: any) => {
        try {
          return await collector.storeBookWithCompleteData(book)
        } catch (error) {
          console.error(`Error storing book ${book.isbn}:`, error)
          return null
        }
      })
    )

    const successfulStores = storedBooks.filter((b) => b !== null)
    const stats = {
      totalRequested: isbns.length,
      totalFound: validBooks.length,
      totalStored: successfulStores.length,
      successRate: `${((validBooks.length / isbns.length) * 100).toFixed(1)}%`,
      storeSuccessRate: `${((successfulStores.length / validBooks.length) * 100).toFixed(1)}%`,
    }

    return NextResponse.json({
      total: validBooks.length,
      stored: successfulStores.length,
      books: successfulStores,
      stats,
    })
  } catch (error) {
    console.error('Error importing books:', error)
    return NextResponse.json(
      {
        error: 'Failed to import books',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
