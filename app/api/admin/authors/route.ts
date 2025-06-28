import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const nationality = searchParams.get('nationality') || ''
    const sort = searchParams.get('sort') || 'name_asc'
    const pageSize = 10
    const offset = (page - 1) * pageSize

    // Build the query
    let query = supabaseAdmin.from("authors").select("*", { count: "exact" })

    // Apply search filter if provided
    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    // Apply nationality filter if provided
    if (nationality) {
      query = query.eq("nationality", nationality)
    }

    // Apply sorting
    if (sort === "name_asc") {
      query = query.order("name", { ascending: true })
    } else if (sort === "name_desc") {
      query = query.order("name", { ascending: false })
    } else if (sort === "birth_date_asc") {
      query = query.order("birth_date", { ascending: true })
    } else if (sort === "birth_date_desc") {
      query = query.order("birth_date", { ascending: false })
    } else {
      // Default sorting
      query = query.order("name", { ascending: true })
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1)

    // Execute the query
    const { data: authors, error, count } = await query

    if (error) {
      console.error("Error fetching authors:", error)
      return NextResponse.json(
        { error: `Error fetching authors: ${error.message}` },
        { status: 500 }
      )
    }

    // Get book counts for each author
    const authorsWithBookCounts = await Promise.all(
      (authors || []).map(async (author) => {
        // Try to get book count from book_authors table first
        try {
          const { count: bookCount, error: bookCountError } = await supabaseAdmin
            .from("book_authors")
            .select("*", { count: "exact" })
            .eq("author_id", author.id)

          if (!bookCountError) {
            return { ...author, book_count: bookCount || 0 }
          }
        } catch (e) {
          console.warn(`Could not get book count from book_authors for author ${author.id}:`, e)
        }

        // Fallback: try to get books with author_id field
        try {
          const { count: bookCount, error: bookCountError } = await supabaseAdmin
            .from("books")
            .select("*", { count: "exact" })
            .eq("author_id", author.id)

          if (!bookCountError) {
            return { ...author, book_count: bookCount || 0 }
          }
        } catch (e) {
          console.warn(`Could not get book count from books for author ${author.id}:`, e)
        }

        // If both methods fail, return 0 books
        return { ...author, book_count: 0 }
      })
    )

    return NextResponse.json({
      authors: authorsWithBookCounts,
      totalAuthors: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 