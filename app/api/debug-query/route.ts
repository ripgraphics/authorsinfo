import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 })
    }

    // Execute the query directly using Supabase's query method
    const { data, error } = await supabaseAdmin.from("authors").select("id", { count: "exact" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get a direct count of authors without books
    const { data: allAuthorIds } = await supabaseAdmin.from("authors").select("id")
    const { data: bookAuthorData } = await supabaseAdmin.from("book_authors").select("author_id")

    // Create a set of author IDs that have books
    const authorIdsWithBooks = new Set(bookAuthorData?.map((ba) => ba.author_id) || [])

    // Count authors whose IDs are not in the set
    const authorsWithoutBooks = allAuthorIds?.filter((author) => !authorIdsWithBooks.has(author.id)).length || 0

    return NextResponse.json({
      totalAuthors: data,
      authorsWithoutBooks,
      rawQuery: query,
    })
  } catch (error) {
    console.error("Error in debug-query route:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
