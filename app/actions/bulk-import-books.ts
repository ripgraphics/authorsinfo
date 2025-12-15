"use server"

import { supabaseAdmin } from '@/lib/supabase/server'
import { getBulkBooks } from '@/lib/isbndb'
import { revalidatePath } from "next/cache"

/**
 * MULTIPLE AUTHORS HANDLING STRATEGY:
 * 
 * This system handles books with multiple authors using a hybrid approach:
 * 
 * 1. books.author (text field): Contains the PRIMARY author's name
 *    - Used for database trigger compatibility and basic display
 *    - Synced automatically with author_id by the sync_book_author trigger
 * 
 * 2. books.author_id (UUID field): Contains the PRIMARY author's ID
 *    - Foreign key reference to the main author
 *    - Automatically synced with author field by database trigger
 * 
 * 3. book_authors (junction table): Contains ALL author relationships
 *    - Proper many-to-many relationship for complete author data
 *    - Used by UI components to display all authors
 *    - Supports full multi-author functionality
 * 
 * This approach ensures:
 * - Database triggers work correctly (require single author in text field)
 * - UI can display all authors through proper joins
 * - Backward compatibility with existing single-author logic
 * - Full support for multi-author books
 */
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

interface ImportResult {
  added: number
  duplicates: number
  errors: number
  errorDetails?: string[]
  duplicateIsbns?: string[]  // array of duplicate ISBNs for UI display
  logs?: string[]  // array of log messages for UI display
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function checkForDuplicates(isbns: string[]) {
  const supabase = supabaseAdmin;

  // Check for existing ISBNs
  const { data: existingBooks, error } = await supabase
    .from("books")
    .select("isbn10, isbn13")
    .or(`isbn10.in.(${isbns.join(",")}),isbn13.in.(${isbns.join(",")})`)

  if (error) {
    console.error("Error checking for duplicates:", error)
    return { duplicates: [], error: error.message }
  }

  // Create a set of existing ISBNs (both ISBN-10 and ISBN-13)
  const existingIsbns = new Set<string>()
  existingBooks?.forEach((book: { isbn10: string | null; isbn13: string | null }) => {
    if (book.isbn10) existingIsbns.add(book.isbn10)
    if (book.isbn13) existingIsbns.add(book.isbn13)
  })

  // Filter out duplicates
  const duplicates = isbns.filter((isbn) => existingIsbns.has(isbn))
  const newIsbns = isbns.filter((isbn) => !existingIsbns.has(isbn))

  return { duplicates, newIsbns, error: null }
}

// New function to import books directly from book objects (bypasses ISBNdb refetch)
export async function bulkImportBookObjects(bookObjects: any[]): Promise<ImportResult> {
  const supabase = supabaseAdmin;
  const result: ImportResult = { added: 0, duplicates: 0, errors: 0, errorDetails: [] }

  try {
    // Extract ISBNs for duplicate checking
    const isbns = bookObjects.map(book => book.isbn13 || book.isbn).filter(Boolean);
    
    // Check for duplicates
    const { duplicates, newIsbns, error } = await checkForDuplicates(isbns)

    if (error) {
      result.errors++
      result.errorDetails?.push(`Error checking duplicates: ${error}`)
      return result
    }

    result.duplicates = duplicates.length
    result.duplicateIsbns = duplicates

    if (!newIsbns || newIsbns.length === 0) {
      return result; // No new books to add
    }

    // Filter book objects to only include new ones (not duplicates)
    const newBooks = bookObjects.filter(book => {
      const isbn = book.isbn13 || book.isbn;
      return isbn && newIsbns.includes(isbn);
    });

    if (newBooks.length === 0) {
      result.errors++
      result.errorDetails?.push("No new books to import after filtering duplicates")
      return result
    }

    // Use ISBNdbDataCollector to store books with ALL available data
    const { ISBNdbDataCollector } = await import('@/lib/isbndb-data-collector');
    const apiKey = process.env.ISBNDB_API_KEY || '';
    const collector = new ISBNdbDataCollector(apiKey);

    // Process each book object using comprehensive storage (stores ALL ISBNdb fields)
    for (const book of newBooks) {
      try {
        // Use storeBookWithCompleteData to store ALL fields including:
        // - excerpt, dewey_decimal, related_data, other_isbns
        // - image, image_original, dimensions_structured
        // - reviews, prices, raw_isbndb_data
        const storeResult = await collector.storeBookWithCompleteData(book);
        
        if (storeResult.action === 'created') {
          result.added++;
        } else if (storeResult.action === 'updated') {
          result.added++; // Count updates as added for consistency
        }
      } catch (error) {
        result.errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errorDetails?.push(`Failed to import "${book.title}": ${errorMsg}`);
        console.error(`Error importing book ${book.isbn13 || book.isbn}:`, error);
      }
    }

    return result;
  } catch (error) {
    result.errors++;
    result.errorDetails?.push(`Bulk import error: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}

// Keep the old implementation as fallback (commented out for reference)
// OLD IMPLEMENTATION - commented out
/*
    // Process each book object directly (no ISBNdb refetch needed) - OLD IMPLEMENTATION
    for (const book of newBooks) {
      try {
        // Enhanced debugging for author data
        console.log(`\n=== DEBUGGING AUTHOR DATA FOR "${book.title}" ===`);
        console.log('book.authors:', book.authors);
        console.log('book.authors type:', typeof book.authors);
        console.log('book.authors is Array:', Array.isArray(book.authors));
        console.log('book.authors length:', book.authors?.length);
        console.log('=== END AUTHOR DEBUG ===\n');

        // Find or create authors
        const authorIds: string[] = []

        if (book.authors && Array.isArray(book.authors) && book.authors.length > 0) {
          console.log(`Processing ${book.authors.length} authors for book "${book.title}":`, book.authors);
          for (const authorName of book.authors) {
            // Skip empty or invalid author names
            if (!authorName || typeof authorName !== 'string' || authorName.trim() === '') {
              console.warn(`Skipping invalid author name:`, authorName);
              continue;
            }

            const cleanAuthorName = authorName.trim();
            console.log(`Processing author: "${cleanAuthorName}"`);

            const { data: existingAuthor } = await supabase
              .from("authors")
              .select("id")
              .eq("name", cleanAuthorName)
              .maybeSingle()

            if (existingAuthor) {
              console.log(`Found existing author: ${cleanAuthorName} (ID: ${existingAuthor.id})`);
              authorIds.push(existingAuthor.id)
            } else {
              console.log(`Creating new author: ${cleanAuthorName}`);
              const { data: newAuthor, error: authorError } = await supabase
                .from("authors")
                .insert({ name: cleanAuthorName })
                .select("id")
                .single()

              if (authorError) {
                console.error(`Error creating author "${cleanAuthorName}":`, authorError)
                result.errors++
                result.errorDetails?.push(`Failed to create author "${cleanAuthorName}" for book ${book.title}: ${authorError.message}`)
              } else if (newAuthor) {
                console.log(`Successfully created author: ${cleanAuthorName} (ID: ${newAuthor.id})`);
                authorIds.push(newAuthor.id)
              }
            }
          }
        } else {
          console.error(`❌ No valid authors found for book "${book.title}"`);
          console.error(`   - book.authors exists: ${!!book.authors}`);
          console.error(`   - book.authors is array: ${Array.isArray(book.authors)}`);
          console.error(`   - book.authors length: ${book.authors?.length}`);
          console.error(`   - book.authors value: ${JSON.stringify(book.authors)}`);
        }

        // Skip books without authors
        if (authorIds.length === 0) {
          result.errors++
          const errorMsg = `Skipping book "${book.title}": No valid authors found. Authors field: ${JSON.stringify(book.authors)}`;
          result.errorDetails?.push(errorMsg);
          console.error(errorMsg);
          continue;
        }

        // Find or create publisher
        let publisherId = null
        if (book.publisher) {
          const { data: existingPublisher } = await supabase
            .from("publishers")
            .select("id")
            .eq("name", book.publisher)
            .maybeSingle()

          if (existingPublisher) {
            publisherId = existingPublisher.id
          } else {
            const { data: newPublisher, error: publisherError } = await supabase
              .from("publishers")
              .insert({ name: book.publisher })
              .select("id")
              .single()

            if (publisherError) {
              console.error("Error creating publisher:", publisherError)
            } else {
              publisherId = newPublisher.id
            }
          }
        }

        // Find or create binding type
        let bindingTypeId: number | null = null
        if (book.binding) {
          const { data: existingBinding } = await supabase
            .from("binding_types")
            .select("id")
            .ilike("name", book.binding)
            .maybeSingle()

          if (existingBinding) {
            bindingTypeId = existingBinding.id
          } else {
            const { data: newBinding, error: bindingError } = await supabase
              .from("binding_types")
              .insert({ name: book.binding })
              .select("id")
              .single()

            if (!bindingError && newBinding) {
              bindingTypeId = newBinding.id
            }
          }
        }

        // Find or create format type
        let formatTypeId: number | null = null
        if (book.binding) {
          let formatName = 'Print' // default format
          if (book.binding.toLowerCase().includes('ebook') || book.binding.toLowerCase().includes('kindle')) {
            formatName = 'Digital'
          } else if (book.binding.toLowerCase().includes('audio')) {
            formatName = 'Audio'
          }

          const { data: existingFormat } = await supabase
            .from("format_types")
            .select("id")
            .ilike("name", formatName)
            .maybeSingle()

          if (existingFormat) {
            formatTypeId = existingFormat.id
          } else {
            const { data: newFormat, error: formatError } = await supabase
              .from("format_types")
              .insert({ name: formatName })
              .select("id")
              .single()

            if (!formatError && newFormat) {
              formatTypeId = newFormat.id
            }
          }
        }

        // Upload cover image to Cloudinary if available
        let coverImageId: number | null = null;
        if (book.image) {
          try {
            const uploadRes = await cloudinary.uploader.upload(book.image, {
              folder: 'authorsinfo/book_cover',
              transformation: [{ height: 900, crop: 'fit', format: 'webp' }],
            });
            // Get Book Cover entity type
            const { data: entityTypeRow } = await supabase
              .from('entity_types')
              .select('id')
              .eq('name', 'Book Cover')
              .maybeSingle();
            const entityTypeId = entityTypeRow?.id ?? null;
            const { data: imageRow, error: imgErr } = await supabase
              .from('images')
              .insert({ 
                url: uploadRes.secure_url, 
                alt_text: book.title, 
                entity_type_id: entityTypeId,
                metadata: { entity_type: 'book', entity_id: null } // Will be updated when book is created
              })
              .select('id')
              .single();
            if (imageRow) {
              coverImageId = imageRow.id;
            } else {
              console.error('Failed to insert image for', book.title, imgErr);
            }
          } catch (imageError) {
            console.error('Failed to upload cover image for', book.title, imageError);
          }
        }

        // Format publication date properly (outside try blocks so it can be reused)
        let publicationDate = null;
        if (book.date_published || book.publish_date) {
          const dateStr = book.date_published || book.publish_date;
          let formattedDate = null;
          
          if (dateStr && /^\d{4}$/.test(dateStr)) {
            // Year only: 2015 -> 2015-01-01
            formattedDate = `${dateStr}-01-01`;
          } else if (dateStr && /^\d{4}-\d{2}$/.test(dateStr)) {
            // Year-month: 2015-04 -> 2015-04-01
            formattedDate = `${dateStr}-01`;
          } else if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Full date: keep as is
            formattedDate = dateStr;
          } else {
            // Invalid format: set to null
            console.warn(`Invalid date format: ${dateStr}, setting to null`);
            formattedDate = null;
          }
          
          // Check if date is in the future
          if (formattedDate) {
            const pubDate = new Date(formattedDate);
            const today = new Date();
            if (pubDate > today) {
              console.warn(`Future publication date: ${formattedDate}, setting to null`);
              publicationDate = null;
            } else {
              publicationDate = formattedDate;
            }
          }
        }

        // Properly handle ISBN10 vs ISBN13 using utility function
        const { extractISBNs } = await import('@/utils/isbnUtils');
        const { isbn10, isbn13 } = extractISBNs({
          isbn: book.isbn,
          isbn13: book.isbn13,
        });

        // Insert the book
        let newBookId: string | null = null;
        let success = false;

        try {
          const bookData = {
            title: book.title,
            title_long: book.title_long || null,
            synopsis: book.synopsis || null,
            overview: book.overview || null,
            isbn10: isbn10,
            isbn13: isbn13,
            publisher_id: publisherId,
            publication_date: publicationDate,
            language: book.language || null,
            pages: book.pages || null,
            binding: book.binding || null,
            edition: book.edition || null,
            dimensions: book.dimensions || null,
            weight: book.dimensions_structured?.weight?.value || null,
            list_price: book.msrp || null,
            binding_type_id: bindingTypeId,
            format_type_id: formatTypeId,
            cover_image_id: coverImageId,
            author: authorIds.length > 0 ? book.authors[0] : 'Unknown Author',
            author_id: authorIds[0] || null,
          };
          
          console.log(`Inserting book "${book.title}" with data:`, bookData);
          
          const { data: newBook, error: bookError } = await supabase
            .from('books')
            .insert(bookData)
            .select('id')
            .single();

          if (bookError) {
            console.error(`Book insert error:`, bookError);
            throw bookError;
          }

          if (newBook?.id) {
            newBookId = newBook.id;
            console.log(`Book inserted successfully, ID: ${newBookId}`);
            
            // Link all authors to the book
            let linkedCount = 0;
            for (let i = 0; i < authorIds.length; i++) {
              const authId = authorIds[i];
              try {
                const { error: linkError } = await supabase
                  .from('book_authors')
                  .upsert(
                    { book_id: newBookId, author_id: authId },
                    { onConflict: 'book_id,author_id' }
                  );
                
                if (linkError) {
                  // If upsert fails (e.g., no unique constraint), try regular insert
                  const { error: insertError } = await supabase
                    .from('book_authors')
                    .insert({ book_id: newBookId, author_id: authId });
                  
                  if (insertError) {
                    console.warn(`Failed to link author ${authId} to book "${book.title}":`, insertError);
                    result.errorDetails?.push(`Failed to link author to book "${book.title}": ${insertError.message}`);
                  } else {
                    linkedCount++;
                  }
                } else {
                  linkedCount++;
                }
              } catch (error) {
                console.warn(`Error linking author ${authId} to book "${book.title}":`, error);
                result.errorDetails?.push(`Error linking author to book "${book.title}": ${error}`);
              }
            }
            console.log(`Successfully linked ${linkedCount}/${authorIds.length} authors to book "${book.title}"`);
            
            // Link subjects if available
            if (book.subjects && Array.isArray(book.subjects)) {
              for (const subjectName of book.subjects) {
                try {
                  const { data: existingSub } = await supabase
                    .from("subjects")
                    .select("id")
                    .eq("name", subjectName)
                    .maybeSingle();
                  let subjectId = existingSub?.id;
                  if (!subjectId) {
                    const { data: newSub, error: subError } = await supabase
                      .from("subjects")
                      .insert({ name: subjectName })
                      .select("id")
                      .single();
                    if (newSub) subjectId = newSub.id;
                  }
                  if (subjectId) {
                    await supabase
                      .from("book_subjects")
                      .upsert({ book_id: newBookId, subject_id: subjectId });
                  }
                } catch (subjectError) {
                  console.error(`Error linking subject "${subjectName}":`, subjectError);
                }
              }
            }
            
            success = true;
          }
        } catch (insertError) {
          console.error(`Failed to insert book "${book.title}":`, insertError);
          result.errors++;
          const errorMessage = insertError instanceof Error ? insertError.message : String(insertError);
          result.errorDetails?.push(`Failed to insert book ${book.title}: ${errorMessage}`);
        }

        if (success) {
          result.added++;
          console.log(`✅ Successfully processed book "${book.title}" with ${authorIds.length} authors`);
        }

      } catch (error) {
        result.errors++
        result.errorDetails?.push(`Error processing book ${book.title}: ${error}`)
        console.error(`Error processing book ${book.title}:`, error);
      }
    }

    return result
  } catch (error) {
    console.error("Bulk import book objects error:", error)
    result.errors++
    result.errorDetails?.push(`General error: ${error}`)
    return result
  }
}
*/

export async function bulkImportBooks(isbns: string[]): Promise<ImportResult> {
  const supabase = supabaseAdmin;
  const result: ImportResult = { added: 0, duplicates: 0, errors: 0, errorDetails: [] }

  try {
    // Check for duplicates
    const { duplicates, newIsbns, error } = await checkForDuplicates(isbns)

    if (error) {
      result.errors++
      result.errorDetails?.push(`Error checking duplicates: ${error}`)
      return result
    }

    result.duplicates = duplicates.length
    result.duplicateIsbns = duplicates

    // Try to fetch book titles for duplicates to make the display more informative
    if (duplicates.length > 0) {
      try {
        const { data: duplicateBooks } = await supabase
          .from("books")
          .select("title, isbn10, isbn13")
          .or(`isbn10.in.(${duplicates.join(",")}),isbn13.in.(${duplicates.join(",")})`)
        
        if (duplicateBooks && duplicateBooks.length > 0) {
          // Create a map of ISBN to title
          const isbnToTitle = new Map<string, string>()
          duplicateBooks.forEach((book: { title: string; isbn10: string | null; isbn13: string | null }) => {
            if (book.isbn10) isbnToTitle.set(book.isbn10, book.title)
            if (book.isbn13) isbnToTitle.set(book.isbn13, book.title)
          })
          
          // Enhance duplicateIsbns with titles (format: "ISBN - Title" or just "ISBN" if title not found)
          result.duplicateIsbns = duplicates.map(isbn => {
            const title = isbnToTitle.get(isbn)
            return title ? `${isbn} - ${title}` : isbn
          })
        }
      } catch (error) {
        // If we can't fetch titles, just use ISBNs
        console.error("Error fetching duplicate book titles:", error)
      }
    }

    if (!newIsbns || newIsbns.length === 0) {
      return result; // No new books to add
    }

    // Fetch book details from ISBNdb
    const books = await getBulkBooks(newIsbns)

    if (books.length === 0) {
      result.errors++
      result.errorDetails?.push("No books found in ISBNdb")
      return result
    }

    // Process each book
    for (const book of books) {
      try {
        // Find or create publisher
        let publisherId = null
        if (book.publisher) {
          const { data: existingPublisher } = await supabase
            .from("publishers")
            .select("id")
            .eq("name", book.publisher)
            .maybeSingle()

          if (existingPublisher) {
            publisherId = existingPublisher.id
          } else {
            const { data: newPublisher, error: publisherError } = await supabase
              .from("publishers")
              .insert({ name: book.publisher })
              .select("id")
              .single()

            if (publisherError) {
              console.error("Error creating publisher:", publisherError)
            } else {
              publisherId = newPublisher.id
            }
          }
        }

        // Find or create binding type
        let bindingTypeId: number | null = null
        if (book.binding) {
          const { data: existingBinding } = await supabase
            .from("binding_types")
            .select("id")
            .ilike("name", book.binding)
            .maybeSingle()

          if (existingBinding) {
            bindingTypeId = existingBinding.id
          } else {
            const { data: newBinding, error: bindingError } = await supabase
              .from("binding_types")
              .insert({ name: book.binding })
              .select("id")
              .single()

            if (!bindingError && newBinding) {
              bindingTypeId = newBinding.id
            }
          }
        }

        // Find or create format type (we'll use a simple mapping for common formats)
        let formatTypeId: number | null = null
        if (book.binding) {
          // Map common binding types to format types
          let formatName = 'Print' // default format
          if (book.binding.toLowerCase().includes('ebook') || book.binding.toLowerCase().includes('kindle')) {
            formatName = 'Digital'
          } else if (book.binding.toLowerCase().includes('audio')) {
            formatName = 'Audio'
          }

          const { data: existingFormat } = await supabase
            .from("format_types")
            .select("id")
            .ilike("name", formatName)
            .maybeSingle()

          if (existingFormat) {
            formatTypeId = existingFormat.id
          } else {
            const { data: newFormat, error: formatError } = await supabase
              .from("format_types")
              .insert({ name: formatName })
              .select("id")
              .single()

            if (!formatError && newFormat) {
              formatTypeId = newFormat.id
            }
          }
        }

        // Find or create authors
        const authorIds: string[] = []
        
        // Enhanced debugging for author data
        console.log(`\n=== DEBUGGING AUTHOR DATA FOR "${book.title}" ===`);
        console.log('Full book object:', JSON.stringify(book, null, 2));
        console.log('book.authors:', book.authors);
        console.log('book.authors type:', typeof book.authors);
        console.log('book.authors is Array:', Array.isArray(book.authors));
        console.log('book.authors length:', book.authors?.length);
        console.log('=== END AUTHOR DEBUG ===\n');

        if (book.authors && Array.isArray(book.authors) && book.authors.length > 0) {
          console.log(`Processing ${book.authors.length} authors for book "${book.title}":`, book.authors);
          for (const authorName of book.authors) {
            // Skip empty or invalid author names
            if (!authorName || typeof authorName !== 'string' || authorName.trim() === '') {
              console.warn(`Skipping invalid author name:`, authorName);
              continue;
            }

            const cleanAuthorName = authorName.trim();
            console.log(`Processing author: "${cleanAuthorName}"`);

            const { data: existingAuthor } = await supabase
              .from("authors")
              .select("id")
              .eq("name", cleanAuthorName)
              .maybeSingle()

            if (existingAuthor) {
              console.log(`Found existing author: ${cleanAuthorName} (ID: ${existingAuthor.id})`);
              authorIds.push(existingAuthor.id)
            } else {
              console.log(`Creating new author: ${cleanAuthorName}`);
              const { data: newAuthor, error: authorError } = await supabase
                .from("authors")
                .insert({ name: cleanAuthorName })
                .select("id")
                .single()

              if (authorError) {
                console.error(`Error creating author "${cleanAuthorName}":`, authorError)
                result.errors++
                result.errorDetails?.push(`Failed to create author "${cleanAuthorName}" for book ${book.title}: ${authorError.message}`)
              } else if (newAuthor) {
                console.log(`Successfully created author: ${cleanAuthorName} (ID: ${newAuthor.id})`);
                authorIds.push(newAuthor.id)
              }
            }
          }
        } else {
          console.error(`❌ No valid authors found for book "${book.title}"`);
          console.error(`   - book.authors exists: ${!!book.authors}`);
          console.error(`   - book.authors is array: ${Array.isArray(book.authors)}`);
          console.error(`   - book.authors length: ${book.authors?.length}`);
          console.error(`   - book.authors value: ${JSON.stringify(book.authors)}`);
        }

        // Skip books without authors - don't create Unknown Author
        if (authorIds.length === 0) {
          result.errors++
          const errorMsg = `Skipping book "${book.title}": No valid authors found in ISBNdb data. Authors field: ${JSON.stringify(book.authors)}`;
          result.errorDetails?.push(errorMsg);
          console.error(errorMsg);
          continue;
        }

        console.log(`Final author IDs for "${book.title}":`, authorIds);

        // Upload cover image to Cloudinary and insert into images table
        let coverImageId: number | null = null;
        if (book.image) {
          const uploadRes = await cloudinary.uploader.upload(book.image, {
            folder: 'authorsinfo/bookcovers',
            transformation: [{ height: 900, crop: 'fit', format: 'webp' }],
          });
          // Use Book Cover entity type ID directly
          const entityTypeId = '9d91008f-4f24-4501-b18a-922e2cfd6d34';
          const { data: imageRow, error: imgErr } = await supabase
            .from('images')
            .insert({ 
              url: uploadRes.secure_url, 
              alt_text: book.title, 
              entity_type_id: entityTypeId,
              metadata: { entity_type: 'book', entity_id: null } // Will be updated when book is created
            })
            .select('id')
            .single();
          if (imageRow) {
            coverImageId = imageRow.id;
          } else {
            console.error('Failed to insert image for', book.title, imgErr);
          }
        }

        // Format publication date properly (outside try blocks so it can be reused)
        let publicationDate = null;
        if (book.date_published || book.publish_date) {
          const dateStr = book.date_published || book.publish_date;
          let formattedDate = null;
          
          if (dateStr && /^\d{4}$/.test(dateStr)) {
            // Year only: 2015 -> 2015-01-01
            formattedDate = `${dateStr}-01-01`;
          } else if (dateStr && /^\d{4}-\d{2}$/.test(dateStr)) {
            // Year-month: 2015-04 -> 2015-04-01
            formattedDate = `${dateStr}-01`;
          } else if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Full date: keep as is
            formattedDate = dateStr;
          } else {
            // Invalid format: set to null
            console.warn(`Invalid date format: ${dateStr}, setting to null`);
            formattedDate = null;
          }
          
          // Check if date is in the future
          if (formattedDate) {
            const pubDate = new Date(formattedDate);
            const today = new Date();
            if (pubDate > today) {
              console.warn(`Future publication date: ${formattedDate}, setting to null`);
              publicationDate = null;
            } else {
              publicationDate = formattedDate;
            }
          }
        }

        // Properly handle ISBN10 vs ISBN13 (before any insertion attempts)
        // Properly handle ISBN10 vs ISBN13 using utility function
        const { extractISBNs: extractISBNs2 } = await import('@/utils/isbnUtils');
        const { isbn10, isbn13 } = extractISBNs2({
          isbn: book.isbn,
          isbn13: book.isbn13,
        });

        // Use a transaction-like approach: try to insert book and authors in rapid succession
        console.log(`Attempting to insert book "${book.title}" with immediate author linking`);
        
        let newBookId: string | null = null;
        let success = false;

        // Try with description first
        try {
          console.log(`Attempting book insert with authorIds:`, authorIds);
          console.log(`Primary author ID (authorIds[0]):`, authorIds[0]);

          const bookData = {
            title: book.title,
            title_long: book.title_long || null,
            // Removed 'description' field as it doesn't exist in schema
            synopsis: book.synopsis || null,
            overview: book.overview || null,
            isbn10: isbn10,
            isbn13: isbn13,
            publisher_id: publisherId,
            publication_date: publicationDate,
            language: book.language || null,
            pages: book.pages || null,
            binding: book.binding || null,
            edition: book.edition || null,
            dimensions: book.dimensions || null,
            weight: book.dimensions_structured?.weight?.value || null,
            list_price: book.msrp || null,
            binding_type_id: bindingTypeId,
            format_type_id: formatTypeId,
            cover_image_id: coverImageId,
            author: book.authors?.[0] || 'Unknown Author', // Set primary author (trigger will sync with author_id)
            author_id: authorIds[0] || null, // Set the primary author ID
          };
          
          console.log(`Book data being inserted:`, bookData);
          
          const { data: newBook, error: bookError } = await supabase
            .from('books')
            .insert(bookData)
            .select('id')
            .single();

          if (bookError) {
            console.error(`Book insert error:`, bookError);
            throw bookError;
          }

          if (newBook?.id) {
            newBookId = newBook.id;
            console.log(`Book inserted successfully with description, ID: ${newBookId}`);
            
            // Immediately link all authors to the book
            let linkedCount = 0;
            for (let i = 0; i < authorIds.length; i++) {
              const authId = authorIds[i];
              try {
                const { error: linkError } = await supabase
                  .from('book_authors')
                  .upsert(
                    { book_id: newBookId, author_id: authId },
                    { onConflict: 'book_id,author_id' }
                  );
                
                if (linkError) {
                  // If upsert fails (e.g., no unique constraint), try regular insert
                  const { error: insertError } = await supabase
                    .from('book_authors')
                    .insert({ book_id: newBookId, author_id: authId });
                  
                  if (insertError) {
                    console.warn(`Failed to link author ${authId} to book "${book.title}":`, insertError);
                    result.errorDetails?.push(`Failed to link author to book "${book.title}": ${insertError.message}`);
                  } else {
                    linkedCount++;
                  }
                } else {
                  linkedCount++;
                }
              } catch (error) {
                console.warn(`Error linking author ${authId} to book "${book.title}":`, error);
                result.errorDetails?.push(`Error linking author to book "${book.title}": ${error}`);
              }
            }
            console.log(`Successfully linked ${linkedCount}/${authorIds.length} authors to book "${book.title}"`);
            success = true;
          }
        } catch (error) {
          console.error(`Book insert with description failed:`, error);
          console.log(`Trying without description...`);
        }

        // If that failed, try without description
        if (!success) {
          try {
            console.log(`Attempting book insert without description, authorIds:`, authorIds);
            
            const bookDataNoDesc = {
              title: book.title,
              title_long: book.title_long || null,
              synopsis: book.synopsis || null,
              overview: book.overview || null,
              isbn10: isbn10, // Use the same ISBN logic
              isbn13: isbn13, // Use the same ISBN logic
              publisher_id: publisherId,
              publication_date: publicationDate, // Use the same formatted date
              language: book.language || null,
              pages: book.pages || null,
              binding: book.binding || null,
              edition: book.edition || null,
              dimensions: book.dimensions || null,
              weight: book.dimensions_structured?.weight?.value || null,
              list_price: book.msrp || null,
              binding_type_id: bindingTypeId,
              format_type_id: formatTypeId,
              cover_image_id: coverImageId,
              author: book.authors?.[0] || 'Unknown Author', // Set primary author (trigger will sync with author_id)
              author_id: authorIds[0] || null, // Set the primary author ID
            };
            
            console.log(`Book data (no description) being inserted:`, bookDataNoDesc);
            
            const { data: newBook, error: bookError } = await supabase
              .from('books')
              .insert(bookDataNoDesc)
              .select('id')
              .single();

            if (bookError) {
              console.error(`Book insert error (no description):`, bookError);
              throw bookError;
            }

            if (newBook?.id) {
              newBookId = newBook.id;
              console.log(`Book inserted successfully without description, ID: ${newBookId}`);
              
              // Immediately link authors
              const linkPromises = authorIds.map(authId => 
                supabase.from('book_authors').insert({ book_id: newBookId, author_id: authId })
              );
              await Promise.all(linkPromises);
              console.log(`Successfully linked ${authorIds.length} authors`);
              success = true;
            }
          } catch (error) {
            console.error(`Both book insertion attempts failed:`, error);
          }
        }

        if (success && newBookId) {
          result.added++;
          console.log(`Successfully processed book "${book.title}"`);

          // Link subjects for this book
          if (book.subjects && book.subjects.length) {
            for (const subjectName of book.subjects) {
              // Find or create subject
              const { data: existingSub } = await supabase
                .from("subjects")
                .select("id")
                .eq("name", subjectName)
                .maybeSingle();
              let subjectId = existingSub?.id;
              if (!subjectId) {
                const { data: newSub, error: subError } = await supabase
                  .from("subjects")
                  .insert({ name: subjectName })
                  .select("id")
                  .single();
                if (newSub) subjectId = newSub.id;
              }
              if (subjectId) {
                // Upsert into book_subjects to avoid duplicates
                await supabase
                  .from("book_subjects")
                  .upsert({ book_id: newBookId, subject_id: subjectId });
              }
            }
          }
        } else {
          result.errors++;
          const errorMsg = `Failed to insert book ${book.title}: Book insertion failed - check logs for details`;
          result.errorDetails?.push(errorMsg);
          result.logs?.push(errorMsg);
          console.error(errorMsg);
        }
      } catch (error) {
        result.errors++
        result.errorDetails?.push(`Error processing book ${book.title}: ${error}`)
      }
    }

    // Revalidate the books page to show new additions
    revalidatePath("/books")

    return result
  } catch (error) {
    console.error("Bulk import error:", error)
    result.errors++
    result.errorDetails?.push(`General error: ${error}`)
    return result
  }
}

// Static importNewestBooks: load JSON, dedupe, log batches, and process
export async function importNewestBooks(): Promise<ImportResult> {
  const supabase = supabaseAdmin;
  const result: ImportResult = { added: 0, duplicates: 0, errors: 0, errorDetails: [], logs: [] };

  try {
    // Since new_books.json doesn't exist, return early with a message
    console.log('new_books.json not found, skipping static import');
    result.logs?.push('new_books.json not found, skipping static import');
    return result;
  } catch (error) {
    console.error('Error in importNewestBooks:', error);
    result.errors++;
    result.errorDetails?.push(`Error in importNewestBooks: ${error}`);
    return result;
  }
}