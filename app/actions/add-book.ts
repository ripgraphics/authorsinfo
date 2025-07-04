"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import type { Book } from "@/types/database"
import { cleanSynopsis } from "@/utils/textUtils"

export async function addBookFromISBNDB(bookData: {
  title: string
  isbn?: string
  isbn13?: string
  authors?: string[]
  publisher?: string
  publish_date?: string
  image?: string
  synopsis?: string
}): Promise<{ success: boolean; bookId?: string; error?: string }> {
  if (!bookData || !bookData.title) {
    return { success: false, error: "Invalid book data provided" }
  }
  try {
    // Check if the book already exists by ISBN
    let existingBook = null
    if (bookData.isbn) {
      // Try to find by ISBN-10 first
      const { data, error } = await supabaseAdmin.from("books").select("id").eq("isbn10", bookData.isbn).single()
      if (!error && data) {
        existingBook = data
      }
    } else if (bookData.isbn13) {
      const { data, error } = await supabaseAdmin.from("books").select("id").eq("isbn13", bookData.isbn13).single()
      if (!error && data) {
        existingBook = data
      }
    }

    if (existingBook) {
      return { success: true, bookId: existingBook.id }
    }

    // Clean the synopsis text
    const cleanedSynopsis = bookData.synopsis ? cleanSynopsis(bookData.synopsis) : null

    // Prepare the book data
    const newBook: Partial<Book> = {
      title: bookData.title,
      isbn10: bookData.isbn, // Use isbn10 for the isbn field
      isbn13: bookData.isbn13,
      publication_date: bookData.publish_date, // Use publication_date instead of publish_date
      original_image_url: bookData.image,
      synopsis: cleanedSynopsis,
      author: bookData.authors && bookData.authors.length > 0 ? bookData.authors[0] : 'Unknown Author', // Set primary author
    }

    // Insert the book
    const { data, error } = await supabaseAdmin.from("books").insert(newBook).select("id").single()

    if (error) {
      console.error("Error adding book:", error)
      return { success: false, error: error.message }
    }

    // If we have authors, we would need to handle them here
    // This would involve either finding existing authors or creating new ones
    // and then linking them to the book via a join table

    return { success: true, bookId: data.id }
  } catch (error) {
    console.error("Error adding book from ISBNDB:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
