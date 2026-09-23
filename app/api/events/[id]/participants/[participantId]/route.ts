import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper'

const roleSchema = z.object({
  role: z.enum(['attendee', 'host', 'co-host', 'speaker', 'moderator']),
})

type Context = { params: Promise<{ id: string; participantId: string }> }

type EventRow = { created_by: string }
type ParticipantRow = { id: string; user_id: string; role: string }

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id: eventId, participantId } = await params
    const input = roleSchema.safeParse(await request.json().catch(() => null))
    if (!input.success) return NextResponse.json({ error: 'Invalid participant role' }, { status: 400 })

    const supabase = await createRouteHandlerClientAsync()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { data: event, error: eventError } = await (supabase as any)
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single()
    if (eventError || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if ((event as EventRow).created_by !== auth.user.id) {
      return NextResponse.json({ error: 'Only the event creator can manage participant roles' }, { status: 403 })
    }

    const { data: participant, error: participantError } = await (supabase as any)
      .from('event_participants')
      .select('id, user_id, role')
      .eq('id', participantId)
      .eq('event_id', eventId)
      .single()
    if (participantError || !participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

    if ((participant as ParticipantRow).user_id === auth.user.id && input.data.role !== 'host') {
      return NextResponse.json({ error: 'The event creator must remain host' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await (supabase as any)
      .from('event_participants')
      .update({ role: input.data.role, updated_at: new Date().toISOString() })
      .eq('id', participantId)
      .eq('event_id', eventId)
      .select('id, event_id, user_id, role, rsvp_status, updated_at')
      .single()
    if (updateError) return NextResponse.json({ error: 'Unable to update participant role' }, { status: 500 })

    return NextResponse.json({ data: updated })
  } catch {
    return NextResponse.json({ error: 'Unable to update participant role' }, { status: 500 })
  }
}
