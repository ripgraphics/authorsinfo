'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import type {
  Author,
  Book,
  Publisher,
  User,
  Review,
  Bookshelf,
  ReadingStatus,
  ReadingChallenge,
} from '@/types/database'

// Books
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.from('books').select('id').limit(1)

    if (error) {
      console.error('Database connection test failed:', {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Database connection test error:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    })
    return false
  }
}

export async function getTotalBooksCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('books')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting books:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting books:', error)
    return 0
  }
}

// Update the getRecentBooks function
export async function getRecentBooks(limit = 10, offset = 0): Promise<Book[]> {
  try {
    // Fetch books with cover image and author data
    const { data, error } = await supabaseAdmin
      .from('books')
      .select(
        `
        *,
        cover_image:images!cover_image_id(id, url, alt_text),
        author:authors!author_id(id, name, author_image:images!author_image_id(id, url, alt_text))
      `
      )
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching books:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return []
    }

    // Process books to include cover image URL and author data
    const books = (data || []).map((book: any) => ({
      ...book,
      cover_image_url: book.cover_image?.url || null,
      author: book.author
        ? {
            ...book.author,
            author_image: book.author.author_image
              ? {
                  url: book.author.author_image.url,
                  alt_text: book.author.author_image.alt_text,
                }
              : null,
          }
        : null,
    })) as Book[]

    return books
  } catch (error) {
    console.error(
      'Error fetching books:',
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error
    )
    return []
  }
}

// Update the getBookById function
export async function getBookById(id: string): Promise<Book | null> {
  // Special case: if id is "add", return null immediately
  if (id === 'add') {
    return null
  }

  try {
    // Quiet: remove verbose fetch log

    // Add a timeout to the request
    const timeoutPromise = new Promise<Book | null>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000)
    })

    const fetchPromise = new Promise<Book | null>(async (resolve) => {
      try {
        // Fetch book with cover image URL
        const { data, error } = await supabaseAdmin
          .from('books')
          .select(
            `
            *,
            cover_image:images!cover_image_id(id, url, alt_text)
          `
          )
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching book:', {
            errorCode: error.code,
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            bookId: id,
          })
          resolve(null)
          return
        }

        if (!data) {
          console.error('No book found with ID:', id)
          resolve(null)
          return
        }

        // If cover_image is not available from foreign key, try to get it from album
        if (!data.cover_image) {
          console.log('Cover image not found via foreign key, checking album...')

          // Find the "Cover Images" album for this book
          const { data: album } = await supabaseAdmin
            .from('photo_albums')
            .select('id')
            .eq('entity_type', 'book')
            .eq('entity_id', id)
            .eq('name', 'Cover Images')
            .maybeSingle()

          if (album) {
            // Get the cover image from the album
            const { data: albumImage } = await supabaseAdmin
              .from('album_images')
              .select(
                `
                image_id,
                images!inner(id, url, alt_text)
              `
              )
              .eq('album_id', album.id)
              .eq('is_cover', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (albumImage && albumImage.images) {
              data.cover_image = albumImage.images as any
              console.log('✅ Found cover image from album:', data.cover_image.url)
            }
          }
        }

        // Return book as-is, without trying to join with images
        resolve({
          ...data,
          // Ensure numeric fields are properly typed
          average_rating: data.average_rating !== null ? Number(data.average_rating) : null,
          price: data.price !== null ? Number(data.price) : null,
          list_price: data.list_price !== null ? Number(data.list_price) : null,
          page_count: data.page_count !== null ? Number(data.page_count) : null,
          series_number: data.series_number !== null ? Number(data.series_number) : null,
        } as Book)
      } catch (error) {
        console.error('Error in fetchPromise:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          bookId: id,
        })
        resolve(null)
      }
    })

    return Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
      console.error('Request failed or timed out:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        bookId: id,
      })
      return null
    })
  } catch (error) {
    console.error('Error fetching book:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      bookId: id,
    })
    return null
  }
}

