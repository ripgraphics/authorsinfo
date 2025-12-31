import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/events/[id]/comments
 * Get all comments for an event
 * Query params:
 * - session_id: UUID (optional, filter by session)
 * - limit: number (default: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id: eventId } = params;
    const searchParams = request.nextUrl.searchParams;

    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, is_public')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('event_comments')
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .eq('event_id', eventId);

    // Filter by session
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: comments, error } = await query;

    if (error) {
      console.error('[API] Error fetching event comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: comments });
  } catch (error: any) {
    console.error('[API] Error fetching event comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch event comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/comments
 * Post a comment to an event
 * Body: { content: string, session_id?: string, is_announcement?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: eventId } = params;
    const body = await request.json();
    const { content, session_id, is_announcement = false } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if user is an event participant
    const { data: participant } = await supabase
      .from('event_participants')
      .select('id, role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'You must be an event participant to post comments' },
        { status: 403 }
      );
    }

    // Check if user can post announcements
    if (is_announcement && !['host', 'co-host', 'moderator'].includes(participant.role)) {
      return NextResponse.json(
        { error: 'Only hosts and moderators can post announcements' },
        { status: 403 }
      );
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: user.id,
        session_id: session_id || null,
        content: content.trim(),
        is_announcement,
        is_pinned: false,
      })
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: comment, message: 'Comment posted successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error creating comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post comment' },
      { status: 500 }
    );
  }
}
