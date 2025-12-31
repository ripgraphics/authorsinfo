'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { getBookByISBN } from '@/lib/isbndb'
import { revalidatePath } from 'next/cache'

interface BookAuthorConnection {
  id: number
  author: {
    id: number
    name: string
  }[]
}

interface BookWithAuthor {
  id: number
  author_id: string | null // UUID
  author: {
    id: string // UUID
    name: string
  }[]
}

// Get books that don't have authors assigned
export async function getBooksWithoutAuthors(page = 1, pageSize = 20) {
  try {
    // Get books where author_id is null or not set
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // First get count
    const { count, error: countError } = await supabaseAdmin
      .from('books')
      .select('id', { count: 'exact' })
      .is('author_id', null)

    if (countError) {
      console.error('Error counting books without authors:', countError)
      return { books: [], count: 0, error: countError.message }
    }

    // Then get the actual books with pagination
    const { data, error } = await supabaseAdmin
      .from('books')
      .select(
        `
        id, 
        title,
        isbn10,
        isbn13,
        cover_image:cover_image_id(id, url, alt_text)
      `
      )
      .is('author_id', null)
      .range(from, to)

    if (error) {
      console.error('Error fetching books without authors:', error)
      return { books: [], count: 0, error: error.message }
    }

    return {
      books: data || [],
      count: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('Error in getBooksWithoutAuthors:', error)
    return { books: [], count: 0, error: String(error) }
  }
}

// Search for authors in the database
export async function searchDatabaseAuthors(query: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('authors')
      .select('id, name, bio')
      .ilike('name', `%${query}%`)
      .limit(10)

    if (error) {
      console.error('Error searching authors:', error)
      return { authors: [], error: error.message }
    }

    return { authors: data || [], error: null }
  } catch (error) {
    console.error('Error in searchDatabaseAuthors:', error)
    return { authors: [], error: String(error) }
  }
}

// Get book-author connections
export async function getBookAuthorConnections(bookId: string) {
  try {
    // Use the book_authors join table
    const { data: joinTableData, error: joinTableError } = await supabaseAdmin
      .from('book_authors')
      .select(
        `
        id,
        author:author_id(id, name)
      `
      )
      .eq('book_id', bookId)

    if (!joinTableError && joinTableData) {
      return {
        connections: (joinTableData as BookAuthorConnection[]).map((conn) => ({
          id: conn.id,
          authorId: conn.author[0]?.id,
          authorName: conn.author[0]?.name || 'Unknown Author',
        })),
        error: null,
      }
    }

    // If that fails, try the single author_id approach
    const { data, error } = await supabaseAdmin
      .from('books')
      .select(
        `
        id,
        author_id,
        author:author_id(id, name)
      `
      )
      .eq('id', bookId)
      .single()

    if (error) {
      console.error('Error fetching book author:', error)
      return { connections: [], error: error.message }
    }

    if (!data.author_id) {
      return { connections: [], error: null }
    }

    const bookData = data as BookWithAuthor

    return {
      connections: [
        {
          id: `${bookId}_${bookData.author_id}`,
          authorId: bookData.author_id,
          authorName: bookData.author[0]?.name || 'Unknown Author',
        },
      ],
      error: null,
    }
  } catch (error) {
    console.error('Error in getBookAuthorConnections:', error)
    return { connections: [], error: String(error) }
  }
}