export async function getBooksByAuthorId(authorId: string, limit = 10): Promise<Book[]> {
  try {
    // Try with single author_id field
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('author_id', authorId)
      .limit(limit)

    if (error) {
      console.error('Error fetching books by author with author_id:', error)

      // If that fails, try with book_authors join table
      try {
        const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
          .from('book_authors')
          .select('book_id')
          .eq('author_id', authorId)
          .limit(limit)

        if (bookAuthorsError || !bookAuthors || bookAuthors.length === 0) {
          console.error('Error fetching from book_authors:', bookAuthorsError)
          return []
        }

        // Extract book IDs
        const bookIds = bookAuthors.map((item: { book_id: string }) => item.book_id)

        // Get the books
        const { data: books, error: booksError } = await supabaseAdmin
          .from('books')
          .select('*')
          .in('id', bookIds)

        if (booksError) {
          console.error('Error fetching books by author IDs:', booksError)
          return []
        }

        return books as Book[]
      } catch (joinTableError) {
        console.error('Error with join table approach:', joinTableError)
        return []
      }
    }

    return data as Book[]
  } catch (error) {
    console.error('Error fetching books by author:', error)
    return []
  }
}

// Get count of unique authors for a publisher
export async function getPublisherAuthorCount(publisherId: string): Promise<number> {
  try {
    // Get all book IDs for this publisher
    const { data: publisherBooks, error: booksError } = await supabaseAdmin
      .from('books')
      .select('id, author_id')
      .eq('publisher_id', publisherId)

    if (booksError) {
      console.error('Error fetching publisher books for author count:', booksError)
      return 0
    }

    if (!publisherBooks || publisherBooks.length === 0) {
      return 0
    }

    const bookIds = publisherBooks.map((book: any) => book.id)
    const authorIds = new Set<string>()

    // Add authors from direct author_id field
    publisherBooks.forEach((book: any) => {
      if (book.author_id) {
        authorIds.add(String(book.author_id))
      }
    })

    // Get authors from book_authors join table
    if (bookIds.length > 0) {
      const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
        .from('book_authors')
        .select('author_id')
        .in('book_id', bookIds)

      if (!bookAuthorsError && bookAuthors) {
        bookAuthors.forEach((ba: any) => {
          if (ba.author_id) {
            authorIds.add(String(ba.author_id))
          }
        })
      }
    }

    return authorIds.size
  } catch (error) {
    console.error('Error getting publisher author count:', error)
    return 0
  }
}

export async function getBooksByPublisherId(publisherId: string, limit = 10): Promise<Book[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('publisher_id', publisherId)
      .limit(limit)

    if (error) {
      console.error('Error fetching books by publisher:', error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error('Error fetching books by publisher:', error)
    return []
  }
}

// Authors
// Add this function to get the total count of authors
export async function getTotalAuthorsCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('authors')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting authors:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting authors:', error)
    return 0
  }
}

// Update the getRecentAuthors function
export async function getRecentAuthors(limit = 10, offset = 0): Promise<Author[]> {
  try {
    // Fetch authors with author_image relation
    const { data, error } = await supabaseAdmin
      .from('authors')
      .select(`
        *,
        author_image:author_image_id(id, url, alt_text)
      `)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching authors:', error)
      return []
    }

    // Return authors with author_image relation populated
    return data as Author[]
  } catch (error) {
    console.error('Error fetching authors:', error)
    return []
  }
}

// Update the getAuthorById function
export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    // Fetch author without foreign key relationships
    const { data, error } = await supabaseAdmin.from('authors').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching author:', error)
      return null
    }

    // Return author as-is
    return data as Author
  } catch (error) {
    console.error('Error fetching author:', error)
    return null
  }
}

