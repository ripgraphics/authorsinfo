import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ISBNdbDataCollector } from '@/lib/isbndb-data-collector';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subject = searchParams.get('subject');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '20';
    const searchType = searchParams.get('searchType') || 'subject'; // 'recent', 'year', or 'subject' - default to 'subject'
    const withPrices = searchParams.get('withPrices') === 'true';

    const isbndbApiKey = process.env.ISBNDB_API_KEY;
    if (!isbndbApiKey || isbndbApiKey === 'your-isbndb-api-key' || isbndbApiKey.includes('your-')) {
      return NextResponse.json({ 
        error: 'ISBNdb API key not configured',
        details: 'Please set ISBNDB_API_KEY in your .env.local file with a valid ISBNdb API key'
      }, { status: 500 });
    }

    const collector = new ISBNdbDataCollector(isbndbApiKey);
    
    let result: any;

    // Handle subject search
    if (searchType === 'subject') {
      if (!subject || subject.trim() === '') {
        return NextResponse.json({ error: 'Subject parameter is required for subject search' }, { status: 400 });
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
      });
    } else {
      // Handle year-based search (existing functionality)
      if (!year) {
        return NextResponse.json({ error: 'Year parameter is required for year-based search' }, { status: 400 });
      }

      result = await collector.fetchBooksByYear(parseInt(year), {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        searchType: searchType as 'recent' | 'year',
        withPrices,
      });
    }

    return NextResponse.json({
      total: result.total,
      books: result.books,
      stats: result.stats,
      searchType,
      subject: subject || undefined,
      year: year || undefined,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      withPrices,
    });

  } catch (error) {
    console.error('Error fetching books from ISBNdb:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Check if it's a rate limit error (429)
    const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
    const statusCode = isRateLimit ? 429 : 500;
    
    return NextResponse.json(
      { 
        error: isRateLimit ? 'Rate limit exceeded' : 'Failed to fetch books from ISBNdb', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isbns, withPrices = false } = await request.json();

    if (!Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 });
    }

    const isbndbApiKey = process.env.ISBNDB_API_KEY;
    if (!isbndbApiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    const collector = new ISBNdbDataCollector(isbndbApiKey);

    // Use bulk fetching instead of individual requests for better performance
    // This batches up to 100 books per request instead of 200 individual requests
    const detailedBooks = await collector.fetchBulkBookDetails(isbns, withPrices);

    const validBooks = detailedBooks.filter(book => book !== null);

    // Store books in database with comprehensive data collection
    const storedBooks = await Promise.all(
      validBooks.map(async (book: any) => {
        try {
          return await collector.storeBookWithCompleteData(book);
        } catch (error) {
          console.error(`Error storing book ${book.isbn}:`, error);
          return null;
        }
      })
    );

    const successfulStores = storedBooks.filter(b => b !== null);
    const stats = {
      totalRequested: isbns.length,
      totalFound: validBooks.length,
      totalStored: successfulStores.length,
      successRate: `${((validBooks.length / isbns.length) * 100).toFixed(1)}%`,
      storeSuccessRate: `${((successfulStores.length / validBooks.length) * 100).toFixed(1)}%`,
    };

    return NextResponse.json({
      total: validBooks.length,
      stored: successfulStores.length,
      books: successfulStores,
      stats,
    });

  } catch (error) {
    console.error('Error importing books:', error);
    return NextResponse.json(
      { error: 'Failed to import books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 