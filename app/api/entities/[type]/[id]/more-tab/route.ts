import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { EntityType } from '@/types/entity'

interface ReadingStats {
  totalBooksRead: number
  totalPagesRead: number
  averageRating: number
  reviewsWritten: number
}

interface Event {
  id: string
  title: string
  description: string
  date: string
  type: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params
    const entityType = type as EntityType

    let stats: ReadingStats | null = null
    let events: Event[] = []

    if (entityType === 'user') {
      stats = await fetchUserReadingStats(id)
      events = await fetchUserEvents(id)
    } else if (entityType === 'author') {
      events = await fetchAuthorEvents(id)
    } else if (entityType === 'book') {
      events = await fetchBookEvents(id)
    }

    return NextResponse.json({
      stats,
      events,
    })
  } catch (error) {
    console.error('Error fetching more tab content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch more tab content' },
      { status: 500 }
    )
  }
}

async function fetchUserReadingStats(userId: string): Promise<ReadingStats | null> {
  try {
    // Get total books read
    const { count: booksRead } = await supabase
      .from('reading_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    // Get reading progress for pages
    const { data: readingProgress } = await supabase
      .from('reading_progress')
      .select('pages_read')
      .eq('user_id', userId)

    const totalPagesRead = readingProgress?.reduce(
      (sum, rp) => sum + (rp.pages_read || 0),
      0
    ) || 0

    // Get average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('user_id', userId)

    const averageRating =
      reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

    return {
      totalBooksRead: booksRead || 0,
      totalPagesRead,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviewsWritten: reviews?.length || 0,
    }
  } catch (error) {
    console.error('Error fetching reading stats:', error)
    return null
  }
}

async function fetchUserEvents(userId: string): Promise<Event[]> {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    return (
      events?.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: new Date(event.date).toLocaleDateString(),
        type: event.event_type || 'event',
      })) || []
    )
  } catch (error) {
    console.error('Error fetching user events:', error)
    return []
  }
}

async function fetchAuthorEvents(authorId: string): Promise<Event[]> {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false })
      .limit(5)

    return (
      events?.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: new Date(event.date).toLocaleDateString(),
        type: event.event_type || 'event',
      })) || []
    )
  } catch (error) {
    console.error('Error fetching author events:', error)
    return []
  }
}

async function fetchBookEvents(bookId: string): Promise<Event[]> {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: false })
      .limit(5)

    return (
      events?.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: new Date(event.date).toLocaleDateString(),
        type: event.event_type || 'event',
      })) || []
    )
  } catch (error) {
    console.error('Error fetching book events:', error)
    return []
  }
}