// Update the getAuthorsByBookId function to handle connection errors better
export async function getAuthorsByBookId(bookId: string): Promise<Author[]> {
  try {
    // Since author_ids doesn't exist, let's check if there's a single author_id field
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('author_id') // Try with singular author_id instead of author_ids array
      .eq('id', bookId)
      .single()

    if (bookError) {
      console.error('Error fetching book author_id:', bookError)

      // If that fails, let's try to see if there's a book_authors join table
      try {
        const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
          .from('book_authors') // Assuming there might be a join table
          .select('author_id')
          .eq('book_id', bookId)

        if (bookAuthorsError || !bookAuthors || bookAuthors.length === 0) {
          console.error('Error fetching from book_authors:', bookAuthorsError)
          return []
        }

        // Extract author IDs from the join table
        const authorIds = bookAuthors.map((item: { author_id: string }) => item.author_id)

        // Get the authors with author_image relation
        const { data: authors, error: authorsError } = await supabaseAdmin
          .from('authors')
          .select(`
            *,
            author_image:author_image_id(id, url, alt_text)
          `)
          .in('id', authorIds)

        if (authorsError) {
          console.error('Error fetching authors by book:', authorsError)
          return []
        }

        return authors as Author[]
      } catch (joinTableError) {
        console.error('Error with join table approach:', joinTableError)
        return []
      }
    }

    // If we got here, we found a single author_id
    if (!book || !book.author_id) {
      return []
    }

    // Get the author with author_image relation
    try {
      const { data: author, error: authorError } = await supabaseAdmin
        .from('authors')
        .select(`
          *,
          author_image:author_image_id(id, url, alt_text)
        `)
        .eq('id', book.author_id)
        .single()

      if (authorError) {
        console.error('Error fetching author by book:', authorError)
        return []
      }

      // Return as an array with the single author
      return [author] as Author[]
    } catch (error) {
      console.error('Error fetching author data:', error)
      return []
    }
  } catch (error) {
    console.error('Error fetching authors by book:', error)
    return []
  }
}

// Publishers
// Add this function to get the total count of publishers
export async function getTotalPublishersCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('publishers')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Error counting publishers:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error counting publishers:', error)
    return 0
  }
}

// Update the getRecentPublishers function to support pagination and join with images
export async function getRecentPublishers(limit = 10, offset = 0): Promise<Publisher[]> {
  try {
    // Fetch publishers with their image relationships
    const { data, error } = await supabaseAdmin
      .from('publishers')
      .select(
        `
        *,
        publisher_image:images!publishers_publisher_image_id_fkey(id, url, alt_text)
      `
      )
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching publishers:', error)
      return []
    }

    return data as Publisher[]
  } catch (error) {
    console.error('Error fetching publishers:', error)
    return []
  }
}

export async function getPublisherById(id: string): Promise<Publisher | null> {
  try {
    // Use Supabase relation syntax to fetch publisher with related images (matching lib/publishers.ts)
    const { data: publisher, error } = await supabaseAdmin
      .from('publishers')
      .select(
        `
        *,
        cover_image:cover_image_id(id, url, alt_text),
        publisher_image:publisher_image_id(id, url, alt_text),
        country_details:country_id(id, name, code)
      `
      )
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching publisher:', error)
      return null
    }

    if (!publisher) {
      console.log(`Publisher with ID ${id} not found`)
      return null
    }

    return publisher as Publisher
  } catch (error) {
    console.error('Error fetching publisher:', error)
    return null
  }
}

// Users
export async function getRecentUsers(limit = 10): Promise<User[]> {
  try {
    // Remove the order by created_at in case it doesn't exist
    const { data, error } = await supabaseAdmin.from('users').select('*, permalink').limit(limit)

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data as User[]
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*, permalink')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// Reviews
// Update the getReviewsByBookId function to handle connection errors better
export async function getReviewsByBookId(bookId: string, limit = 10): Promise<Review[]> {
  try {
    // Add a timeout to the request
    const timeoutPromise = new Promise<Review[]>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 5000)
    })

    const fetchPromise = new Promise<Review[]>(async (resolve) => {
      try {
        const { data, error } = await supabaseAdmin
          .from('reviews')
          .select('*')
          .eq('book_id', bookId)
          .limit(limit)

        if (error) {
          console.error('Error fetching reviews:', error)
          resolve([])
        } else {
          resolve(data as Review[])
        }
      } catch (error) {
        console.error('Error in fetchPromise:', error)
        resolve([])
      }
    })

    return Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
      console.error('Request failed or timed out:', error)
      return []
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

export async function getReviewsByUserId(userId: string, limit = 10): Promise<Review[]> {
  try {
    // Remove the order by created_at since that column doesn't exist
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('user_id', userId)
      .limit(limit)

    if (error) {
      console.error('Error fetching reviews:', error)
      return []
    }

    return data as Review[]
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return []
  }
}

// Reading Status
export async function getReadingStatusByUserAndBook(
  userId: string,
  bookId: string
): Promise<ReadingStatus | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reading_status')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()

    if (error) {
      console.error('Error fetching reading status:', error)
      return null
    }

    return data as ReadingStatus
  } catch (error) {
    console.error('Error fetching reading status:', error)
    return null
  }
}

