"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BookFilter = {
  title?: string
  author?: string
  publisher?: string
  isbn?: string
  language?: string
  publishedYear?: string
  genre?: string
  format?: string
  binding?: string
  minRating?: number
  maxRating?: number
  status?: string
}

export async function getFilteredBooks(
  filters: BookFilter,
  page = 1,
  pageSize = 20,
  sortField = "title",
  sortDirection: "asc" | "desc" = "asc",
) {
  try {
    // Start building the query
    let query = supabaseAdmin.from("books").select(`
        *,
        cover_image:cover_image_id(id, url, alt_text),
        author:author_id(id, name),
        publisher:publisher_id(id, name)
      `)

    // Apply filters
    if (filters.title) {
      query = query.ilike("title", `%${filters.title}%`)
    }

    if (filters.isbn) {
      query = query.or(`isbn13.ilike.%${filters.isbn}%,isbn10.ilike.%${filters.isbn}%`)
    }

    if (filters.language) {
      query = query.eq("language", filters.language)
    }

    if (filters.publishedYear) {
      // Check if we have a publication_date or publication_year field
      const { data: sampleBook } = await supabaseAdmin.from("books").select("*").limit(1)

      if (sampleBook && sampleBook.length > 0) {
        if (sampleBook[0].publication_date) {
          query = query.ilike("publication_date", `%${filters.publishedYear}%`)
        } else if (sampleBook[0].publication_year) {
          query = query.eq("publication_year", filters.publishedYear)
        } else if (sampleBook[0].year) {
          query = query.eq("year", filters.publishedYear)
        }
      }
    }

    if (filters.genre) {
      query = query.eq("genre_id", filters.genre)
    }

    if (filters.format) {
      query = query.eq("format_type_id", filters.format)
    }

    if (filters.binding) {
      query = query.eq("binding_type_id", filters.binding)
    }

    if (filters.minRating !== undefined) {
      query = query.gte("average_rating", filters.minRating)
    }

    if (filters.maxRating !== undefined) {
      query = query.lte("average_rating", filters.maxRating)
    }

    // Handle author filter - this is more complex as it might be in a join table
    if (filters.author) {
      // First try with direct author_id field
      const { data: authorData } = await supabaseAdmin
        .from("authors")
        .select("id")
        .ilike("name", `%${filters.author}%`)
        .limit(20)

      if (authorData && authorData.length > 0) {
        const authorIds = authorData.map((author) => author.id)
        query = query.in("author_id", authorIds)
      }
    }

    // Handle publisher filter
    if (filters.publisher) {
      const { data: publisherData } = await supabaseAdmin
        .from("publishers")
        .select("id")
        .ilike("name", `%${filters.publisher}%`)
        .limit(20)

      if (publisherData && publisherData.length > 0) {
        const publisherIds = publisherData.map((publisher) => publisher.id)
        query = query.in("publisher_id", publisherIds)
      }
    }

    // Get total count for pagination
    const { count } = await query.count()

    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === "asc" })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("Error fetching filtered books:", error)
      return { books: [], count: 0, error: error.message }
    }

    return { books: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error("Error in getFilteredBooks:", error)
    return { books: [], count: 0, error: String(error) }
  }
}

export async function bulkDeleteBooks(bookIds: string[]) {
  try {
    if (!bookIds || bookIds.length === 0) {
      return { success: false, error: "No books selected" }
    }

    // Delete the books
    const { error } = await supabaseAdmin.from("books").delete().in("id", bookIds)

    if (error) {
      console.error("Error deleting books:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/books")
    return { success: true, count: bookIds.length }
  } catch (error) {
    console.error("Error in bulkDeleteBooks:", error)
    return { success: false, error: String(error) }
  }
}

export async function bulkUpdateBooks(bookIds: string[], updates: Record<string, any>) {
  try {
    if (!bookIds || bookIds.length === 0) {
      return { success: false, error: "No books selected" }
    }

    if (!updates || Object.keys(updates).length === 0) {
      return { success: false, error: "No updates provided" }
    }

    // Update the books
    const { error } = await supabaseAdmin.from("books").update(updates).in("id", bookIds)

    if (error) {
      console.error("Error updating books:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/books")
    return { success: true, count: bookIds.length }
  } catch (error) {
    console.error("Error in bulkUpdateBooks:", error)
    return { success: false, error: String(error) }
  }
}

export async function getBookFormOptions() {
  try {
    // Fetch all the options needed for the book form
    const [{ data: genres }, { data: formatTypes }, { data: bindingTypes }, { data: languages }] = await Promise.all([
      supabaseAdmin.from("book_genres").select("id, name").order("name"),
      supabaseAdmin.from("format_types").select("id, name").order("name"),
      supabaseAdmin.from("binding_types").select("id, name").order("name"),
      supabaseAdmin.from("books").select("language").not("language", "is", null),
    ])

    // Extract unique languages
    const uniqueLanguages = languages ? Array.from(new Set(languages.map((item) => item.language).filter(Boolean))) : []

    return {
      genres: genres || [],
      formatTypes: formatTypes || [],
      bindingTypes: bindingTypes || [],
      languages: uniqueLanguages,
      error: null,
    }
  } catch (error) {
    console.error("Error fetching book form options:", error)
    return {
      genres: [],
      formatTypes: [],
      bindingTypes: [],
      languages: [],
      error: String(error),
    }
  }
}

export async function exportBooksToCSV(bookIds?: string[]) {
  try {
    let query = supabaseAdmin.from("books").select(`
      id, title, subtitle, isbn13, isbn10, publisher_id, author_id, 
      language, page_count, publication_date, average_rating
    `)

    // If bookIds are provided, only export those books
    if (bookIds && bookIds.length > 0) {
      query = query.in("id", bookIds)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error exporting books:", error)
      return { success: false, error: error.message, csv: null }
    }

    if (!data || data.length === 0) {
      return { success: false, error: "No books found", csv: null }
    }

    // Convert to CSV
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((book) =>
      Object.values(book)
        .map((value) => (value === null ? "" : typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value))
        .join(","),
    )
    const csv = [headers, ...rows].join("\n")

    return { success: true, csv, count: data.length }
  } catch (error) {
    console.error("Error in exportBooksToCSV:", error)
    return { success: false, error: String(error), csv: null }
  }
}