// Connect author to book
export async function connectAuthorToBook(bookId: string, authorId: string) {
  try {
    // First check if the book_authors table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_tables')

    if (tablesError) {
      console.error('Error checking for book_authors table:', tablesError)
      return { success: false, error: tablesError.message }
    }

    const hasBookAuthorsTable = tables && tables.some((table: string) => table === 'book_authors')

    if (hasBookAuthorsTable) {
      // Use the join table
      // First check if the connection already exists
      const { data: existingConn } = await supabaseAdmin
        .from('book_authors')
        .select('id')
        .eq('book_id', bookId)
        .eq('author_id', authorId)
        .single()

      if (existingConn) {
        return { success: true, message: 'Author already connected to this book' }
      }

      // Create the connection
      const { error } = await supabaseAdmin
        .from('book_authors')
        .insert({ book_id: bookId, author_id: authorId })

      if (error) {
        console.error('Error connecting author to book:', error)
        return { success: false, error: error.message }
      }
    } else {
      // Update the book's author_id field
      const { error } = await supabaseAdmin
        .from('books')
        .update({ author_id: authorId })
        .eq('id', bookId)

      if (error) {
        console.error('Error updating book author:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/admin/book-author-connections')
    return { success: true }
  } catch (error) {
    console.error('Error in connectAuthorToBook:', error)
    return { success: false, error: String(error) }
  }
}

// Disconnect author from book
export async function disconnectAuthorFromBook(bookId: string, authorId: string) {
  try {
    // First check if the book_authors table exists
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('get_tables')

    if (tablesError) {
      console.error('Error checking for book_authors table:', tablesError)
      return { success: false, error: tablesError.message }
    }

    const hasBookAuthorsTable = tables && tables.some((table: string) => table === 'book_authors')

    if (hasBookAuthorsTable) {
      // Use the join table
      const { error } = await supabaseAdmin
        .from('book_authors')
        .delete()
        .eq('book_id', bookId)
        .eq('author_id', authorId)

      if (error) {
        console.error('Error disconnecting author from book:', error)
        return { success: false, error: error.message }
      }
    } else {
      // Update the book's author_id field to null
      const { error } = await supabaseAdmin
        .from('books')
        .update({ author_id: null })
        .eq('id', bookId)
        .eq('author_id', authorId)

      if (error) {
        console.error('Error removing book author:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/admin/book-author-connections')
    return { success: true }
  } catch (error) {
    console.error('Error in disconnectAuthorFromBook:', error)
    return { success: false, error: String(error) }
  }
}

// Look up book by ISBN in ISBNDB
export async function lookupBookByISBN(isbn: string) {
  try {
    const book = await getBookByISBN(isbn)

    if (!book) {
      return { book: null, error: 'Book not found in ISBNDB' }
    }

    return { book, error: null }
  } catch (error) {
    console.error('Error looking up book by ISBN:', error)
    return { book: null, error: String(error) }
  }
}

// Create a new author
export async function createAuthor(authorData: { name: string; bio?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('authors')
      .insert({
        name: authorData.name,
        bio: authorData.bio || null,
      })
      .select('id, name')
      .single()

    if (error) {
      console.error('Error creating author:', error)
      return { author: null, error: error.message }
    }

    revalidatePath('/admin/book-author-connections')
    return { author: data, error: null }
  } catch (error) {
    console.error('Error in createAuthor:', error)
    return { author: null, error: String(error) }
  }
}

// Batch process books without authors
export async function batchProcessBooksWithoutAuthors(limit = 20) {
  try {
    // Get books without authors that have ISBN information
    const { data: books, error } = await supabaseAdmin
      .from('books')
      .select('id, isbn13, isbn10, title')
      .is('author_id', null)
      .limit(limit)

    if (error) {
      console.error('Error fetching books for batch processing:', error)
      return { processed: 0, success: false, error: error.message }
    }

    if (!books || books.length === 0) {
      return { processed: 0, success: true, message: 'No books to process' }
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
          errors.push(
            `No author information found for book ${book.id} (${book.title}, ISBN: ${isbn})`
          )
          continue
        }

        // Process each author
        for (const authorName of isbndbBook.authors) {
          // Search for author in database
          const { data: existingAuthors } = await supabaseAdmin
            .from('authors')
            .select('id, name')
            .ilike('name', authorName)
            .limit(1)

          let authorId

          if (existingAuthors && existingAuthors.length > 0) {
            // Use existing author
            authorId = existingAuthors[0].id
          } else {
            // Create new author
            const { data: newAuthor, error: createError } = await supabaseAdmin
              .from('authors')
              .insert({ name: authorName })
              .select('id')
              .single()

            if (createError) {
              errors.push(
                `Error creating author ${authorName} for book ${book.title}: ${createError.message}`
              )
              continue
            }

            authorId = newAuthor.id
          }

          // Create book-author connection
          const { error: connError } = await supabaseAdmin
            .from('book_authors')
            .insert({ book_id: book.id, author_id: authorId })

          if (connError) {
            errors.push(
              `Error connecting author ${authorName} to book ${book.title}: ${connError.message}`
            )
            continue
          }

          // If this is the first author, also update the book's author_id
          if (isbndbBook.authors.indexOf(authorName) === 0) {
            const { error: updateError } = await supabaseAdmin
              .from('books')
              .update({ author_id: authorId })
              .eq('id', book.id)

            if (updateError) {
              errors.push(
                `Error updating book ${book.title} with author ${authorName}: ${updateError.message}`
              )
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

    revalidatePath('/admin/book-author-connections')

    return {
      processed: processedCount,
      success: true,
      errors: errors.length > 0 ? errors : null,
    }
  } catch (error) {
    console.error('Error in batchProcessBooksWithoutAuthors:', error)
    return { processed: 0, success: false, error: String(error) }
  }
}

// Get statistics about authors and books
export async function getAuthorBookStats() {
  try {
    console.log('Getting author-book stats...')

    // Get total counts first
    const { count: totalBooks, error: totalBooksError } = await supabaseAdmin
      .from('books')
      .select('id', { count: 'exact' })

    const { count: totalAuthors, error: totalAuthorsError } = await supabaseAdmin
      .from('authors')
      .select('id', { count: 'exact' })

    if (totalBooksError || totalAuthorsError) {
      console.error('Error counting totals:', totalBooksError || totalAuthorsError)
      return {
        booksWithoutAuthors: 0,
        authorsWithoutBooks: 0,
        booksWithMultipleAuthors: 0,
        totalBooks: 0,
        totalAuthors: 0,
        error: (totalBooksError || totalAuthorsError)?.message,
      }
    }

    console.log(`Total books: ${totalBooks}, Total authors: ${totalAuthors}`)

    // Step 1: Get all book_ids from book_authors table
    const { data: bookAuthorData, error: bookAuthorError } = await supabaseAdmin
      .from('book_authors')
      .select('book_id, author_id')

    if (bookAuthorError) {
      console.error('Error fetching book-author connections:', bookAuthorError)
      return {
        booksWithoutAuthors: 0,
        authorsWithoutBooks: 0,
        booksWithMultipleAuthors: 0,
        totalBooks: totalBooks || 0,
        totalAuthors: totalAuthors || 0,
        error: bookAuthorError.message,
      }
    }

    // Step 2: Calculate books without authors
    // Get all book IDs
    const { data: allBookIds, error: allBookIdsError } = await supabaseAdmin
      .from('books')
      .select('id')

    if (allBookIdsError) {
      console.error('Error fetching all book IDs:', allBookIdsError)
      return {
        booksWithoutAuthors: 0,
        authorsWithoutBooks: 0,
        booksWithMultipleAuthors: 0,
        totalBooks: totalBooks || 0,
        totalAuthors: totalAuthors || 0,
        error: allBookIdsError.message,
      }
    }

    // Get unique book IDs from book_authors
    const bookIdsWithAuthors = new Set(
      bookAuthorData.map((ba: { book_id: string; author_id: string }) => ba.book_id)
    )

    // Books without authors are those not in the book_authors table
    const booksWithoutAuthors = allBookIds.filter(
      (book: { id: string }) => !bookIdsWithAuthors.has(book.id)
    ).length
    console.log(`Books without authors: ${booksWithoutAuthors}`)

    // Step 3: Calculate authors without books
    // Get all author IDs
    const { data: allAuthorIds, error: allAuthorIdsError } = await supabaseAdmin
      .from('authors')
      .select('id')

    if (allAuthorIdsError) {
      console.error('Error fetching all author IDs:', allAuthorIdsError)
      return {
        booksWithoutAuthors,
        authorsWithoutBooks: 0,
        booksWithMultipleAuthors: 0,
        totalBooks: totalBooks || 0,
        totalAuthors: totalAuthors || 0,
        error: allAuthorIdsError.message,
      }
    }

    // Get unique author IDs from book_authors
    const authorIdsWithBooks = new Set(
      bookAuthorData.map((ba: { book_id: string; author_id: string }) => ba.author_id)
    )

    // Authors without books are those not in the book_authors table
    const authorsWithoutBooks = allAuthorIds.filter(
      (author: { id: string }) => !authorIdsWithBooks.has(author.id)
    ).length
    console.log(`Authors without books: ${authorsWithoutBooks}`)

    // Step 4: Calculate books with multiple authors
    // Count occurrences of each book_id
    const bookCounts: Record<string, number> = {}
    bookAuthorData.forEach((ba: { book_id: string; author_id: string }) => {
      bookCounts[ba.book_id] = (bookCounts[ba.book_id] || 0) + 1
    })

    // Books with multiple authors are those that appear more than once
    const booksWithMultipleAuthors = Object.values(bookCounts).filter((count) => count > 1).length
    console.log(`Books with multiple authors: ${booksWithMultipleAuthors}`)

    return {
      booksWithoutAuthors,
      authorsWithoutBooks,
      booksWithMultipleAuthors,
      totalBooks: totalBooks || 0,
      totalAuthors: totalAuthors || 0,
      error: null,
    }
  } catch (error) {
    console.error('Error getting author-book stats:', error)
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

// Get books with multiple authors
export async function getBooksWithMultipleAuthors(page = 1, pageSize = 20) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Step 1: Get all book-author connections
    const { data: bookAuthorData, error: bookAuthorError } = await supabaseAdmin
      .from('book_authors')
      .select('book_id, author_id')

    if (bookAuthorError) {
      console.error('Error fetching book-author connections:', bookAuthorError)
      return { books: [], count: 0, error: bookAuthorError.message }
    }

    // Step 2: Count occurrences of each book_id
    const bookCounts: Record<string, number> = {}
    bookAuthorData.forEach((ba: { book_id: string; author_id: string }) => {
      bookCounts[ba.book_id] = (bookCounts[ba.book_id] || 0) + 1
    })

    // Step 3: Filter books with more than one author
    const booksWithMultiple = Object.entries(bookCounts)
      .filter(([_, count]) => count > 1)
      .map(([bookId]) => bookId)

    // Get the total count
    const count = booksWithMultiple.length

    if (count === 0) {
      return { books: [], count: 0, error: null }
    }

    // Step 4: Paginate the results
    const paginatedBookIds = booksWithMultiple.slice(
      from,
      Math.min(to + 1, booksWithMultiple.length)
    )

    if (paginatedBookIds.length === 0) {
      return { books: [], count, error: null }
    }

    // Step 5: Fetch the actual book details
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select(
        `
        id, 
        title,
        isbn10,
        isbn13,
        cover_image:cover_image_id(id, url, alt_text)
      `
      )
      .in('id', paginatedBookIds)

    if (booksError) {
      console.error('Error fetching books with multiple authors:', booksError)
      return { books: [], count, error: booksError.message }
    }

    return { books: books || [], count, error: null }
  } catch (error) {
    console.error('Error in getBooksWithMultipleAuthors:', error)
    return { books: [], count: 0, error: String(error) }
  }
}

// Create the count_authors_per_book RPC function if it doesn't exist
export async function createCountAuthorsPerBookFunction() {
  try {
    // Check if the function already exists
    const { data: functions, error: functionsError } = await supabaseAdmin.rpc('get_functions')

    if (functionsError) {
      console.error('Error checking for functions:', functionsError)
      return { success: false, error: functionsError.message }
    }

    const functionExists =
      functions && functions.some((fn: string) => fn === 'count_authors_per_book')

    if (functionExists) {
      return { success: true, message: 'Function already exists' }
    }

    // Create the function using a different approach
    // This would require a custom implementation since we can't use exec_sql
    return { success: false, error: 'Function creation not supported without exec_sql' }
  } catch (error) {
    console.error('Error in createCountAuthorsPerBookFunction:', error)
    return { success: false, error: String(error) }
  }
}

// Clean up author data and prepare for rebuilding connections
export async function cleanupAuthorData() {
  try {
    // First, clear the book_authors table
    const { error: deleteError } = await supabaseAdmin.from('book_authors').delete().neq('id', 0) // Delete all records

    if (deleteError) {
      console.error('Error clearing book_authors table:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // Then, set all author_id fields to null in the books table
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({ author_id: null })
      .neq('id', 0) // Update all records

    if (updateError) {
      console.error('Error clearing author_id fields:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in cleanupAuthorData:', error)
    return { success: false, error: String(error) }
  }
}
