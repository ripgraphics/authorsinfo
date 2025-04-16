"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { getBookByISBN } from "@/lib/isbndb"
import { revalidatePath } from "next/cache"

// Get books that don't have authors assigned
export async function getBooksWithoutAuthors(page = 1, pageSize = 20) {
  try {
    // Get books where author_id is null or not set
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // First get count
    const { count, error: countError } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact" })
      .is("author_id", null)

    if (countError) {
      console.error("Error counting books without authors:", countError)
      return { books: [], count: 0, error: countError.message }
    }

    // Then get the actual books with pagination
    const { data, error } = await supabaseAdmin
      .from("books")
      .select(`
        id, 
        title,
        isbn10,
        isbn13,
        cover_image:cover_image_id(id, url, alt_text)
      `)
      .is("author_id", null)
      .range(from, to)

    if (error) {
      console.error("Error fetching books without authors:", error)
      return { books: [], count: 0, error: error.message }
    }

    return {
      books: data || [],
      count: count || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error in getBooksWithoutAuthors:", error)
    return { books: [], count: 0, error: String(error) }
  }
}

// Search for authors in the database
export async function searchDatabaseAuthors(query: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select("id, name, bio")
      .ilike("name", `%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching authors:", error)
      return { authors: [], error: error.message }
    }

    return { authors: data || [], error: null }
  } catch (error) {
    console.error("Error in searchDatabaseAuthors:", error)
    return { authors: [], error: String(error) }
  }
}

// Get book-author connections
export async function getBookAuthorConnections(bookId: string) {
  try {
    // First check if the book_authors table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking for book_authors table:", tablesError)
      return { connections: [], error: tablesError.message }
    }

    const hasBookAuthorsTable = tables && tables.some((table: string) => table === "book_authors")

    if (hasBookAuthorsTable) {
      // Use the join table
      const { data, error } = await supabaseAdmin
        .from("book_authors")
        .select(`
          id,
          author:author_id(id, name)
        `)
        .eq("book_id", bookId)

      if (error) {
        console.error("Error fetching book-author connections:", error)
        return { connections: [], error: error.message }
      }

      return {
        connections:
          data.map((conn) => ({
            id: conn.id,
            authorId: conn.author.id,
            authorName: conn.author.name,
          })) || [],
        error: null,
      }
    } else {
      // Check if the book has a single author_id
      const { data, error } = await supabaseAdmin
        .from("books")
        .select(`
          id,
          author_id,
          author:author_id(id, name)
        `)
        .eq("id", bookId)
        .single()

      if (error) {
        console.error("Error fetching book author:", error)
        return { connections: [], error: error.message }
      }

      if (!data.author_id) {
        return { connections: [], error: null }
      }

      return {
        connections: [
          {
            id: `${bookId}_${data.author_id}`,
            authorId: data.author_id,
            authorName: data.author?.name || "Unknown Author",
          },
        ],
        error: null,
      }
    }
  } catch (error) {
    console.error("Error in getBookAuthorConnections:", error)
    return { connections: [], error: String(error) }
  }
}

// Connect author to book
export async function connectAuthorToBook(bookId: string, authorId: string) {
  try {
    // First check if the book_authors table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking for book_authors table:", tablesError)
      return { success: false, error: tablesError.message }
    }

    const hasBookAuthorsTable = tables && tables.some((table: string) => table === "book_authors")

    if (hasBookAuthorsTable) {
      // Use the join table
      // First check if the connection already exists
      const { data: existingConn } = await supabaseAdmin
        .from("book_authors")
        .select("id")
        .eq("book_id", bookId)
        .eq("author_id", authorId)
        .single()

      if (existingConn) {
        return { success: true, message: "Author already connected to this book" }
      }

      // Create the connection
      const { error } = await supabaseAdmin.from("book_authors").insert({ book_id: bookId, author_id: authorId })

      if (error) {
        console.error("Error connecting author to book:", error)
        return { success: false, error: error.message }
      }
    } else {
      // Update the book's author_id field
      const { error } = await supabaseAdmin.from("books").update({ author_id: authorId }).eq("id", bookId)

      if (error) {
        console.error("Error updating book author:", error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath("/admin/book-author-connections")
    return { success: true }
  } catch (error) {
    console.error("Error in connectAuthorToBook:", error)
    return { success: false, error: String(error) }
  }
}

// Disconnect author from book
export async function disconnectAuthorFromBook(bookId: string, authorId: string) {
  try {
    // First check if the book_authors table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc("get_tables")

    if (tablesError) {
      console.error("Error checking for book_authors table:", tablesError)
      return { success: false, error: tablesError.message }
    }

    const hasBookAuthorsTable = tables && tables.some((table: string) => table === "book_authors")

    if (hasBookAuthorsTable) {
      // Use the join table
      const { error } = await supabaseAdmin
        .from("book_authors")
        .delete()
        .eq("book_id", bookId)
        .eq("author_id", authorId)

      if (error) {
        console.error("Error disconnecting author from book:", error)
        return { success: false, error: error.message }
      }
    } else {
      // Update the book's author_id field to null
      const { error } = await supabaseAdmin
        .from("books")
        .update({ author_id: null })
        .eq("id", bookId)
        .eq("author_id", authorId)

      if (error) {
        console.error("Error removing book author:", error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath("/admin/book-author-connections")
    return { success: true }
  } catch (error) {
    console.error("Error in disconnectAuthorFromBook:", error)
    return { success: false, error: String(error) }
  }
}

// Look up book by ISBN in ISBNDB
export async function lookupBookByISBN(isbn: string) {
  try {
    const book = await getBookByISBN(isbn)

    if (!book) {
      return { book: null, error: "Book not found in ISBNDB" }
    }

    return { book, error: null }
  } catch (error) {
    console.error("Error looking up book by ISBN:", error)
    return { book: null, error: String(error) }
  }
}

// Create a new author
export async function createAuthor(authorData: { name: string; bio?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from("authors")
      .insert({
        name: authorData.name,
        bio: authorData.bio || null,
      })
      .select("id, name")
      .single()

    if (error) {
      console.error("Error creating author:", error)
      return { author: null, error: error.message }
    }

    revalidatePath("/admin/book-author-connections")
    return { author: data, error: null }
  } catch (error) {
    console.error("Error in createAuthor:", error)
    return { author: null, error: String(error) }
  }
}

// Batch process books without authors
export async function batchProcessBooksWithoutAuthors(limit = 20) {
  try {
    // Get books without authors that have ISBN information
    const { data: books, error } = await supabaseAdmin
      .from("books")
      .select("id, isbn13, isbn10, title")
      .is("author_id", null)
      .limit(limit)

    if (error) {
      console.error("Error fetching books for batch processing:", error)
      return { processed: 0, success: false, error: error.message }
    }

    if (!books || books.length === 0) {
      return { processed: 0, success: true, message: "No books to process" }
    }

    let processedCount = 0
    const errors = []

    // Process each book with a delay between requests to avoid rate limiting
    for (const book of books) {
      try {
        // Try to use ISBN13 first, then ISBN10
        const isbn = book.isbn13 || book.isbn10

        if (!isbn) {
          errors.push(`Book ${book.id} (${book.title}) has no ISBN`)
          continue
        }

        // Look up book in ISBNDB with retry logic
        const isbndbBook = await getBookByISBN(isbn, 3, 2000) // 3 retries, starting with 2 second delay

        if (!isbndbBook || !isbndbBook.authors || isbndbBook.authors.length === 0) {
          errors.push(`No author information found for book ${book.id} (${book.title}, ISBN: ${isbn})`)
          continue
        }

        // Check if we have a book_authors join table
        const { data: tables } = await supabaseAdmin.rpc("get_tables")
        const hasBookAuthorsTable = tables && tables.some((table: string) => table === "book_authors")

        // Process each author
        for (const authorName of isbndbBook.authors) {
          // Search for author in database
          const { data: existingAuthors } = await supabaseAdmin
            .from("authors")
            .select("id, name")
            .ilike("name", authorName)
            .limit(1)

          let authorId

          if (existingAuthors && existingAuthors.length > 0) {
            // Use existing author
            authorId = existingAuthors[0].id
          } else {
            // Create new author
            const { data: newAuthor, error: createError } = await supabaseAdmin
              .from("authors")
              .insert({ name: authorName })
              .select("id")
              .single()

            if (createError) {
              errors.push(`Error creating author ${authorName} for book ${book.title}: ${createError.message}`)
              continue
            }

            authorId = newAuthor.id
          }

          // Connect author to book
          if (hasBookAuthorsTable) {
            // Use join table
            const { error: connError } = await supabaseAdmin
              .from("book_authors")
              .insert({ book_id: book.id, author_id: authorId })

            if (connError) {
              errors.push(`Error connecting author ${authorName} to book ${book.title}: ${connError.message}`)
              continue
            }
          } else {
            // Use direct author_id field (only for the first author)
            const { error: updateError } = await supabaseAdmin
              .from("books")
              .update({ author_id: authorId })
              .eq("id", book.id)

            if (updateError) {
              errors.push(`Error updating book ${book.title} with author ${authorName}: ${updateError.message}`)
              continue
            }
          }
        }

        processedCount++

        // Add a significant delay between books to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 3000))
      } catch (bookError) {
        errors.push(`Error processing book ${book.id} (${book.title}): ${String(bookError)}`)
      }
    }

    revalidatePath("/admin/book-author-connections")

    return {
      processed: processedCount,
      success: true,
      errors: errors.length > 0 ? errors : null,
    }
  } catch (error) {
    console.error("Error in batchProcessBooksWithoutAuthors:", error)
    return { processed: 0, success: false, error: String(error) }
  }
}

// Add this new function to get statistics
export async function getAuthorBookStats() {
  try {
    // Get count of books without authors
    const { count: booksWithoutAuthors, error: booksError } = await supabaseAdmin
      .from("books")
      .select("id", { count: "exact" })
      .is("author_id", null)

    if (booksError) {
      console.error("Error counting books without authors:", booksError)
      return {
        booksWithoutAuthors: 0,
        authorsWithoutBooks: 0,
        totalBooks: 0,
        totalAuthors: 0,
        error: booksError.message,
      }
    }

    // Get count of authors without books
    // First check if book_authors table exists
    const { data: tables } = await supabaseAdmin.rpc("get_tables")
    const hasBookAuthorsTable = tables && tables.some((table: string) => table === "book_authors")

    let authorsWithoutBooks = 0

    if (hasBookAuthorsTable) {
      // Using the join table approach
      const { count, error } = await supabaseAdmin
        .from("authors")
        .select("id", { count: "exact" })
        .not("id", "in", supabaseAdmin.from("book_authors").select("author_id"))

      if (!error) {
        authorsWithoutBooks = count || 0
      }
    } else {
      // Using the direct author_id approach
      const { count, error } = await supabaseAdmin
        .from("authors")
        .select("id", { count: "exact" })
        .not("id", "in", supabaseAdmin.from("books").select("author_id"))

      if (!error) {
        authorsWithoutBooks = count || 0
      }
    }

    // Get total counts
    const { count: totalBooks } = await supabaseAdmin.from("books").select("id", { count: "exact" })

    const { count: totalAuthors } = await supabaseAdmin.from("authors").select("id", { count: "exact" })

    return {
      booksWithoutAuthors: booksWithoutAuthors || 0,
      authorsWithoutBooks: authorsWithoutBooks || 0,
      totalBooks: totalBooks || 0,
      totalAuthors: totalAuthors || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error getting author-book stats:", error)
    return {
      booksWithoutAuthors: 0,
      authorsWithoutBooks: 0,
      totalBooks: 0,
      totalAuthors: 0,
      error: String(error),
    }
  }
}
