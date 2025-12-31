import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Since new_books.json doesn't exist, return empty response
    // This prevents the 500 error and allows the route to work
    return NextResponse.json({
      books: [],
      newIsbns: [],
      message: 'No preview books available',
    })
  } catch (err) {
    console.error('Failed to preview new books:', err)
    return NextResponse.json(
      {
        books: [],
        newIsbns: [],
        error: String(err),
      },
      { status: 500 }
    )
  }
}
