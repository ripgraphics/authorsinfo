"use server"

import { createServerActionClientAsync } from "@/lib/supabase/client-helper"
import { getBooksByAuthor, getBooksByPublisher, getFullBookDetailsByISBNs } from "@/lib/isbndb"
import { revalidatePath } from "next/cache"
import { checkForDuplicates } from "./bulk-import-books"

interface ImportResult {
  added: number
  duplicates: number
  errors: number
  errorDetails?: string[]
}

export async function getDbAuthors() {
  const supabase = await createServerActionClientAsync()

  const { data, error } = await supabase.from("authors").select("id, name").order("name")

  if (error) {
    console.error("Error fetching authors:", error)
    return []
  }

  return data || []
}

export async function getDbPublishers() {
  const supabase = await createServerActionClientAsync()

  const { data, error } = await supabase.from("publishers").select("id, name").order("name")

  if (error) {
    console.error("Error fetching publishers:", error)
    return []
  }

  return data || []
}

export async function getBooksByAuthorName(
  authorName: string,
  page = 1,
): Promise<{
  books: any[]
  isbns: string[]
}> {
  try {
    const books = await getBooksByAuthor(authorName, page, 100)

    // Extract ISBNs
    const isbns = books.map((book) => book.isbn13 || book.isbn).filter(Boolean)

    return { books, isbns }
  } catch (error) {
    console.error("Error fetching books by author:", error)
    return { books: [], isbns: [] }
  }
}

export async function getBooksByPublisherName(
  publisherName: string,
  page = 1,
): Promise<{
  books: any[]
  isbns: string[]
}> {
  try {
    // First get the list of ISBNs
    const bookRefs = await getBooksByPublisher(publisherName, page, 100)

    // Extract ISBNs
    const isbns = bookRefs.map((book) => book.isbn).filter(Boolean)

    // Get full book details
    const books = await getFullBookDetailsByISBNs(isbns)

    return { books, isbns }
  } catch (error) {
    console.error("Error fetching books by publisher:", error)
    return { books: [], isbns: [] }
  }
}

export async function importBooksByEntity(
  entityType: "author" | "publisher",
  entityName: string,
  isbns: string[],
): Promise<ImportResult> {
  const supabase = await createServerActionClientAsync()
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
      return result // No new books to add
    }

    // Fetch book details from ISBNdb
    const books = await getFullBookDetailsByISBNs(newIsbns)

    if (books.length === 0) {
      result.errors++
      result.errorDetails?.push("No books found in ISBNdb")
      return result
    }

    // Process each book
    for (const book of books) {
      try {
        // Find or create the entity (author or publisher) if it doesn't exist
        let entityId = null

        if (entityType === "publisher" && book.publisher) {
          // Find or create publisher
          const { data: existingPublisher } = await supabase
            .from("publishers")
            .select("id")
            .eq("name", book.publisher)
            .maybeSingle()

          if (existingPublisher) {
            entityId = (existingPublisher as any).id
          } else {
            const { data: newPublisher, error: publisherError } = await supabase
              .from("publishers")
              .insert({ name: book.publisher } as any)
              .select("id")
              .single()

            if (publisherError) {
              console.error("Error creating publisher:", publisherError)
            } else {
              entityId = newPublisher.id
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
              authorIds.push((existingAuthor as any).id)
            } else {
              const { data: newAuthor, error: authorError } = await supabase
                .from("authors")
                .insert({ name: authorName } as any)
                .select("id")
                .single()

              if (authorError) {
                console.error("Error creating author:", authorError)
              } else if (newAuthor) {
                authorIds.push((newAuthor as any).id)
              }
            }
          }
        }

        // Insert the book
        const { error: bookError } = await supabase.from("books").insert({
          title: book.title,
          isbn: book.isbn,
          isbn13: book.isbn13,
          publisher_id: entityType === "publisher" ? entityId : null,
          publish_date: book.publish_date,
          synopsis: book.synopsis,
          original_image_url: book.image,
          page_count: book.pages,
          language: book.language,
          format: book.binding,
          // Use the first author as the main author_id or the specified author if importing by author
          author_id: entityType === "author" ? authorIds[0] : authorIds.length > 0 ? authorIds[0] : null,
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
    console.error("Import error:", error)
    result.errors++
    result.errorDetails?.push(`General error: ${error}`)
    return result
  }
}
