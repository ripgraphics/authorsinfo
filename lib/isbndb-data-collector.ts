import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ISBNdbBookData {
  // Core book information
  title: string;
  title_long?: string;
  isbn: string;
  isbn13: string;
  
  // Classification and metadata
  dewey_decimal?: string[];
  binding?: string;
  publisher?: string;
  language?: string;
  date_published?: string;
  edition?: string;
  pages?: number;
  
  // Physical characteristics
  dimensions?: string;
  dimensions_structured?: {
    length?: { unit: string; value: number };
    width?: { unit: string; value: number };
    height?: { unit: string; value: number };
    weight?: { unit: string; value: number };
  };
  
  // Content and description
  overview?: string;
  excerpt?: string;
  synopsis?: string;
  
  // Media and images
  image?: string;
  image_original?: string;
  
  // Pricing and commerce
  msrp?: number;
  
  // Relationships and metadata
  authors?: string[];
  subjects?: string[];
  reviews?: string[];
  prices?: Array<{
    condition?: string;
    merchant?: string;
    merchant_logo?: string;
    merchant_logo_offset?: {
      x?: string;
      y?: string;
    };
    shipping?: string;
    price?: string;
    total?: string;
    link?: string;
  }>;
  related?: {
    type: string;
  };
  other_isbns?: Array<{
    isbn: string;
    binding: string;
  }>;
  
  // Additional fields from API documentation
  // These may not always be present but should be captured when available
  [key: string]: any; // Allow for any additional fields from ISBNdb
}

export interface DataCollectionStats {
  totalProcessed: number;
  totalStored: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: string[];
  processingTime: number;
  dataFieldsCollected: string[];
  missingFields: string[];
}

