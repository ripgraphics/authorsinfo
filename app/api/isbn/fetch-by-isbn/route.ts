import { NextResponse } from 'next/server';
import { ISBNdbDataCollector } from '@/lib/isbndb-data-collector';

export async function POST(request: Request) {
  const { isbns, withPrices = false } = await request.json();
  if (!Array.isArray(isbns) || isbns.length === 0) {
    return NextResponse.json({ error: 'No ISBNs provided' }, { status: 400 });
  }

  const apiKey = process.env.ISBNDB_API_KEY;
  if (!apiKey) {
    console.error('ISBNdb API key is not defined.');
    return NextResponse.json({ error: 'API key is not defined' }, { status: 500 });
  }

  const collector = new ISBNdbDataCollector(apiKey);
  const results: any[] = [];
  const stats = {
    totalProcessed: 0,
    totalFound: 0,
    totalNotFound: 0,
    dataFieldsCollected: new Set<string>(),
    missingFields: new Set<string>(),
    errors: [] as string[],
  };

  for (const isbn of isbns) {
    try {
      stats.totalProcessed++;
      
      // Fetch detailed book information with ALL available data
      const bookData = await collector.fetchBookDetails(isbn, withPrices);
      
      if (bookData) {
        results.push(bookData);
        stats.totalFound++;
        
        // Track data fields collected
        Object.keys(bookData).forEach(field => stats.dataFieldsCollected.add(field));
      } else {
        stats.totalNotFound++;
      }
    } catch (err) {
      const errorMsg = `Failed request for ISBN ${isbn}: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
    }
  }

  // Convert Sets to arrays for JSON serialization
  const responseStats = {
    ...stats,
    dataFieldsCollected: Array.from(stats.dataFieldsCollected),
    missingFields: Array.from(stats.missingFields),
  };

  return NextResponse.json({ 
    books: results,
    stats: responseStats,
    summary: {
      totalRequested: isbns.length,
      totalFound: stats.totalFound,
      totalNotFound: stats.totalNotFound,
      successRate: `${((stats.totalFound / isbns.length) * 100).toFixed(1)}%`,
      dataFieldsCollected: stats.dataFieldsCollected.size,
    }
  });
} 