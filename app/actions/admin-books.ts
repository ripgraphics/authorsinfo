'use server'

import { supabaseAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  sortField = 'title',
  sortDirection: 'asc' | 'desc' = 'asc'
) {
  try {
    // Check if the requested sort field exists in the books table
    const { data: tableInfo, error: tableError } = await supabaseAdmin.rpc('get_column_names', {
      table_name: 'books',
    })

    // If we can't get column info or there's an error, fall back to title
    let validSortField = 'title'

    if (!tableError && tableInfo) {
      // If the requested sort field exists, use it
      if (tableInfo.includes(sortField)) {
        validSortField = sortField
      } else if (sortField === 'created_at') {
        // Try common alternatives for created_at
        if (tableInfo.includes('inserted_at')) {
          validSortField = 'inserted_at'
        } else if (tableInfo.includes('date_added')) {
          validSortField = 'date_added'
        } else if (tableInfo.includes('date_created')) {
          validSortField = 'date_created'
        } else if (tableInfo.includes('timestamp')) {
          validSortField = 'timestamp'
        } else if (tableInfo.includes('publication_date')) {
          // Fall back to publication_date for "recent" sorting
          validSortField = 'publication_date'
        }
      }
    }

    // Start building the query
    let query = supabaseAdmin.from('books').select(`
        *,
        cover_image:cover_image_id(id, url, alt_text),
        author:author_id(id, name),
        publisher:publisher_id(id, name)
      `)

    // Apply filters
    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`)
    }

    if (filters.isbn) {
      query = query.or(`isbn13.ilike.%${filters.isbn}%,isbn10.ilike.%${filters.isbn}%`)
    }

    if (filters.language) {
      query = query.eq('language', filters.language)
    }

    if (filters.publishedYear) {
      // Check if we have a publication_date or publication_year field
      const { data: sampleBook } = await supabaseAdmin.from('books').select('*').limit(1)

      if (sampleBook && sampleBook.length > 0) {
        if (sampleBook[0].publication_date) {
          query = query.ilike('publication_date', `%${filters.publishedYear}%`)
        } else if (sampleBook[0].publication_year) {
          query = query.eq('publication_year', filters.publishedYear)
        } else if (sampleBook[0].year) {
          query = query.eq('year', filters.publishedYear)
        }
      }
    }

    if (filters.genre) {
      query = query.eq('genre_id', filters.genre)
    }

    if (filters.format) {
      query = query.eq('format_type_id', filters.format)
    }

    if (filters.binding) {
      query = query.eq('binding_type_id', filters.binding)
    }

    if (filters.minRating !== undefined) {
      query = query.gte('average_rating', filters.minRating)
    }

    if (filters.maxRating !== undefined) {
      query = query.lte('average_rating', filters.maxRating)
    }

    // Apply status filter, linked by status_id
    if (filters.status) {
      query = query.eq('status_id', filters.status)
    }

    let authorData: { id: string; name: string }[] | null = null
    // Handle author filter - this is more complex as it might be in a join table
    if (filters.author) {
      // First try with direct author_id field
      const { data } = await supabaseAdmin
        .from('authors')
        .select('id, name')
        .ilike('name', `%${filters.author}%`)
        .limit(20)

      authorData = data

      if (authorData && authorData.length > 0) {
        const authorIds = authorData.map((author) => author.id)
        query = query.in('author_id', authorIds)
      }
    }

    let publisherData: { id: string; name: string }[] | null = null
    // Handle publisher filter
    if (filters.publisher) {
      const { data } = await supabaseAdmin
        .from('publishers')
        .select('id, name')
        .ilike('name', `%${filters.publisher}%`)
        .limit(20)

      publisherData = data

      if (publisherData && publisherData.length > 0) {
        const publisherIds = publisherData.map((publisher) => publisher.id)
        query = query.in('publisher_id', publisherIds)
      }
    }

    // Create a separate query for counting
    let countQuery = supabaseAdmin.from('books').select('id', { count: 'exact' })

    // Apply the same filters to the count query
    if (filters.title) {
      countQuery = countQuery.ilike('title', `%${filters.title}%`)
    }

    if (filters.isbn) {
      countQuery = countQuery.or(`isbn13.ilike.%${filters.isbn}%,isbn10.ilike.%${filters.isbn}%`)
    }

    if (filters.language) {
      countQuery = countQuery.eq('language', filters.language)
    }

    if (filters.publishedYear) {
      // We already checked the fields above, so we can use the same logic
      const { data: sampleBook } = await supabaseAdmin.from('books').select('*').limit(1)

      if (sampleBook && sampleBook.length > 0) {
        if (sampleBook[0].publication_date) {
          countQuery = countQuery.ilike('publication_date', `%${filters.publishedYear}%`)
        } else if (sampleBook[0].publication_year) {
          countQuery = countQuery.eq('publication_year', filters.publishedYear)
        } else if (sampleBook[0].year) {
          countQuery = countQuery.eq('year', filters.publishedYear)
        }
      }
    }

    if (filters.genre) {
      countQuery = countQuery.eq('genre_id', filters.genre)
    }

    if (filters.format) {
      countQuery = countQuery.eq('format_type_id', filters.format)
    }

    if (filters.binding) {
      countQuery = countQuery.eq('binding_type_id', filters.binding)
    }

    if (filters.minRating !== undefined) {
      countQuery = countQuery.gte('average_rating', filters.minRating)
    }

    if (filters.maxRating !== undefined) {
      countQuery = countQuery.lte('average_rating', filters.maxRating)
    }

    // Apply status filter to count query
    if (filters.status) {
      countQuery = countQuery.eq('status_id', filters.status)
    }

    // Apply the same author filter to count query
    if (filters.author && authorData && authorData.length > 0) {
      const authorIds = authorData.map((author) => author.id)
      countQuery = countQuery.in('author_id', authorIds)
    }

    // Apply the same publisher filter to count query
    if (filters.publisher && publisherData && publisherData.length > 0) {
      const publisherIds = publisherData.map((publisher) => publisher.id)
      countQuery = countQuery.in('publisher_id', publisherIds)
    }

    // Get total count for pagination
    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting filtered books:', countError)
      return { books: [], count: 0, error: countError.message }
    }

    // Apply sorting with the validated sort field
    query = query.order(validSortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error('Error fetching filtered books:', error)
      return { books: [], count: 0, error: error.message }
    }

    return { books: data || [], count: count || 0, error: null }
  } catch (error) {
    console.error('Error in getFilteredBooks:', error)
    return { books: [], count: 0, error: String(error) }
  }
}

export async function bulkDeleteBooks(bookIds: string[]) {
  try {
    if (!bookIds || bookIds.length === 0) {
      return { success: false, error: 'No books selected' }
    }

    // Delete the books
    const { error } = await supabaseAdmin.from('books').delete().in('id', bookIds)

    if (error) {
      console.error('Error deleting books:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/books')
    return { success: true, count: bookIds.length }
  } catch (error) {
    console.error('Error in bulkDeleteBooks:', error)
    return { success: false, error: String(error) }
  }
}

export async function bulkUpdateBooks(bookIds: string[], updates: Record<string, any>) {
  try {
    if (!bookIds || bookIds.length === 0) {
      return { success: false, error: 'No books selected' }
    }

    if (!updates || Object.keys(updates).length === 0) {
      return { success: false, error: 'No updates provided' }
    }

    // Update the books
    const { error } = await supabaseAdmin.from('books').update(updates).in('id', bookIds)

    if (error) {
      console.error('Error updating books:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/books')
    return { success: true, count: bookIds.length }
  } catch (error) {
    console.error('Error in bulkUpdateBooks:', error)
    return { success: false, error: String(error) }
  }
}

export async function getBookFormOptions() {
  try {
    // Fetch all the options needed for the book form
    const [
      { data: genres },
      { data: formatTypes },
      { data: bindingTypes },
      { data: languages },
      { data: statuses },
    ] = await Promise.all([
      supabaseAdmin.from('book_genres').select('id, name').order('name'),
      supabaseAdmin.from('format_types').select('id, name').order('name'),
      supabaseAdmin.from('binding_types').select('id, name').order('name'),
      supabaseAdmin.from('books').select('language').not('language', 'is', null),
      supabaseAdmin.from('statuses').select('id, name').order('name'),
    ])

    // Extract unique languages
    const uniqueLanguages = languages
      ? Array.from(
          new Set(
            languages.map((item: { language: string | null }) => item.language).filter(Boolean)
          )
        )
      : []

    return {
      genres: genres || [],
      formatTypes: formatTypes || [],
      bindingTypes: bindingTypes || [],
      languages: uniqueLanguages,
      statuses: statuses || [],
      error: null,
    }
  } catch (error) {
    console.error('Error fetching book form options:', error)
    return {
      statuses: [],
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
    let query = supabaseAdmin.from('books').select(`
      id, title, subtitle, isbn13, isbn10, publisher_id, author_id, 
      language, page_count, publication_date, average_rating
    `)

    // If bookIds are provided, only export those books
    if (bookIds && bookIds.length > 0) {
      query = query.in('id', bookIds)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error exporting books:', error)
      return { success: false, error: error.message, csv: null }
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'No books found', csv: null }
    }

    // Convert to CSV
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map((book: Record<string, any>) =>
      Object.values(book)
        .map((value) =>
          value === null ? '' : typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        )
        .join(',')
    )
    const csv = [headers, ...rows].join('\n')

    return { success: true, csv, count: data.length }
  } catch (error) {
    console.error('Error in exportBooksToCSV:', error)
    return { success: false, error: String(error), csv: null }
  }
}