export class ISBNdbDataCollector {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api2.isbndb.com';
  }

  /**
   * Fetch multiple books in bulk using ISBNdb bulk endpoint
   * This is much more efficient than individual requests
   */
  async fetchBulkBookDetails(isbns: string[], withPrices: boolean = false): Promise<(ISBNdbBookData | null)[]> {
    if (!isbns.length) return [];
    
    const batchSize = 100; // ISBNdb API limit
    const allBooks: (ISBNdbBookData | null)[] = [];
    
    for (let i = 0; i < isbns.length; i += batchSize) {
      const batch = isbns.slice(i, i + batchSize);
      try {
        const params = new URLSearchParams();
        if (withPrices) {
          params.append('with_prices', '1');
        }
        
        const url = `${this.baseUrl}/books${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isbns: batch }),
        });
        
        if (!response.ok) {
          console.warn(`Bulk fetch failed for batch ${i / batchSize + 1}: ${response.status}`);
          // Return null for all books in this batch
          allBooks.push(...batch.map(() => null));
          continue;
        }
        
        const data = await response.json();
        // ISBNdb bulk endpoint returns { data: [books], total, requested }
        const books = data.data || [];
        
        // Create a map of ISBN to book for easy lookup
        const isbnToBook = new Map<string, ISBNdbBookData>();
        books.forEach((book: ISBNdbBookData) => {
          if (book.isbn13) isbnToBook.set(book.isbn13, book);
          if (book.isbn) isbnToBook.set(book.isbn, book);
        });
        
        // Return books in the same order as requested ISBNs
        batch.forEach(isbn => {
          allBooks.push(isbnToBook.get(isbn) || null);
        });
      } catch (error) {
        console.error(`Error in bulk fetch batch ${i / batchSize + 1}:`, error);
        // Return null for all books in this batch
        allBooks.push(...batch.map(() => null));
      }
      
      // Rate limiting: wait 1.1 seconds between batches
      if (i + batchSize < isbns.length) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    
    return allBooks;
  }

  /**
   * Fetch detailed book information from ISBNdb with ALL available data
   */
  async fetchBookDetails(isbn: string, withPrices: boolean = false): Promise<ISBNdbBookData | null> {
    try {
      const params = new URLSearchParams();
      if (withPrices) {
        params.append('with_prices', '1');
      }

      const url = `${this.baseUrl}/book/${isbn}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch book ${isbn}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const bookData = data.book || null;
      
      if (bookData) {
        // Log what fields we're collecting for debugging
        console.log(`Collected fields for ISBN ${isbn}:`, Object.keys(bookData));
      }
      
      return bookData;
    } catch (error) {
      console.error(`Error fetching book ${isbn}:`, error);
      return null;
    }
  }

  /**
   * Search books with comprehensive data collection including ALL available fields
   */
  async searchBooks(query: string, options: {
    page?: number;
    pageSize?: number;
    column?: string;
    year?: number;
    language?: string;
    shouldMatchAll?: boolean;
    withPrices?: boolean;
  } = {}): Promise<{ total: number; books: ISBNdbBookData[]; stats: DataCollectionStats }> {
    try {
      const params = new URLSearchParams({
        page: String(options.page || 1),
        pageSize: String(options.pageSize || 20),
      });
      
      let apiUrl: string;
      
      // If column is 'subjects', use the /search/books endpoint with subject parameter
      // According to ISBNdb API spec: /search/books?subject={subject_name} returns books with that subject
      if (options.column === 'subjects') {
        params.set('subject', query);
        // Add optional year filter if provided
        if (options.year) {
          params.set('year', String(options.year));
        }
        apiUrl = `${this.baseUrl}/search/books?${params.toString()}`;
        console.log(`[ISBNdbDataCollector] Searching books by subject using /search/books endpoint`);
      } else {
        // For other column types (title, author, etc.), use the /books/{query} endpoint
        if (options.column) {
          params.set('column', options.column);
        }
        if (options.year) {
          params.set('year', String(options.year));
        }
        if (options.language) {
          params.set('language', options.language);
        }
        if (options.shouldMatchAll !== undefined) {
          params.set('shouldMatchAll', String(options.shouldMatchAll ? 1 : 0));
        }
        const encodedQuery = encodeURIComponent(query);
        apiUrl = `${this.baseUrl}/books/${encodedQuery}?${params.toString()}`;
      }
      
      console.log(`[ISBNdbDataCollector] API URL: ${apiUrl.replace(this.apiKey, '[REDACTED]')}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ISBNdb API error: ${response.status}`);
      }

      const data = await response.json();
      
      // The /search/books endpoint returns 'data' array, while /books/{query} returns 'books' array
      const booksArray = data.data || data.books || [];
      
      // Fetch detailed information for each book with ALL available data
      const detailedBooks = await Promise.all(
        booksArray.map(async (book: any) => {
          const detailed = await this.fetchBookDetails(book.isbn13 || book.isbn, options.withPrices);
          return detailed || book;
        })
      );

      // Analyze data collection statistics
      const stats = this.analyzeDataCollection(detailedBooks);

      return {
        total: data.total || detailedBooks.length,
        books: detailedBooks,
        stats,
      };
    } catch (error) {
      console.error('Error searching books:', error);
      throw error;
    }
  }

  /**
   * Fetch books by year with comprehensive data collection
   */
  async fetchBooksByYear(year: number, options: {
    page?: number;
    pageSize?: number;
    searchType?: 'recent' | 'year';
    withPrices?: boolean;
  } = {}): Promise<{ total: number; books: ISBNdbBookData[]; stats: DataCollectionStats }> {
    try {
      const params = new URLSearchParams({
        page: String(options.page || 1),
        pageSize: String(options.pageSize || 20),
      });

      let apiUrl: string;
      if (options.searchType === 'recent') {
        apiUrl = `${this.baseUrl}/books/recent?${params}&year=${year}`;
      } else {
        // Use a generic search term ('a') in the path to avoid matching year in titles
        // Then use column=date_published and year parameter to filter by publication year only
        params.set('column', 'date_published');
        params.set('year', String(year));
        apiUrl = `${this.baseUrl}/books/a?${params.toString()}`;
        console.log(`[ISBNdbDataCollector] Searching books by year: ${year} using /books/a with year parameter`);
      }

      console.log(`[ISBNdbDataCollector] API URL: ${apiUrl.replace(this.apiKey, '[REDACTED]')}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ISBNdb API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Fetch detailed information for each book with ALL available data
      const detailedBooks = await Promise.all(
        (data.books || []).map(async (book: any) => {
          const detailed = await this.fetchBookDetails(book.isbn13 || book.isbn, options.withPrices);
          return detailed || book;
        })
      );

      // Analyze data collection statistics
      const stats = this.analyzeDataCollection(detailedBooks);

      return {
        total: data.total || detailedBooks.length,
        books: detailedBooks,
        stats,
      };
    } catch (error) {
      console.error('Error fetching books by year:', error);
      throw error;
    }
  }

  /**
   * Analyze data collection statistics
   */
  private analyzeDataCollection(books: ISBNdbBookData[]): DataCollectionStats {
    const allFields = new Set<string>();
    const missingFields = new Set<string>();
    const expectedFields = [
      'title', 'title_long', 'isbn', 'isbn13', 'dewey_decimal', 'binding', 
      'publisher', 'language', 'date_published', 'edition', 'pages', 
      'dimensions', 'dimensions_structured', 'overview', 'image', 'image_original',
      'msrp', 'excerpt', 'synopsis', 'authors', 'subjects', 'reviews', 
      'prices', 'related', 'other_isbns'
    ];

    books.forEach(book => {
      Object.keys(book).forEach(field => allFields.add(field));
    });

    expectedFields.forEach(field => {
      const hasField = books.some(book => book[field] !== undefined && book[field] !== null);
      if (!hasField) {
        missingFields.add(field);
      }
    });

    return {
      totalProcessed: books.length,
      totalStored: 0, // Will be updated by calling function
      totalUpdated: 0, // Will be updated by calling function
      totalSkipped: 0, // Will be updated by calling function
      errors: [],
      processingTime: 0, // Will be updated by calling function
      dataFieldsCollected: Array.from(allFields),
      missingFields: Array.from(missingFields),
    };
  }

  /**
   * Store book with complete data collection including ALL ISBNdb fields
   */
  async storeBookWithCompleteData(bookData: ISBNdbBookData): Promise<any> {
    try {
      // Check if book already exists
      const { data: existingBook } = await supabase
        .from('books')
        .select('id, isbn13, isbn')
        .or(`isbn13.eq.${bookData.isbn13},isbn.eq.${bookData.isbn}`)
        .single();

      if (existingBook) {
        // Update existing book with ALL available data
        const { data: updatedBook, error: updateError } = await supabase
          .from('books')
          .update({
            title: bookData.title || (existingBook as any).title,
            title_long: bookData.title_long,
            publisher: bookData.publisher,
            language: bookData.language,
            date_published: bookData.date_published,
            edition: bookData.edition,
            pages: bookData.pages,
            dimensions: bookData.dimensions,
            overview: bookData.overview,
            synopsis: bookData.synopsis,
            msrp: bookData.msrp,
            excerpt: bookData.excerpt,
            dewey_decimal: bookData.dewey_decimal,
            related_data: bookData.related,
            other_isbns: bookData.other_isbns,
            isbndb_last_updated: new Date().toISOString(),
            isbndb_data_version: '2.6.0',
            raw_isbndb_data: bookData, // Store ALL raw data
          })
          .eq('id', existingBook.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // Process additional data using the comprehensive function
        await this.processAdditionalData(existingBook.id, bookData);

        return { book: updatedBook, action: 'updated' };
      } else {
        // Create new book with ALL available data
        const { data: newBook, error: insertError } = await supabase
          .from('books')
          .insert({
            title: bookData.title,
            title_long: bookData.title_long,
            isbn: bookData.isbn,
            isbn13: bookData.isbn13,
            publisher: bookData.publisher,
            language: bookData.language,
            date_published: bookData.date_published,
            edition: bookData.edition,
            pages: bookData.pages,
            dimensions: bookData.dimensions,
            overview: bookData.overview,
            synopsis: bookData.synopsis,
            msrp: bookData.msrp,
            excerpt: bookData.excerpt,
            dewey_decimal: bookData.dewey_decimal,
            related_data: bookData.related,
            other_isbns: bookData.other_isbns,
            isbndb_last_updated: new Date().toISOString(),
            isbndb_data_version: '2.6.0',
            raw_isbndb_data: bookData, // Store ALL raw data
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Process additional data using the comprehensive function
        await this.processAdditionalData(newBook.id, bookData);

        // Handle authors and subjects
        await this.processAuthorsAndSubjects(newBook.id, bookData);

        return { book: newBook, action: 'created' };
      }
    } catch (error) {
      console.error('Error storing book:', error);
      throw error;
    }
  }

  /**
   * Process additional data using database functions
   */
  private async processAdditionalData(bookId: string, bookData: ISBNdbBookData) {
    try {
      await supabase.rpc('process_complete_isbndb_book_data', {
        book_uuid: bookId,
        isbndb_data: bookData
      });
    } catch (error) {
      console.warn('Error processing additional data:', error);
    }
  }

  /**
   * Process authors and subjects for a book
   */
  private async processAuthorsAndSubjects(bookId: string, bookData: ISBNdbBookData) {
    // Handle authors
    if (bookData.authors && Array.isArray(bookData.authors)) {
      await Promise.all(
        bookData.authors.map(async (authorName: string) => {
          try {
            // Check if author exists
            let { data: author } = await supabase
              .from('authors')
              .select('id')
              .eq('name', authorName)
              .single();

            if (!author) {
              // Create author
              const { data: newAuthor } = await supabase
                .from('authors')
                .insert({ name: authorName })
                .select()
                .single();
              author = newAuthor;
            }

            if (author) {
              // Link author to book
              await supabase
                .from('book_authors')
                .upsert({
                  book_id: bookId,
                  author_id: author.id,
                }, {
                  onConflict: 'book_id,author_id',
                  ignoreDuplicates: true
                });
            }
          } catch (error) {
            console.warn(`Error processing author ${authorName}:`, error);
          }
        })
      );
    }

    // Handle subjects
    if (bookData.subjects && Array.isArray(bookData.subjects)) {
      await Promise.all(
        bookData.subjects.map(async (subjectName: string) => {
          try {
            // Check if subject exists
            let { data: subject } = await supabase
              .from('subjects')
              .select('id')
              .eq('name', subjectName)
              .single();

            if (!subject) {
              // Create subject
              const { data: newSubject } = await supabase
                .from('subjects')
                .insert({ name: subjectName })
                .select()
                .single();
              subject = newSubject;
            }

            if (subject) {
              // Link subject to book
              await supabase
                .from('book_subjects')
                .upsert({
                  book_id: bookId,
                  subject_id: subject.id,       
                }, {
                  onConflict: 'book_id,subject_id',
                  ignoreDuplicates: true
                });
            }
          } catch (error) {
            console.warn(`Error processing subject ${subjectName}:`, error);
          }
        })
      );
    }
  }

  /**
   * Bulk import books with comprehensive data collection
   */
  async bulkImportBooks(books: ISBNdbBookData[]): Promise<DataCollectionStats> {
    const startTime = Date.now();
    const stats: DataCollectionStats = {
      totalProcessed: 0,
      totalStored: 0,
      totalUpdated: 0,
      totalSkipped: 0,
      errors: [],
      processingTime: 0,
      dataFieldsCollected: [],
      missingFields: [],
    };

    for (const book of books) {
      try {
        stats.totalProcessed++;
        const result = await this.storeBookWithCompleteData(book);
        
        if (result.action === 'created') {
          stats.totalStored++;
        } else if (result.action === 'updated') {
          stats.totalUpdated++;
        }
      } catch (error) {
        stats.totalSkipped++;
        stats.errors.push(`Error processing book ${book.isbn}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    stats.processingTime = Date.now() - startTime;
    return stats;
  }

  /**
   * Get comprehensive book data from database
   */
  async getCompleteBookData(bookId: string) {
    try {
      const { data, error } = await supabase
        .from('books_complete')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching complete book data:', error);
      throw error;
    }
  }

  /**
   * Log sync activity
   */
  async logSyncActivity(bookId: string, syncType: string, syncStatus: string, details: any = {}) {
    try {
      await supabase
        .from('isbndb_sync_log')
        .insert({
          book_id: bookId,
          sync_type: syncType,
          sync_status: syncStatus,
          records_processed: details.recordsProcessed || 0,
          records_added: details.recordsAdded || 0,
          records_updated: details.recordsUpdated || 0,
          records_skipped: details.recordsSkipped || 0,
          error_message: details.errorMessage,
          sync_completed_at: new Date().toISOString(),
        });
    } catch (error) {
      console.warn('Error logging sync activity:', error);
    }
  }
} 