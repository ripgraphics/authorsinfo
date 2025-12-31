import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { normalizeISBN } from '@/utils/isbnUtils'

export async function POST(request: NextRequest) {
  try {
    const { isbns } = await request.json()

    if (!isbns || !Array.isArray(isbns) || isbns.length === 0) {
      return NextResponse.json({ error: 'ISBNs array is required' }, { status: 400 })
    }

    // Normalize all input ISBNs (remove hyphens and spaces)
    const normalizedIsbns = isbns
      .map((isbn) => normalizeISBN(isbn))
      .filter((isbn): isbn is string => isbn !== null)

    if (normalizedIsbns.length === 0) {
      return NextResponse.json({
        existingIsbns: [],
        total: 0,
      })
    }

    // Check for existing ISBNs in the database
    // We need to check both normalized and original formats
    const { data: existingBooks, error } = await supabaseAdmin
      .from('books')
      .select('isbn10, isbn13')

    if (error) {
      console.error('Error checking for existing books:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Create a set of normalized existing ISBNs (both ISBN-10 and ISBN-13)
    const existingIsbns = new Set<string>()
    existingBooks?.forEach((book) => {
      if (book.isbn10) {
        const normalized = normalizeISBN(book.isbn10)
        if (normalized) existingIsbns.add(normalized)
      }
      if (book.isbn13) {
        const normalized = normalizeISBN(book.isbn13)
        if (normalized) existingIsbns.add(normalized)
      }
    })

    // Find which input ISBNs match existing ones
    const matchingIsbns = normalizedIsbns.filter((isbn) => existingIsbns.has(isbn))

    return NextResponse.json({
      existingIsbns: matchingIsbns,
      total: matchingIsbns.length,
    })
  } catch (error) {
    console.error('Error in check-existing API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
