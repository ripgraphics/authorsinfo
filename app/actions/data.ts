"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import type {
  Author,
  Book,
  Publisher,
  User,
  Review,
  Bookshelf,
  ReadingStatus,
  ReadingChallenge,
} from "@/types/database"

// Books
export async function getTotalBooksCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin.from("books").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting books:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting books:", error)
    return 0
  }
}

// Update the getRecentBooks function
export async function getRecentBooks(limit = 10, offset = 0): Promise<Book[]> {
  try {
    // Join with the images table to get the cover image URL
    const { data, error } = await supabaseAdmin
      .from("books")
      .select(`
        *,
        cover_image:cover_image_id(id, url, alt_text)
      `)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching books:", error)
      return []
    }

    // Transform the data to include the image URL
    return data.map((book) => ({
      ...book,
      cover_image_url: book.cover_image?.url || book.original_image_url || null,
    })) as Book[]
  } catch (error) {
    console.error("Error fetching books:", error)
    return []
  }
}

// Update the getBookById function
export async function getBookById(id: string): Promise<Book | null> {
  // Special case: if id is "add", return null immediately
  if (id === "add") {
    return null
  }

  try {
    // Add a timeout to the request
    const timeoutPromise = new Promise<Book | null>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 5000)
    })

    const fetchPromise = new Promise<Book | null>(async (resolve) => {
      try {
        // Join with the images table to get the cover image URL
        const { data, error } = await supabaseAdmin
          .from("books")
          .select(`
            *,
            cover_image:cover_image_id(id, url, alt_text)
          `)
          .eq("id", id)
          .single()

        if (error) {
          console.error("Error fetching book:", error)
          resolve(null)
          return
        }

        // Transform the data to include the image URL
        resolve({
          ...data,
          cover_image_url: data.cover_image?.url || data.original_image_url || null,
          // Ensure numeric fields are properly typed
          average_rating: data.average_rating !== null ? Number(data.average_rating) : null,
          price: data.price !== null ? Number(data.price) : null,
          list_price: data.list_price !== null ? Number(data.list_price) : null,
          page_count: data.page_count !== null ? Number(data.page_count) : null,
          series_number: data.series_number !== null ? Number(data.series_number) : null,
        } as Book)
      } catch (error) {
        console.error("Error in fetchPromise:", error)
        resolve(null)
      }
    })

    return Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
      console.error("Request failed or timed out:", error)
      return null
    })
  } catch (error) {
    console.error("Error fetching book:", error)
    return null
  }
}

export async function getBooksByAuthorId(authorId: string, limit = 10): Promise<Book[]> {
  try {
    // Try with single author_id field
    const { data, error } = await supabaseAdmin.from("books").select("*").eq("author_id", authorId).limit(limit)

    if (error) {
      console.error("Error fetching books by author with author_id:", error)

      // If that fails, try with book_authors join table
      try {
        const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
          .from("book_authors")
          .select("book_id")
          .eq("author_id", authorId)
          .limit(limit)

        if (bookAuthorsError || !bookAuthors || bookAuthors.length === 0) {
          console.error("Error fetching from book_authors:", bookAuthorsError)
          return []
        }

        // Extract book IDs
        const bookIds = bookAuthors.map((item) => item.book_id)

        // Get the books
        const { data: books, error: booksError } = await supabaseAdmin.from("books").select("*").in("id", bookIds)

        if (booksError) {
          console.error("Error fetching books by author IDs:", booksError)
          return []
        }

        return books as Book[]
      } catch (joinTableError) {
        console.error("Error with join table approach:", joinTableError)
        return []
      }
    }

    return data as Book[]
  } catch (error) {
    console.error("Error fetching books by author:", error)
    return []
  }
}

export async function getBooksByPublisherId(publisherId: string, limit = 10): Promise<Book[]> {
  try {
    const { data, error } = await supabaseAdmin.from("books").select("*").eq("publisher_id", publisherId).limit(limit)

    if (error) {
      console.error("Error fetching books by publisher:", error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error("Error fetching books by publisher:", error)
    return []
  }
}

// Authors
// Add this function to get the total count of authors
export async function getTotalAuthorsCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin.from("authors").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting authors:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting authors:", error)
    return 0
  }
}

// Update the getRecentAuthors function
export async function getRecentAuthors(limit = 10, offset = 0): Promise<Author[]> {
  try {
    // Join with the images table to get the author image URL
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select(`
        *,
        author_image:author_image_id(id, url, alt_text)
      `)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching authors:", error)
      return []
    }

    // Transform the data to include the image URL
    return data.map((author) => ({
      ...author,
      photo_url: author.author_image?.url || author.photo_url || null,
    })) as Author[]
  } catch (error) {
    console.error("Error fetching authors:", error)
    return []
  }
}

