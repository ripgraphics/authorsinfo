import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getBlockedUserIds } from '@/lib/messaging/blocking';

type EventAccessRow = {
  id: string;
  visibility?: string | null;
  is_public?: boolean;
  created_by: string | null;
  max_participants?: number | null;
  max_attendees?: number | null;
};

/**
 * GET /api/events/[id]/participants
 * Get all participants for an event
 * Query params:
 * - rsvp_status: 'pending' | 'attending' | 'maybe' | 'declined'
 * - role: 'host' | 'co-host' | 'speaker' | 'moderator' | 'attendee'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const eventId = id;
    const searchParams = request.nextUrl.searchParams;
    const { data: viewerResult } = await supabase.auth.getUser();

    const rsvpStatus = searchParams.get('rsvp_status');
    const role = searchParams.get('role');

    // Check if event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, visibility, created_by, max_participants, max_attendees')
      .eq('id', eventId)
      .single();

    const eventAccess = event as EventAccessRow | null;
    if (eventError || !eventAccess) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const isPublic = eventAccess.visibility ? eventAccess.visibility === 'public' : eventAccess.is_public === true;
    if (!isPublic) {
      if (!viewerResult.user) {
        return NextResponse.json({ error: 'Event access denied' }, { status: 403 });
      }
      const { data: membership } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', viewerResult.user.id)
        .maybeSingle();
      if (eventAccess.created_by !== viewerResult.user.id && !membership) {
        return NextResponse.json({ error: 'Event access denied' }, { status: 403 });
      }
    }

    // Build query
    let query = (supabase as any)
      .from('event_participants')
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .eq('event_id', eventId);

    // Filter by RSVP status
    if (rsvpStatus) {
      query = query.eq('rsvp_status', rsvpStatus);
    }

    // Filter by role
    if (role) {
      query = query.eq('role', role);
    }

    query = query.order('created_at', { ascending: false });

    const { data: participants, error } = await query;

    if (error) {
      console.error('[API] Error fetching event participants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let visibleParticipants = participants || [];
    if (viewerResult.user) {
      const blockedUserIds = await getBlockedUserIds({
        user: viewerResult.user,
        supabase,
      } as Parameters<typeof getBlockedUserIds>[0]);
      visibleParticipants = visibleParticipants.filter(
        (participant: { user_id?: string }) =>
          !participant.user_id || !blockedUserIds.has(participant.user_id)
      );
    }

    return NextResponse.json({ data: visibleParticipants });
  } catch (error: any) {
    console.error('[API] Error fetching event participants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event participants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/participants
 * RSVP to an event (create participant)
 * Body: { rsvp_status: RSVPStatus }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const eventId = id;
    const body = await request.json();
    const { rsvp_status = 'attending' } = body;

    // Validate RSVP status
    if (!['pending', 'attending', 'maybe', 'declined'].includes(rsvp_status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_participants, max_attendees')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user already has RSVP
    const { data: existing } = await (supabase as any)
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already RSVP\'d to this event. Use PATCH to update your RSVP.' },
        { status: 400 }
      );
    }

    const eventAccess = event as EventAccessRow;
    const participantLimit = eventAccess.max_participants ?? eventAccess.max_attendees ?? null;
    if (rsvp_status === 'attending' && participantLimit !== null) {
      const { count: attendingCount } = await (supabase as any)
        .from('event_participants')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('rsvp_status', 'attending');
      if ((attendingCount ?? 0) >= participantLimit) {
        return NextResponse.json({ error: 'This event is full', code: 'event_full' }, { status: 409 });
      }
    }

    // Create RSVP
    const { data: participant, error } = await (supabase as any)
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: user.id,
        rsvp_status,
        role: 'attendee',
      })
      .select(`
        *,
        user:user_id(id, name, email)
      `)
      .single();

    if (error) {
      console.error('[API] Error creating RSVP:', error);
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json(
          { error: 'You have already RSVP\'d to this event. Use PATCH to update your RSVP.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: participant, message: 'RSVP created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error creating RSVP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create RSVP' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]/participants
 * Update RSVP status for the current user
 * Body: { rsvp_status: RSVPStatus }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const eventId = id;
    const body = await request.json();
    const { rsvp_status } = body;

    // Validate RSVP status
    if (!rsvp_status || !['pending', 'attending', 'maybe', 'declined'].includes(rsvp_status)) {
      return NextResponse.json(
        { error: 'Invalid or missing RSVP status' },
        { status: 400 }
      );
    }

    // Update RSVP
    const { data: participant, error } = await (supabase as any)
      .from('event_participants')
      .update({ rsvp_status })
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error updating RSVP:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'RSVP not found. Use POST to create a new RSVP.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: participant,
      message: 'RSVP updated successfully',
    });
  } catch (error: any) {
    console.error('[API] Error updating RSVP:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}
