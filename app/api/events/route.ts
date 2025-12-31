import { NextRequest, NextResponse } from 'next/server'
import { getPublicEvents, getFeaturedEvents } from '@/lib/events'
import { createClient } from '@/lib/supabase-server'

// GET /api/events - Get all events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category') || ''
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''
    const featured = searchParams.get('featured') === 'true'

    if (featured) {
      const featuredEvents = await getFeaturedEvents(limit)
      return NextResponse.json({ data: featuredEvents })
    }

    const events = await getPublicEvents(page, limit, search, categoryId, startDate, endDate)

    return NextResponse.json({
      data: events.data,
      total: events.count,
      page,
      limit,
      totalPages: Math.ceil((events.count || 0) / limit),
    })
  } catch (error: any) {
    console.error('[API] Error fetching events:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - Create a new event (all authenticated users)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // All authenticated users can create events associated with their profile

    const eventData = await request.json()

    // Validate required fields
    if (!eventData.title || !eventData.start_date || !eventData.end_date || !eventData.format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Add created_by field (the current user)
    eventData.created_by = user.id

    // Generate a slug if not provided
    if (!eventData.slug) {
      const slug = eventData.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-')

      eventData.slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
    }

    // Insert into events table
    const { data: event, error } = await supabase.from('events').insert(eventData).select().single()

    if (error) {
      console.error('[API] Error creating event:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create event' },
        { status: 500 }
      )
    }

    // If there's location data, create the location
    if (eventData.location) {
      const locationData = {
        ...eventData.location,
        event_id: event.id,
        is_primary: true,
      }

      await supabase.from('event_locations').insert(locationData)
    }

    return NextResponse.json(
      {
        data: event,
        message: 'Event created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[API] Error creating event:', error)
    return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 })
  }
}
