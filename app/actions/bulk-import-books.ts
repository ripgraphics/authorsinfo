"use server"

import { supabaseAdmin } from '@/lib/supabase/server'
import { getBulkBooks } from '@/lib/isbndb'
import { revalidatePath } from "next/cache"
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import newBooksData from '../../new_books.json';

interface ImportResult {
  added: number
  duplicates: number
  errors: number
  errorDetails?: string[]
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
  existingBooks?.forEach((book) => {
    if (book.isbn10) existingIsbns.add(book.isbn10)
    if (book.isbn13) existingIsbns.add(book.isbn13)
  })

  // Filter out duplicates
  const duplicates = isbns.filter((isbn) => existingIsbns.has(isbn))
  const newIsbns = isbns.filter((isbn) => !existingIsbns.has(isbn))

  return { duplicates, newIsbns, error: null }
}

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

        // Find or create authors
        const authorIds: string[] = []
        if (book.authors && book.authors.length > 0) {
          for (const authorName of book.authors) {
            const { data: existingAuthor } = await supabase
              .from("authors")
              .select("id")
              .eq("name", authorName)
              .maybeSingle()

            if (existingAuthor) {
              authorIds.push(existingAuthor.id)
            } else {
              const { data: newAuthor, error: authorError } = await supabase
                .from("authors")
                .insert({ name: authorName })
                .select("id")
                .single()

              if (authorError) {
                console.error("Error creating author:", authorError)
              } else if (newAuthor) {
                authorIds.push(newAuthor.id)
              }
            }
          }
        }

        // Upload cover image to Cloudinary and insert into images table
        let coverImageId: number | null = null;
        if (book.image) {
          const uploadRes = await cloudinary.uploader.upload(book.image, {
            folder: 'authorsinfo/bookcovers',
            transformation: [{ width: 300, height: 600, crop: 'limit' }],
          });
          const { data: imgTypeRow } = await supabase
            .from('image_types')
            .select('id')
            .eq('name', 'cover')
            .maybeSingle();
          const imgTypeId = imgTypeRow?.id ?? null;
          const { data: imageRow, error: imgErr } = await supabase
            .from('images')
            .insert({ url: uploadRes.secure_url, alt_text: book.title, img_type_id: imgTypeId })
            .select('id')
            .single();
          if (imageRow) {
            coverImageId = imageRow.id;
          } else {
            console.error('Failed to insert image for', book.title, imgErr);
          }
        }

        // Insert the book and retrieve its new ID
        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            title: book.title,
            isbn10: book.isbn,
            isbn13: book.isbn13,
            publisher_id: publisherId,
            publication_date: book.publish_date,
            synopsis: book.synopsis,
            original_image_url: book.image,
            cover_image_id: coverImageId,
            pages: book.pages,
            language: book.language,
            binding: book.binding,
            // Use the first author as the main author_id
            author_id: authorIds.length > 0 ? authorIds[0] : null,
          })
          .select('id')
          .single();

        if (bookError) {
          result.errors++
          result.errorDetails?.push(`Error adding book ${book.title}: ${bookError.message}`)
        } else if (newBook?.id) {
          result.added++

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
                  .upsert({ book_id: newBook.id, subject_id: subjectId });
              }
            }
          }
          // Link all authors for this book
          if (authorIds.length > 0) {
            for (const authId of authorIds) {
              await supabase
                .from('book_authors')
                .upsert({ book_id: newBook.id, author_id: authId });
            }
          }
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

  const jsonData = newBooksData;
  const allBooks = Array.isArray(jsonData.books) ? jsonData.books : [];
  console.log(`Loaded ${allBooks.length} books from new_books.json`);
  result.logs?.push(`Loaded ${allBooks.length} books from new_books.json`);
  if (!allBooks.length) {
    result.errors++;
    result.errorDetails?.push('new_books.json contains no books');
    result.logs?.push('No books found in new_books.json');
    return result;
  }

  // Gather ISBNs and check duplicates
  const isbns = allBooks.map((b: any) => b.isbn10 || b.isbn).filter(Boolean);
  console.log(`Checking ${isbns.length} ISBNs for duplicates...`);
  result.logs?.push(`Checking ${isbns.length} ISBNs for duplicates...`);
  const { duplicates, newIsbns, error } = await checkForDuplicates(isbns);
  if (error) {
    console.error('Error checking duplicates:', error);
    result.errors++;
    result.errorDetails?.push(`Error checking duplicates: ${error}`);
    result.logs?.push(`Error checking duplicates: ${error}`);
    return result;
  }
  result.duplicates = duplicates.length;
  console.log(`Found ${duplicates.length} duplicates, ${newIsbns.length} new books to import.`);
  result.logs?.push(`Found ${duplicates.length} duplicates, ${newIsbns.length} new books to import.`);

  // Update existing duplicate books with extended metadata
  for (const isbn of duplicates) {
    const dataItem = allBooks.find((b: any) => b.isbn10 === isbn || b.isbn === isbn || b.isbn13 === isbn);
    if (!dataItem) continue;
    result.logs?.push(`Updating existing book with ISBN ${isbn}`);
    const updateData: any = {
      title_long: dataItem.title_long,
      overview: dataItem.synopsis,
      dimensions: dataItem.dimensions,
      weight: dataItem.dimensions_structured?.weight?.value,
      edition: dataItem.edition,
      list_price: dataItem.msrp,
      language: dataItem.language,
      pages: dataItem.pages,
      binding: dataItem.binding,
      original_image_url: dataItem.image_original || dataItem.image,
    };
    const { error: updateErr } = await supabase
      .from('books')
      .update(updateData)
      .or(`isbn10.eq.${isbn},isbn13.eq.${isbn}`);
    if (updateErr) {
      result.errors++;
      result.errorDetails?.push(`Error updating book ${dataItem.title}: ${updateErr.message}`);
      result.logs?.push(`Error updating book ${dataItem.title}: ${updateErr.message}`);
    } else {
      result.logs?.push(`Book updated: ${dataItem.title} (ISBN ${isbn})`);
    }
  }

  const newBooks = allBooks.filter((b: any) => newIsbns.includes(b.isbn10 || b.isbn));
  console.log('New book titles:', newBooks.map((b: any) => b.title).join(', '));
  result.logs?.push(`New book titles: ${newBooks.map((b: any) => b.title).join(', ')}`);

  let processedCount = 0;
  for (const book of newBooks) {
    processedCount++;
    console.log(`Processing (${processedCount}/${newBooks.length}): ${book.title}`);
    result.logs?.push(`Processing (${processedCount}/${newBooks.length}): ${book.title}`);
    try {
      // Find or create publisher
      let publisherId: number | null = null;
      if (book.publisher) {
        const { data: existingPub } = await supabase
          .from('publishers')
          .select('id')
          .eq('name', book.publisher)
          .maybeSingle();
        if (existingPub) {
          publisherId = existingPub.id;
        } else {
          const { data: newPub, error: pubErr } = await supabase
            .from('publishers')
            .insert({ name: book.publisher })
            .select('id')
            .single();
          if (!pubErr && newPub) publisherId = newPub.id;
        }
      }

      // Find or create authors
      const authorIds: number[] = [];
      if (Array.isArray(book.authors)) {
        for (const authorName of book.authors) {
          const { data: existingAuth } = await supabase
            .from('authors')
            .select('id')
            .eq('name', authorName)
            .maybeSingle();
          if (existingAuth) {
            authorIds.push(existingAuth.id);
          } else {
            const { data: newAuth, error: authErr } = await supabase
              .from('authors')
              .insert({ name: authorName })
              .select('id')
              .single();
            if (!authErr && newAuth) authorIds.push(newAuth.id);
          }
        }
      }

      // Upload cover image
      let coverImageId: number | null = null;
      const imageUrl = book.image_original || book.image;
      if (imageUrl) {
        const uploadRes = await cloudinary.uploader.upload(imageUrl, {
          folder: 'authorsinfo/bookcovers',
          transformation: [{ width: 300, height: 600, crop: 'limit' }],
        });
        const { data: imgTypeRow } = await supabase
          .from('image_types')
          .select('id')
          .eq('name', 'cover')
          .maybeSingle();
        const imgTypeId = imgTypeRow?.id ?? null;
        const { data: imageRow, error: imgErr } = await supabase
          .from('images')
          .insert({ url: uploadRes.secure_url, alt_text: book.title, img_type_id: imgTypeId })
          .select('id')
          .single();
        if (imageRow) coverImageId = imageRow.id;
      }

      // Insert book record with extended data
      const { data: newBookRec, error: bookErr } = await supabase
        .from('books')
        .insert({
          title: book.title,
          title_long: book.title_long,
          isbn10: book.isbn10 || book.isbn,
          isbn13: book.isbn13,
          publisher_id: publisherId,
          publication_date: book.date_published,
          synopsis: book.synopsis,
          overview: book.synopsis,
          dimensions: book.dimensions,
          weight: book.dimensions_structured?.weight?.value,
          edition: book.edition,
          list_price: book.msrp,
          language: book.language,
          pages: book.pages,
          binding: book.binding,
          original_image_url: imageUrl,
          cover_image_id: coverImageId,
          author_id: authorIds[0] || null,
        })
        .select('id')
        .single();
      if (bookErr) {
        result.errors++;
        result.errorDetails?.push(`Error adding book ${book.title}: ${bookErr.message}`);
        result.logs?.push(`Error adding book ${book.title}: ${bookErr.message}`);
      } else if (newBookRec?.id) {
        result.added++;
        result.logs?.push(`Book added: ${book.title} (ID: ${newBookRec.id})`);
        // Link subjects
        if (Array.isArray(book.subjects)) {
          for (const subjectName of book.subjects) {
            const { data: existingSub } = await supabase
              .from('subjects')
              .select('id')
              .eq('name', subjectName)
              .maybeSingle();
            let subjectId = existingSub?.id;
            if (!subjectId) {
              const { data: newSub } = await supabase
                .from('subjects')
                .insert({ name: subjectName })
                .select('id')
                .single();
              if (newSub) subjectId = newSub.id;
            }
            if (subjectId) {
              await supabase
                .from('book_subjects')
                .upsert({ book_id: newBookRec.id, subject_id: subjectId });
            }
          }
        }
        // Link authors
        for (const authId of authorIds) {
          await supabase
            .from('book_authors')
            .upsert({ book_id: newBookRec.id, author_id: authId });
        }
      }
    } catch (err) {
      result.errors++;
      result.errorDetails?.push(`Error processing book ${book.title}: ${(err as Error).message}`);
      result.logs?.push(`Error processing book ${book.title}: ${(err as Error).message}`);
    }
  }
  console.log(`Import complete. Added: ${result.added}, Duplicates: ${result.duplicates}, Errors: ${result.errors}`);
  result.logs?.push(`Import complete. Added: ${result.added}, Duplicates: ${result.duplicates}, Errors: ${result.errors}`);
  revalidatePath('/books');
  return result;
}