// Update the getAuthorById function
export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    // Join with the images table to get the author image URL
    const { data, error } = await supabaseAdmin
      .from("authors")
      .select(`
        *,
        author_image:author_image_id(id, url, alt_text)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching author:", error)
      return null
    }

    // Transform the data to include the image URL
    return {
      ...data,
      photo_url: data.author_image?.url || data.photo_url || null,
    } as Author
  } catch (error) {
    console.error("Error fetching author:", error)
    return null
  }
}

// Update the getAuthorsByBookId function to handle connection errors better
export async function getAuthorsByBookId(bookId: string): Promise<Author[]> {
  try {
    // Since author_ids doesn't exist, let's check if there's a single author_id field
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("author_id") // Try with singular author_id instead of author_ids array
      .eq("id", bookId)
      .single()

    if (bookError) {
      console.error("Error fetching book author_id:", bookError)

      // If that fails, let's try to see if there's a book_authors join table
      try {
        const { data: bookAuthors, error: bookAuthorsError } = await supabaseAdmin
          .from("book_authors") // Assuming there might be a join table
          .select("author_id")
          .eq("book_id", bookId)

        if (bookAuthorsError || !bookAuthors || bookAuthors.length === 0) {
          console.error("Error fetching from book_authors:", bookAuthorsError)
          return []
        }

        // Extract author IDs from the join table
        const authorIds = bookAuthors.map((item) => item.author_id)

        // Get the authors with joined image data
        const { data: authors, error: authorsError } = await supabaseAdmin
          .from("authors")
          .select(`
            *,
            author_image:author_image_id(id, url, alt_text)
          `)
          .in("id", authorIds)

        if (authorsError) {
          console.error("Error fetching authors by book:", authorsError)
          return []
        }

        return authors as Author[]
      } catch (joinTableError) {
        console.error("Error with join table approach:", joinTableError)
        return []
      }
    }

    // If we got here, we found a single author_id
    if (!book || !book.author_id) {
      return []
    }

    // Get the author with joined image data
    try {
      const { data: author, error: authorError } = await supabaseAdmin
        .from("authors")
        .select(`
          *,
          author_image:author_image_id(id, url, alt_text)
        `)
        .eq("id", book.author_id)
        .single()

      if (authorError) {
        console.error("Error fetching author by book:", authorError)
        return []
      }

      // Return as an array with the single author
      return [author] as Author[]
    } catch (error) {
      console.error("Error fetching author data:", error)
      return []
    }
  } catch (error) {
    console.error("Error fetching authors by book:", error)
    return []
  }
}

// Publishers
// Add this function to get the total count of publishers
export async function getTotalPublishersCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin.from("publishers").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting publishers:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting publishers:", error)
    return 0
  }
}

// Update the getRecentPublishers function to support pagination and join with images
export async function getRecentPublishers(limit = 10, offset = 0): Promise<Publisher[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("publishers")
      .select(`
        *,
        publisher_image:publisher_image_id(id, url, alt_text, img_type_id),
        cover_image:cover_image_id(id, url, alt_text, img_type_id),
        publisher_gallery:publisher_gallery_id(id, url, alt_text, img_type_id)
      `)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching publishers:", error)
      return []
    }

    return data as Publisher[]
  } catch (error) {
    console.error("Error fetching publishers:", error)
    return []
  }
}

export async function getPublisherById(id: string): Promise<Publisher | null> {
  try {
    // Join with the images table to get the publisher image and cover image
    const { data, error } = await supabaseAdmin
      .from("publishers")
      .select(`
        *,
        publisher_image:publisher_image_id(id, url, alt_text, img_type_id),
        cover_image:cover_image_id(id, url, alt_text, img_type_id),
        publisher_gallery:publisher_gallery_id(id, url, alt_text, img_type_id)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching publisher:", error)
      return null
    }

    return data as Publisher
  } catch (error) {
    console.error("Error fetching publisher:", error)
    return null
  }
}

