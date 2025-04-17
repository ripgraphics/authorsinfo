"use server"

import { createServerActionClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getBookByISBN } from "@/lib/isbndb"

async function getBooksWithoutAuthors(page = 1, pageSize = 20) {
  try {
    const supabase = createServerActionClient({ cookies })
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from("books")
      .select(
        `
       id, 
       title,
       isbn10,
       isbn13,
       cover_image:cover_image_id(id, url, alt_text)
     `,
        { count: "exact" },
      )
      .is("author_id", null)
      .range(from, to)

    if (error) {
      console.error("Error fetching books without authors:", error)
      return { books: [], count: 0, error: error.message }
    }

    return { books: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error in getBooksWithoutAuthors:", error)
    return { books: [], count: 0, error: String(error) }
  }
}

async function getAuthorBookStats() {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get count of books without authors
    const { count: booksWithoutAuthors, error: booksError } = await supabase
      .from("books")
      .select("*", { count: "exact" })
      .is("author_id", null)

    if (booksError) {
      console.error("Error counting books without authors:", booksError)
    }

    // Get count of authors without books
    const { data: authorsWithoutBooksData, error: authorsWithoutBooksError } = await supabase
      .from("authors")
      .select("id")
      .not(
        "id",
        "in",
        "(SELECT DISTINCT author_id FROM book_authors)", // Remove explicit casting
      )

    if (authorsWithoutBooksError) {
      console.error("Error counting authors without books:", authorsWithoutBooksError)
    }

    const authorsWithoutBooks = authorsWithoutBooksData ? authorsWithoutBooksData.length : 0

    // Get count of books with multiple authors using a raw SQL query
    const { data: multipleAuthorsData, error: multipleAuthorsError } = await supabase
      .from("book_authors")
      .select("book_id")
      .group("book_id", { count: "exact" })
      .gt("count", 1)

    const booksWithMultipleAuthors = multipleAuthorsData?.length || 0

    if (multipleAuthorsError) {
      console.error("Error counting books with multiple authors:", multipleAuthorsError)
    }

    // Get total counts
    const { count: totalBooks, error: totalBooksError } = await supabase.from("books").select("*", { count: "exact" })

    if (totalBooksError) {
      console.error("Error counting total books:", totalBooksError)
    }

    const { count: totalAuthors, error: totalAuthorsError } = await supabase
      .from("authors")
      .select("*", { count: "exact" })

    if (totalAuthorsError) {
      console.error("Error counting total authors:", totalAuthorsError)
    }

    return {
      booksWithoutAuthors: booksWithoutAuthors || 0,
      authorsWithoutBooks: authorsWithoutBooks || 0,
      booksWithMultipleAuthors: booksWithMultipleAuthors || 0,
      totalBooks: totalBooks || 0,
      totalAuthors: totalAuthors || 0,
      error: null,
    }
  } catch (error) {
    console.error("Error in getAuthorBookStats:", error)
    return {
      booksWithoutAuthors: 0,
      authorsWithoutBooks: 0,
      booksWithMultipleAuthors: 0,
      totalBooks: 0,
      totalAuthors: 0,
      error: String(error),
    }
  }
}

async function searchDatabaseAuthors(query: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase.from("authors").select("id, name").ilike("name", `%${query}%`).limit(10)

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

async function connectAuthorToBook(bookId: string, authorId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { error } = await supabase.from("book_authors").insert({ book_id: bookId, author_id: authorId })

    if (error) {
      console.error("Error connecting author to book:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in connectAuthorToBook:", error)
    return { success: false, error: String(error) }
  }
}

async function disconnectAuthorFromBook(bookId: string, authorId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { error } = await supabase.from("book_authors").delete().eq("book_id", bookId).eq("author_id", authorId)

    if (error) {
      console.error("Error disconnecting author from book:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/books/${bookId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in disconnectAuthorFromBook:", error)
    return { success: false, error: String(error) }
  }
}

async function createAuthor(authorData: { name: string; bio?: string }) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase.from("authors").insert(authorData).select().single()

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

async function getBookAuthorConnections(bookId: string) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase
      .from("book_authors")
      .select(`id, author_id, authors(name)`)
      .eq("book_id", bookId)

    if (error) {
      console.error("Error fetching book author connections:", error)
      return { connections: [], error: error.message }
    }

    const connections = data.map((item) => ({
      id: item.id,
      authorId: item.author_id,
      authorName: item.authors?.name || "Unknown Author",
    }))

    return { connections, error: null }
  } catch (error) {
    console.error("Error in getBookAuthorConnections:", error)
    return { connections: [], error: String(error) }
  }
}

