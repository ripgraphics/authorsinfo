import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/events/[id]/checkin
 * Check in to an event (mark as attended)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const eventId = id;

    // Check if event exists and is happening now
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, start_date, end_date')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Allow check-in 30 minutes before event start
    const earlyCheckinTime = new Date(startDate.getTime() - 30 * 60 * 1000);

    if (now < earlyCheckinTime) {
      return NextResponse.json(
        { error: 'Check-in not available yet. You can check in 30 minutes before the event starts.' },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'Event has already ended. Check-in is no longer available.' },
        { status: 400 }
      );
    }

    // Check if user has RSVP'd
    const { data: participant, error: participantError } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'You must RSVP to this event before checking in' },
        { status: 400 }
      );
    }

    // Check if already checked in
    if (participant.joined_at) {
      return NextResponse.json(
        { error: 'You have already checked in to this event', data: participant },
        { status: 200 }
      );
    }

    // Check in the user
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('event_participants')
      .update({
        attended: true,
        joined_at: new Date().toISOString(),
      })
      .eq('id', participant.id)
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .single();

    if (updateError) {
      console.error('[API] Error checking in:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update actual attendees count
    await supabase.rpc('increment_event_attendees', { event_id: eventId });

    return NextResponse.json({
      data: updatedParticipant,
      message: 'Checked in successfully',
    });
  } catch (error: any) {
    console.error('[API] Error checking in:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check in' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]/checkin
 * Check out from an event (mark as left)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const eventId = id;

    // Find user's participant record
    const { data: participant } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!participant || !participant.joined_at) {
      return NextResponse.json(
        { error: 'You are not checked in to this event' },
        { status: 400 }
      );
    }

    // Check out the user
    const { data: updatedParticipant, error } = await supabase
      .from('event_participants')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('id', participant.id)
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error checking out:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedParticipant,
      message: 'Checked out successfully',
    });
  } catch (error: any) {
    console.error('[API] Error checking out:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check out' },
      { status: 500 }
    );
  }
}
