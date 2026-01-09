import { NextResponse } from 'next/server'
import { bulkImportBooks, bulkImportBookObjects } from '@/app/actions/bulk-import-books'

// Extend timeout to 60 seconds (max for hobby plan)
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Support both the old format (isbns) and new format (books)
    if (body.books && Array.isArray(body.books)) {
      // New format: import book objects directly (bypasses ISBNdb refetch)
      console.log('Importing book objects directly:', body.books.length, 'books')
      const result = await bulkImportBookObjects(body.books)
      return NextResponse.json(result)
    } else if (body.isbns && Array.isArray(body.isbns)) {
      // Old format: import by ISBNs (fetches from ISBNdb)
      console.log('Importing by ISBNs:', body.isbns.length, 'ISBNs')
      const result = await bulkImportBooks(body.isbns)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'Invalid request format. Expected "books" array or "isbns" array.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Import selected books error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred during import'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for timeout-related errors
      if (error.message.includes('timeout') || error.message.includes('aborted') || error.name === 'AbortError') {
        errorMessage = 'Import operation timed out. Please try importing fewer books at once or try again later.'
        statusCode = 504
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error during import. Please check your connection and try again.'
        statusCode = 503
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

