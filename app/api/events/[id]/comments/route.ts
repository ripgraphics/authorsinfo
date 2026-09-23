import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getBlockedUserIds } from '@/lib/messaging/blocking';

type EventAccessRow = { id: string; visibility?: string | null; is_public?: boolean; created_by: string | null };

/**
 * GET /api/events/[id]/comments
 * Get all comments for an event
 * Query params:
 * - session_id: UUID (optional, filter by session)
 * - limit: number (default: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: viewerResult } = await supabase.auth.getUser();
    const eventId = id;
    const searchParams = request.nextUrl.searchParams;

    const sessionId = searchParams.get('session_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Check if event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, visibility, created_by')
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
      .from('event_comments')
      .select(`
        *,
        user:user_id(id, name, email)
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

    let visibleComments = comments || [];
    if (viewerResult.user) {
      const blockedUserIds = await getBlockedUserIds({
        user: viewerResult.user,
        supabase,
      } as Parameters<typeof getBlockedUserIds>[0]);
      visibleComments = visibleComments.filter(
        (comment: { user_id?: string }) =>
          !comment.user_id || !blockedUserIds.has(comment.user_id)
      );
    }

    return NextResponse.json({ data: visibleComments });
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
    const { content, session_id, is_announcement = false } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if user is an event participant
    const { data: participant } = await (supabase as any)
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
    const { data: comment, error } = await (supabase as any)
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
        user:user_id(id, name, email)
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