export async function getUserReadingList(
  userId: string,
  status: 'want_to_read' | 'currently_reading' | 'read',
  limit = 10
): Promise<Book[]> {
  try {
    // First get the reading status entries
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('reading_status')
      .select('book_id')
      .eq('user_id', userId)
      .eq('status', status)
      .limit(limit)

    if (statusError || !statusData || statusData.length === 0) {
      console.error('Error fetching reading status:', statusError)
      return []
    }

    // Extract book IDs
    const bookIds = statusData.map((item: { book_id: string }) => item.book_id)

    // Then get the books
    const { data, error } = await supabaseAdmin.from('books').select('*').in('id', bookIds)

    if (error) {
      console.error('Error fetching books for reading list:', error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error('Error fetching reading list:', error)
    return []
  }
}

// Reading Challenge
export async function getCurrentReadingChallenge(userId: string): Promise<ReadingChallenge | null> {
  const currentYear = new Date().getFullYear()

  try {
    const { data, error } = await supabaseAdmin
      .from('reading_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .single()

    if (error) {
      console.error('Error fetching reading challenge:', error)
      return null
    }

    return data as ReadingChallenge
  } catch (error) {
    console.error('Error fetching reading challenge:', error)
    return null
  }
}

// Friends
export async function getUserFriends(userId: string, limit = 20): Promise<User[]> {
  try {
    // Get accepted friend connections where the user is either user_id or friend_id
    const { data: friendsData, error: friendsError } = await supabaseAdmin
      .from('user_friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted')
      .limit(limit)

    if (friendsError || !friendsData || friendsData.length === 0) {
      console.error('Error fetching friends:', friendsError)
      return []
    }

    // Extract friend IDs (the other user in each relationship)
    const friendIds = friendsData.map((item: { user_id: string; friend_id: string }) =>
      item.user_id === userId ? item.friend_id : item.user_id
    )

    // Get the user data for all friends, including permalinks
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*, permalink')
      .in('id', friendIds)

    if (error) {
      console.error('Error fetching friend users:', error)
      return []
    }

    return data as User[]
  } catch (error) {
    console.error('Error fetching friends:', error)
    return []
  }
}

// Bookshelves
export async function getUserBookshelves(userId: string): Promise<Bookshelf[]> {
  try {
    // Remove the order by created_at in case it doesn't exist
    const { data, error } = await supabaseAdmin
      .from('bookshelves')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching bookshelves:', error)
      return []
    }

    return data as Bookshelf[]
  } catch (error) {
    console.error('Error fetching bookshelves:', error)
    return []
  }
}

export async function getBookshelfBooks(bookshelfId: string): Promise<Book[]> {
  try {
    // First get the bookshelf_books entries
    const { data: bookshelfData, error: bookshelfError } = await supabaseAdmin
      .from('bookshelf_books')
      .select('book_id')
      .eq('bookshelf_id', bookshelfId)

    if (bookshelfError || !bookshelfData || bookshelfData.length === 0) {
      console.error('Error fetching bookshelf books:', bookshelfError)
      return []
    }

    // Extract book IDs
    const bookIds = bookshelfData.map((item: { book_id: string }) => item.book_id)

    // Then get the books
    const { data, error } = await supabaseAdmin.from('books').select('*').in('id', bookIds)

    if (error) {
      console.error('Error fetching books for bookshelf:', error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error('Error fetching bookshelf books:', error)
    return []
  }
}
