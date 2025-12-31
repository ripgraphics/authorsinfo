import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Get a sample book to see what columns exist
    const { data: sampleBook, error: sampleError } = await supabaseAdmin
      .from('books')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (sampleError) {
      return NextResponse.json({
        error: sampleError.message,
        columns: [],
      })
    }

    if (!sampleBook) {
      return NextResponse.json({
        error: 'No books found',
        columns: [],
      })
    }

    // Get all column names from the sample
    const columns = Object.keys(sampleBook)

    // Filter for image-related columns
    const imageColumns = columns.filter(
      (col) =>
        col.toLowerCase().includes('image') ||
        col.toLowerCase().includes('cover') ||
        col.toLowerCase().includes('avatar')
    )

    // Get column types by checking the values
    const columnInfo = columns.map((col) => ({
      name: col,
      type: typeof sampleBook[col],
      value: sampleBook[col],
      isImageRelated: imageColumns.includes(col),
    }))

    return NextResponse.json({
      columns,
      imageColumns,
      columnInfo,
      sampleBook: sampleBook,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      columns: [],
    })
  }
}

