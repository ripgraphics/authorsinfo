import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'
import { getBookEvents } from '@/lib/events'

// GET: List all events for a book
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    
    // Convert bookId to number if it's a numeric string
    const bookIdNum = parseInt(bookId, 10)
    if (isNaN(bookIdNum)) {
      return NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    }

    // Get book events using the existing function
    const events = await getBookEvents(bookIdNum, 10)
    
    return NextResponse.json({ data: events || [] })
  } catch (error: any) {
    console.error('Error fetching book events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch book events' },
      { status: 500 }
    )
  }
}

