import { NextRequest, NextResponse } from 'next/server'
import { getEventById } from '@/lib/events'
import { createClient } from '@/lib/supabase-server'

// GET /api/events/[id] - Get a single event by ID or slug
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Track the view (only if the ID is a valid UUID)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
      const supabase = createClient()
      // Get current user if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser()

      await supabase.from('event_views').insert({
        event_id: eventId,
        user_id: user?.id || null,
        viewed_at: new Date().toISOString(),
      })
    }

    const event = await getEventById(eventId)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ data: event })
  } catch (error: any) {
    console.error('[API] Error fetching event:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch event' }, { status: 500 })
  }
}

// PUT /api/events/[id] - Update an event (admin or event creator only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if event exists and user has permission to update
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is the creator or has admin permissions
    const isCreator = event.created_by === user.id

    if (!isCreator) {
      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (!permissions?.is_admin) {
        return NextResponse.json(
          { error: 'You do not have permission to update this event' },
          { status: 403 }
        )
      }
    }

    const updateData = await request.json()

    // Remove fields that shouldn't be directly updated
    delete updateData.id
    delete updateData.created_by
    delete updateData.created_at

    // Update event
    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating event:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update event' },
        { status: 500 }
      )
    }

    // Update location if provided
    if (updateData.location) {
      const { data: existingLocation } = await supabase
        .from('event_locations')
        .select('id')
        .eq('event_id', eventId)
        .eq('is_primary', true)
        .single()

      if (existingLocation) {
        await supabase
          .from('event_locations')
          .update({
            ...updateData.location,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLocation.id)
      } else {
        await supabase.from('event_locations').insert({
          ...updateData.location,
          event_id: eventId,
          is_primary: true,
        })
      }
    }

    return NextResponse.json({
      data: updatedEvent,
      message: 'Event updated successfully',
    })
  } catch (error: any) {
    console.error('[API] Error updating event:', error)
    return NextResponse.json({ error: error.message || 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Delete an event (admin or event creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if event exists and user has permission to delete
    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is the creator or has admin permissions
    const isCreator = event.created_by === user.id

    if (!isCreator) {
      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()

      if (!permissions?.is_admin) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this event' },
          { status: 403 }
        )
      }
    }

    // Delete event (this will cascade to all related tables due to our schema design)
    const { error } = await supabase.from('events').delete().eq('id', eventId)

    if (error) {
      console.error('[API] Error deleting event:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Event deleted successfully',
    })
  } catch (error: any) {
    console.error('[API] Error deleting event:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 500 })
  }
}