async function lookupBookByISBN(isbn: string) {
  try {
    const book = await getBookByISBN(isbn)

    if (!book) {
      return { book: null, error: "Book not found" }
    }

    return { book, error: null }
  } catch (error) {
    console.error("Error in lookupBookByISBN:", error)
    return { book: null, error: String(error) }
  }
}

async function batchProcessBooksWithoutAuthors(batchSize: number) {
  try {
    const supabase = createServerActionClient({ cookies })

    // Get books without authors
    const { data: booksToProcess, error: booksError } = await supabase
      .from("books")
      .select("id, isbn13, isbn10")
      .is("author_id", null)
      .limit(batchSize)

    if (booksError) {
      console.error("Error fetching books without authors:", booksError)
      return { success: false, error: booksError.message, processed: 0, errors: [] }
    }

    let processed = 0
    const errors: string[] = []

    // Process each book
    for (const book of booksToProcess) {
      try {
        // Try to find author by ISBN
        let authorName = null

        if (book.isbn13) {
          const isbnData = await getBookByISBN(book.isbn13)
          authorName = isbnData?.authors?.[0]
        } else if (book.isbn10) {
          const isbnData = await getBookByISBN(book.isbn10)
          authorName = isbnData?.authors?.[0]
        }

        if (authorName) {
          // Check if author exists
          const { data: existingAuthor } = await supabase
            .from("authors")
            .select("id")
            .eq("name", authorName)
            .maybeSingle()

          let authorId = existingAuthor?.id

          // Create author if not exists
          if (!authorId) {
            const { data: newAuthor, error: authorError } = await supabase
              .from("authors")
              .insert({ name: authorName })
              .select("id")
              .single()

            if (authorError) {
              throw new Error(`Failed to create author: ${authorError.message}`)
            }

            authorId = newAuthor.id
          }

          // Connect author to book
          const { error: connectError } = await supabase.from("books").update({ author_id: authorId }).eq("id", book.id)

          if (connectError) {
            throw new Error(`Failed to connect author to book: ${connectError.message}`)
          }

          processed++
        }
      } catch (err) {
        console.error(`Error processing book ${book.id}:`, err)
        errors.push(`Book ${book.id}: ${String(err)}`)
      }
    }

    revalidatePath("/admin/book-author-connections")
    return { success: true, processed, errors }
  } catch (error) {
    console.error("Error in batchProcessBooksWithoutAuthors:", error)
    return { success: false, error: String(error), processed: 0, errors: [] }
  }
}

async function getBooksWithMultipleAuthors() {
  try {
    const supabase = createServerActionClient({ cookies })

    const { data, error } = await supabase.rpc("get_books_with_multiple_authors", {})

    if (error) {
      console.error("Error fetching books with multiple authors:", error)
      return { bookIds: [], error: error.message }
    }

    const bookIds = data.map((item) => item.book_id)

    return { bookIds, error: null }
  } catch (error) {
    console.error("Error in getBooksWithMultipleAuthors:", error)
    return { bookIds: [], error: String(error) }
  }
}

export {
  connectAuthorToBook,
  createAuthor,
  disconnectAuthorFromBook,
  getBookAuthorConnections,
  lookupBookByISBN,
  searchDatabaseAuthors,
  batchProcessBooksWithoutAuthors,
  getBooksWithoutAuthors,
  getAuthorBookStats,
  getBooksWithMultipleAuthors,
}
