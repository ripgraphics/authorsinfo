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
    
    // Get book events using the existing function
    const events = await getBookEvents(bookId, 10)
    
    return NextResponse.json({ data: events || [] })
  } catch (error: any) {
    console.error('Error fetching book events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch book events' },
      { status: 500 }
    )
  }
}

