import { NextRequest, NextResponse } from 'next/server';
import { ISBNdbDataCollector } from '@/lib/isbndb-data-collector';

export async function POST(request: NextRequest) {
  try {
    const { 
      isbns, 
      withPrices = false,
      includeStats = true,
      storeInDatabase = false 
    } = await request.json();

    if (!Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 });
    }

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    const collector = new ISBNdbDataCollector(apiKey);
    const startTime = Date.now();
    
    const results: any[] = [];
    const comprehensiveStats = {
      totalRequested: isbns.length,
      totalFound: 0,
      totalNotFound: 0,
      totalStored: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      dataFieldsCollected: new Set<string>(),
      missingFields: new Set<string>(),
      errors: [] as string[],
      processingTime: 0,
      dataQuality: {
        completeRecords: 0,
        partialRecords: 0,
        minimalRecords: 0,
      },
      fieldBreakdown: {} as Record<string, number>,
    };

    // Expected fields from ISBNdb API documentation
    const expectedFields = [
      'title', 'title_long', 'isbn', 'isbn13', 'dewey_decimal', 'binding', 
      'publisher', 'language', 'date_published', 'edition', 'pages', 
      'dimensions', 'dimensions_structured', 'overview', 'image', 'image_original',
      'msrp', 'excerpt', 'synopsis', 'authors', 'subjects', 'reviews', 
      'prices', 'related', 'other_isbns'
    ];

    for (const isbn of isbns) {
      try {
        // Fetch detailed book information with ALL available data
        const bookData = await collector.fetchBookDetails(isbn, withPrices);
        
        if (bookData) {
          results.push(bookData);
          comprehensiveStats.totalFound++;
          
          // Track all data fields collected
          Object.keys(bookData).forEach(field => {
            comprehensiveStats.dataFieldsCollected.add(field);
            comprehensiveStats.fieldBreakdown[field] = (comprehensiveStats.fieldBreakdown[field] || 0) + 1;
          });

          // Analyze data quality
          const presentFields = Object.keys(bookData).filter(key => 
            bookData[key] !== undefined && bookData[key] !== null
          );
          
          if (presentFields.length >= expectedFields.length * 0.8) {
            comprehensiveStats.dataQuality.completeRecords++;
          } else if (presentFields.length >= expectedFields.length * 0.5) {
            comprehensiveStats.dataQuality.partialRecords++;
          } else {
            comprehensiveStats.dataQuality.minimalRecords++;
          }

          // Store in database if requested
          if (storeInDatabase) {
            try {
              const storeResult = await collector.storeBookWithCompleteData(bookData);
              if (storeResult.action === 'created') {
                comprehensiveStats.totalStored++;
              } else if (storeResult.action === 'updated') {
                comprehensiveStats.totalUpdated++;
              }
            } catch (storeError) {
              comprehensiveStats.totalSkipped++;
              comprehensiveStats.errors.push(`Failed to store book ${isbn}: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
            }
          }
        } else {
          comprehensiveStats.totalNotFound++;
        }
      } catch (err) {
        const errorMsg = `Failed request for ISBN ${isbn}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        console.error(errorMsg);
        comprehensiveStats.errors.push(errorMsg);
        comprehensiveStats.totalSkipped++;
      }
    }

    comprehensiveStats.processingTime = Date.now() - startTime;

    // Calculate missing fields
    expectedFields.forEach(field => {
      if (!comprehensiveStats.dataFieldsCollected.has(field)) {
        comprehensiveStats.missingFields.add(field);
      }
    });

    // Convert Sets to arrays for JSON serialization
    const responseStats = {
      ...comprehensiveStats,
      dataFieldsCollected: Array.from(comprehensiveStats.dataFieldsCollected),
      missingFields: Array.from(comprehensiveStats.missingFields),
      successRate: `${((comprehensiveStats.totalFound / isbns.length) * 100).toFixed(1)}%`,
      dataQualityScore: `${((comprehensiveStats.dataQuality.completeRecords / comprehensiveStats.totalFound) * 100).toFixed(1)}%`,
      averageFieldsPerBook: comprehensiveStats.totalFound > 0 ? 
        (comprehensiveStats.dataFieldsCollected.size / comprehensiveStats.totalFound).toFixed(1) : '0',
    };

    const response: {
      books: any[]
      summary: {
        totalRequested: number
        totalFound: number
        totalNotFound: number
        successRate: string
        dataFieldsCollected: number
        processingTime: string
      }
      stats?: any
      databaseStats?: {
        totalStored: number
        totalUpdated: number
        totalSkipped: number
        storeSuccessRate: string
      }
    } = {
      books: results,
      summary: {
        totalRequested: isbns.length,
        totalFound: comprehensiveStats.totalFound,
        totalNotFound: comprehensiveStats.totalNotFound,
        successRate: responseStats.successRate,
        dataFieldsCollected: comprehensiveStats.dataFieldsCollected.size,
        processingTime: `${comprehensiveStats.processingTime}ms`,
      },
    };

    if (includeStats) {
      response.stats = responseStats;
    }

    if (storeInDatabase) {
      response.databaseStats = {
        totalStored: comprehensiveStats.totalStored,
        totalUpdated: comprehensiveStats.totalUpdated,
        totalSkipped: comprehensiveStats.totalSkipped,
        storeSuccessRate: comprehensiveStats.totalFound > 0 ? 
          `${(((comprehensiveStats.totalStored + comprehensiveStats.totalUpdated) / comprehensiveStats.totalFound) * 100).toFixed(1)}%` : '0%',
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in comprehensive data collection:', error);
    return NextResponse.json(
      { error: 'Failed to collect comprehensive data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '20';
    const withPrices = searchParams.get('withPrices') === 'true';
    const includeStats = searchParams.get('includeStats') !== 'false';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    const collector = new ISBNdbDataCollector(apiKey);
    const startTime = Date.now();

    // Search books with comprehensive data collection
    const result = await collector.searchBooks(query, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      withPrices,
    });

    const processingTime = Date.now() - startTime;

    const response: {
      total: number
      books: any[]
      query: string
      page: number
      pageSize: number
      withPrices: boolean
      processingTime: string
      stats?: any
    } = {
      total: result.total,
      books: result.books,
      query,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      withPrices,
      processingTime: `${processingTime}ms`,
    };

    if (includeStats) {
      response.stats = {
        ...result.stats,
        processingTime,
        successRate: `${((result.books.length / result.total) * 100).toFixed(1)}%`,
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in comprehensive search:', error);
    return NextResponse.json(
      { error: 'Failed to search books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 