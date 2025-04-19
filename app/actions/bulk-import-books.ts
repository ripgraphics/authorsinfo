"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getBulkBooks } from "@/lib/isbndb"
import { revalidatePath } from "next/cache"

interface ImportResult {
  added: number
  duplicates: number
  errors: number
  errorDetails?: string[]
}

export async function checkForDuplicates(isbns: string[]) {
  const supabase = createServerActionClient({ cookies })

  // Check for existing ISBNs
  const { data: existingBooks, error } = await supabase
    .from("books")
    .select("isbn, isbn13")
    .or(`isbn.in.(${isbns.join(",")}),isbn13.in.(${isbns.join(",")})`)

  if (error) {
    console.error("Error checking for duplicates:", error)
    return { duplicates: [], error: error.message }
  }

  // Create a set of existing ISBNs (both ISBN-10 and ISBN-13)
  const existingIsbns = new Set<string>()
  existingBooks?.forEach((book) => {
    if (book.isbn) existingIsbns.add(book.isbn)
    if (book.isbn13) existingIsbns.add(book.isbn13)
  })

  // Filter out duplicates
  const duplicates = isbns.filter((isbn) => existingIsbns.has(isbn))
  const newIsbns = isbns.filter((isbn) => !existingIsbns.has(isbn))

  return { duplicates, newIsbns, error: null }
}

export async function bulkImportBooks(isbns: string[]): Promise<ImportResult> {
  const supabase = createServerActionClient({ cookies })
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

    if (newIsbns.length === 0) {
      return result // No new books to add
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

        // Insert the book
        const { error: bookError } = await supabase.from("books").insert({
          title: book.title,
          isbn: book.isbn,
          isbn13: book.isbn13,
          publisher_id: publisherId,
          publish_date: book.publish_date,
          synopsis: book.synopsis,
          original_image_url: book.image,
          page_count: book.pages,
          language: book.language,
          format: book.binding,
          // Use the first author as the main author_id
          author_id: authorIds.length > 0 ? authorIds[0] : null,
        })

        if (bookError) {
          result.errors++
          result.errorDetails?.push(`Error adding book ${book.title}: ${bookError.message}`)
        } else {
          result.added++

          // If we have multiple authors, create book_authors relationships
          if (authorIds.length > 1) {
            // This would require a book_authors junction table
            // Implementation depends on your database schema
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
