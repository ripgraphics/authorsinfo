import { NextResponse } from 'next/server'
import { importNewestBooks } from '@/app/actions/bulk-import-books'

export async function GET() {
  try {
    // Perform import using static JSON loader
    const result = await importNewestBooks()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error importing all books:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

