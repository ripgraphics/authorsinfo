import { NextResponse } from 'next/server'
import newBooksData from '../../../../new_books.json'
import { checkForDuplicates } from '@/app/actions/bulk-import-books'

export async function GET() {
  try {
    // Load static JSON preview list
    const books: any[] = Array.isArray((newBooksData as any).books) ? (newBooksData as any).books : []
    // Extract ISBNs to check duplicates
    const isbns = books.map((b: any) => b.isbn10 || b.isbn).filter(Boolean)
    const { duplicates, newIsbns, error } = await checkForDuplicates(isbns)
    if (error) {
      console.error('Error checking duplicates in preview:', error)
      // Return all books and no new flag on error
      return NextResponse.json({ books, newIsbns: [] }, { status: 500 })
    }
    // Return all books and new ISBN list
    return NextResponse.json({ books, newIsbns })
  } catch (err) {
    console.error('Failed to preview new books:', err)
    return NextResponse.json({ books: [], newIsbns: [], error: String(err) }, { status: 500 })
  }
} 