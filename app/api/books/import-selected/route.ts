import { NextResponse } from 'next/server'
import { bulkImportBooks, bulkImportBookObjects } from '@/app/actions/bulk-import-books'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Support both the old format (isbns) and new format (books)
    if (body.books && Array.isArray(body.books)) {
      // New format: import book objects directly (bypasses ISBNdb refetch)
      console.log('Importing book objects directly:', body.books.length, 'books');
      const result = await bulkImportBookObjects(body.books)
      return NextResponse.json(result)
    } else if (body.isbns && Array.isArray(body.isbns)) {
      // Old format: import by ISBNs (fetches from ISBNdb)
      console.log('Importing by ISBNs:', body.isbns.length, 'ISBNs');
      const result = await bulkImportBooks(body.isbns)
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ error: 'Invalid request format. Expected "books" array or "isbns" array.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Import selected books error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
} 