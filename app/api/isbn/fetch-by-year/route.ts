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
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '20';
    const searchType = searchParams.get('searchType') || 'recent'; // 'recent' or 'year'
    const withPrices = searchParams.get('withPrices') === 'true';

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    const isbndbApiKey = process.env.ISBNDB_API_KEY;
    if (!isbndbApiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    const collector = new ISBNdbDataCollector(isbndbApiKey);
    
    // Use the enhanced data collector
    const result = await collector.fetchBooksByYear(parseInt(year), {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      searchType: searchType as 'recent' | 'year',
      withPrices,
    });

    return NextResponse.json({
      total: result.total,
      books: result.books,
      stats: result.stats,
      searchType,
      year,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      withPrices,
    });

  } catch (error) {
    console.error('Error fetching books from ISBNdb:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books from ISBNdb', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
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

    // Fetch detailed information for each ISBN with comprehensive data collection
    const detailedBooks = await Promise.all(
      isbns.map(async (isbn: string) => {
        try {
          const bookData = await collector.fetchBookDetails(isbn, withPrices);
          return bookData;
        } catch (error) {
          console.warn(`Error fetching book ${isbn}:`, error);
          return null;
        }
      })
    );

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