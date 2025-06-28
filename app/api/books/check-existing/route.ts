import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { isbns } = await request.json()

    if (!isbns || !Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 })
    }

    // Check for existing ISBNs in the database
    const { data: existingBooks, error } = await supabaseAdmin
      .from("books")
      .select("isbn10, isbn13")
      .or(`isbn10.in.(${isbns.join(",")}),isbn13.in.(${isbns.join(",")})`)

    if (error) {
      console.error("Error checking for existing books:", error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Create a set of existing ISBNs (both ISBN-10 and ISBN-13)
    const existingIsbns = new Set<string>()
    existingBooks?.forEach((book) => {
      if (book.isbn10) existingIsbns.add(book.isbn10)
      if (book.isbn13) existingIsbns.add(book.isbn13)
    })

    return NextResponse.json({
      existingIsbns: Array.from(existingIsbns),
      total: existingIsbns.size
    })
  } catch (error) {
    console.error('Error in check-existing API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 