import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    const isbndbApiKey = process.env.ISBNDB_API_KEY;
    if (!isbndbApiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    let apiUrl: string;
    let params: Record<string, string> = {
      page,
      pageSize,
    };

    if (searchType === 'recent') {
      // Use search endpoint for recent publications
      apiUrl = `https://api2.isbndb.com/books/recent`;
      params.year = year;
    } else {
      // Use search endpoint for specific year
      apiUrl = `https://api2.isbndb.com/books/${year}`;
      params.column = 'date_published';
    }

    const queryString = new URLSearchParams(params).toString();
    const fullUrl = `${apiUrl}?${queryString}`;

    console.log(`Fetching from ISBNdb: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': isbndbApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ISBNdb API error:', response.status, errorText);
      return NextResponse.json(
        { error: `ISBNdb API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Process and enhance the data
    const processedBooks = await Promise.all(
      data.books?.map(async (book: any) => {
        // Fetch detailed book information including all available fields
        const detailedBook = await fetchDetailedBookInfo(book.isbn13 || book.isbn, isbndbApiKey);
        
        return {
          ...book,
          ...detailedBook,
          // Ensure we have all the fields from the basic response
          title: book.title || detailedBook?.title,
          isbn13: book.isbn13 || detailedBook?.isbn13,
          isbn: book.isbn || detailedBook?.isbn,
          publisher: book.publisher || detailedBook?.publisher,
          date_published: book.date_published || detailedBook?.date_published,
          authors: book.authors || detailedBook?.authors,
        };
      }) || []
    );

    return NextResponse.json({
      total: data.total || processedBooks.length,
      books: processedBooks,
      searchType,
      year,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });

  } catch (error) {
    console.error('Error fetching books from ISBNdb:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books from ISBNdb', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchDetailedBookInfo(isbn: string, apiKey: string) {
  try {
    const response = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch detailed info for ISBN ${isbn}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.book || null;
  } catch (error) {
    console.warn(`Error fetching detailed info for ISBN ${isbn}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isbns } = await request.json();

    if (!Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 });
    }

    const isbndbApiKey = process.env.ISBNDB_API_KEY;
    if (!isbndbApiKey) {
      return NextResponse.json({ error: 'ISBNdb API key not configured' }, { status: 500 });
    }

    // Fetch detailed information for each ISBN
    const detailedBooks = await Promise.all(
      isbns.map(async (isbn: string) => {
        try {
          const response = await fetch(`https://api2.isbndb.com/book/${isbn}`, {
            headers: {
              'Authorization': isbndbApiKey,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.warn(`Failed to fetch book ${isbn}: ${response.status}`);
            return null;
          }

          const data = await response.json();
          return data.book || null;
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
        return await storeBookWithCompleteData(book);
      })
    );

    return NextResponse.json({
      total: validBooks.length,
      stored: storedBooks.filter(b => b !== null).length,
      books: storedBooks.filter(b => b !== null),
    });

  } catch (error) {
    console.error('Error importing books:', error);
    return NextResponse.json(
      { error: 'Failed to import books', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function storeBookWithCompleteData(isbndbBook: any) {
  try {
    // Check if book already exists
    const { data: existingBook } = await supabase
      .from('books')
      .select('id, isbn13, isbn')
      .or(`isbn13.eq.${isbndbBook.isbn13},isbn.eq.${isbndbBook.isbn}`)
      .single();

    if (existingBook) {
      // Update existing book with new data
      const { data: updatedBook, error: updateError } = await supabase
        .from('books')
        .update({
          title: isbndbBook.title || existingBook.title,
          title_long: isbndbBook.title_long,
          publisher: isbndbBook.publisher,
          language: isbndbBook.language,
          date_published: isbndbBook.date_published,
          edition: isbndbBook.edition,
          pages: isbndbBook.pages,
          dimensions: isbndbBook.dimensions,
          overview: isbndbBook.overview,
          synopsis: isbndbBook.synopsis,
          msrp: isbndbBook.msrp,
          excerpt: isbndbBook.excerpt,
          dewey_decimal: isbndbBook.dewey_decimal,
          related_data: isbndbBook.related,
          other_isbns: isbndbBook.other_isbns,
          isbndb_last_updated: new Date().toISOString(),
          isbndb_data_version: '2.6.0',
          raw_isbndb_data: isbndbBook,
        })
        .eq('id', existingBook.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating book:', updateError);
        return null;
      }

      // Process additional data using the comprehensive function
      await supabase.rpc('process_complete_isbndb_book_data', {
        book_uuid: existingBook.id,
        isbndb_data: isbndbBook
      });

      return updatedBook;
    } else {
      // Create new book
      const { data: newBook, error: insertError } = await supabase
        .from('books')
        .insert({
          title: isbndbBook.title,
          title_long: isbndbBook.title_long,
          isbn: isbndbBook.isbn,
          isbn13: isbndbBook.isbn13,
          publisher: isbndbBook.publisher,
          language: isbndbBook.language,
          date_published: isbndbBook.date_published,
          edition: isbndbBook.edition,
          pages: isbndbBook.pages,
          dimensions: isbndbBook.dimensions,
          overview: isbndbBook.overview,
          synopsis: isbndbBook.synopsis,
          msrp: isbndbBook.msrp,
          excerpt: isbndbBook.excerpt,
          dewey_decimal: isbndbBook.dewey_decimal,
          related_data: isbndbBook.related,
          other_isbns: isbndbBook.other_isbns,
          isbndb_last_updated: new Date().toISOString(),
          isbndb_data_version: '2.6.0',
          raw_isbndb_data: isbndbBook,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting book:', insertError);
        return null;
      }

      // Process additional data using the comprehensive function
      await supabase.rpc('process_complete_isbndb_book_data', {
        book_uuid: newBook.id,
        isbndb_data: isbndbBook
      });

      // Handle authors
      if (isbndbBook.authors && Array.isArray(isbndbBook.authors)) {
        await Promise.all(
          isbndbBook.authors.map(async (authorName: string) => {
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
                .insert({
                  book_id: newBook.id,
                  author_id: author.id,
                })
                .onConflict('book_id,author_id')
                .ignore();
            }
          })
        );
      }

      // Handle subjects
      if (isbndbBook.subjects && Array.isArray(isbndbBook.subjects)) {
        await Promise.all(
          isbndbBook.subjects.map(async (subjectName: string) => {
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
                .insert({
                  book_id: newBook.id,
                  subject_id: subject.id,
                })
                .onConflict('book_id,subject_id')
                .ignore();
            }
          })
        );
      }

      return newBook;
    }
  } catch (error) {
    console.error('Error storing book with complete data:', error);
    return null;
  }
} 