// Users
export async function getRecentUsers(limit = 10): Promise<User[]> {
  try {
    // Remove the order by created_at in case it doesn't exist
    const { data, error } = await supabaseAdmin.from("users").select("*").limit(limit)

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    return data as User[]
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data as User
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// Reviews
// Update the getReviewsByBookId function to handle connection errors better
export async function getReviewsByBookId(bookId: string, limit = 10): Promise<Review[]> {
  try {
    // Add a timeout to the request
    const timeoutPromise = new Promise<Review[]>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out")), 5000)
    })

    const fetchPromise = new Promise<Review[]>(async (resolve) => {
      try {
        const { data, error } = await supabaseAdmin.from("reviews").select("*").eq("book_id", bookId).limit(limit)

        if (error) {
          console.error("Error fetching reviews:", error)
          resolve([])
        } else {
          resolve(data as Review[])
        }
      } catch (error) {
        console.error("Error in fetchPromise:", error)
        resolve([])
      }
    })

    return Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
      console.error("Request failed or timed out:", error)
      return []
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

export async function getReviewsByUserId(userId: string, limit = 10): Promise<Review[]> {
  try {
    // Remove the order by created_at since that column doesn't exist
    const { data, error } = await supabaseAdmin.from("reviews").select("*").eq("user_id", userId).limit(limit)

    if (error) {
      console.error("Error fetching reviews:", error)
      return []
    }

    return data as Review[]
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return []
  }
}

// Reading Status
export async function getReadingStatusByUserAndBook(userId: string, bookId: string): Promise<ReadingStatus | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("reading_status")
      .select("*")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .single()

    if (error) {
      console.error("Error fetching reading status:", error)
      return null
    }

    return data as ReadingStatus
  } catch (error) {
    console.error("Error fetching reading status:", error)
    return null
  }
}

export async function getUserReadingList(
  userId: string,
  status: "want_to_read" | "currently_reading" | "read",
  limit = 10,
): Promise<Book[]> {
  try {
    // First get the reading status entries
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from("reading_status")
      .select("book_id")
      .eq("user_id", userId)
      .eq("status", status)
      .limit(limit)

    if (statusError || !statusData || statusData.length === 0) {
      console.error("Error fetching reading status:", statusError)
      return []
    }

    // Extract book IDs
    const bookIds = statusData.map((item) => item.book_id)

    // Then get the books
    const { data, error } = await supabaseAdmin.from("books").select("*").in("id", bookIds)

    if (error) {
      console.error("Error fetching books for reading list:", error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error("Error fetching reading list:", error)
    return []
  }
}

// Reading Challenge
export async function getCurrentReadingChallenge(userId: string): Promise<ReadingChallenge | null> {
  const currentYear = new Date().getFullYear()

  try {
    const { data, error } = await supabaseAdmin
      .from("reading_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("year", currentYear)
      .single()

    if (error) {
      console.error("Error fetching reading challenge:", error)
      return null
    }

    return data as ReadingChallenge
  } catch (error) {
    console.error("Error fetching reading challenge:", error)
    return null
  }
}

// Friends
export async function getUserFriends(userId: string, limit = 20): Promise<User[]> {
  try {
    // Get accepted friend connections where the user is either user_id or friend_id
    const { data: friendsData, error: friendsError } = await supabaseAdmin
      .from("user_friends")
      .select("user_id, friend_id")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted")
      .limit(limit)

    if (friendsError || !friendsData || friendsData.length === 0) {
      console.error("Error fetching friends:", friendsError)
      return []
    }

    // Extract friend IDs (the other user in each relationship)
    const friendIds = friendsData.map((item) => (item.user_id === userId ? item.friend_id : item.user_id))

    // Get the user data for all friends
    const { data, error } = await supabaseAdmin.from("users").select("*").in("id", friendIds)

    if (error) {
      console.error("Error fetching friend users:", error)
      return []
    }

    return data as User[]
  } catch (error) {
    console.error("Error fetching friends:", error)
    return []
  }
}

// Bookshelves
export async function getUserBookshelves(userId: string): Promise<Bookshelf[]> {
  try {
    // Remove the order by created_at in case it doesn't exist
    const { data, error } = await supabaseAdmin.from("bookshelves").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error fetching bookshelves:", error)
      return []
    }

    return data as Bookshelf[]
  } catch (error) {
    console.error("Error fetching bookshelves:", error)
    return []
  }
}

export async function getBookshelfBooks(bookshelfId: string): Promise<Book[]> {
  try {
    // First get the bookshelf_books entries
    const { data: bookshelfData, error: bookshelfError } = await supabaseAdmin
      .from("bookshelf_books")
      .select("book_id")
      .eq("bookshelf_id", bookshelfId)

    if (bookshelfError || !bookshelfData || bookshelfData.length === 0) {
      console.error("Error fetching bookshelf books:", bookshelfError)
      return []
    }

    // Extract book IDs
    const bookIds = bookshelfData.map((item) => item.book_id)

    // Then get the books
    const { data, error } = await supabaseAdmin.from("books").select("*").in("id", bookIds)

    if (error) {
      console.error("Error fetching books for bookshelf:", error)
      return []
    }

    return data as Book[]
  } catch (error) {
    console.error("Error fetching bookshelf books:", error)
    return []
  }
}
