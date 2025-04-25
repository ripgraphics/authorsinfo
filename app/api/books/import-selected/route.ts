import { NextResponse } from 'next/server'
import { bulkImportBooks } from '@/app/actions/bulk-import-books'

export async function POST(request: Request) {
  try {
    const { isbns } = await request.json()
    const result = await bulkImportBooks(isbns)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Import selected books error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
} 