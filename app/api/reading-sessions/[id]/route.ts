/**
 * Reading Session Detail API
 * GET /api/reading-sessions/:id - Get session details
 * PATCH /api/reading-sessions/:id - Update session
 * DELETE /api/reading-sessions/:id - Delete session
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/reading-sessions/:id - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: session, error } = await supabase
      .from('reading_sessions')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url,
          page_count
        )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Transform to camelCase
    const transformedSession = {
      id: session.id,
      userId: session.user_id,
      bookId: session.book_id,
      book: session.books ? {
        id: session.books.id,
        title: session.books.title,
        author: session.books.author,
        coverUrl: session.books.cover_url,
        pageCount: session.books.page_count,
      } : null,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      durationMinutes: session.duration_minutes,
      pagesRead: session.pages_read,
      startPage: session.start_page,
      endPage: session.end_page,
      percentageRead: session.percentage_read,
      readingLocation: session.reading_location,
      readingFormat: session.reading_format,
      notes: session.notes,
      mood: session.mood,
      pagesPerMinute: session.pages_per_minute,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: transformedSession,
    });
  } catch (error) {
    console.error('Error in GET /api/reading-sessions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/reading-sessions/:id - Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('reading_sessions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      bookId,
      endedAt,
      durationMinutes,
      pagesRead,
      startPage,
      endPage,
      readingLocation,
      readingFormat,
      notes,
      mood,
    } = body;

    const updates: any = {};
    if (bookId !== undefined) updates.book_id = bookId;
    if (endedAt !== undefined) updates.ended_at = endedAt;
    if (durationMinutes !== undefined) updates.duration_minutes = durationMinutes;
    if (pagesRead !== undefined) updates.pages_read = pagesRead;
    if (startPage !== undefined) updates.start_page = startPage;
    if (endPage !== undefined) updates.end_page = endPage;
    if (readingLocation !== undefined) updates.reading_location = readingLocation;
    if (readingFormat !== undefined) updates.reading_format = readingFormat;
    if (notes !== undefined) updates.notes = notes;
    if (mood !== undefined) updates.mood = mood;
    updates.updated_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('reading_sessions')
      .update(updates)
      .eq('id', params.id)
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transform to camelCase
    const transformedSession = {
      id: session.id,
      userId: session.user_id,
      bookId: session.book_id,
      book: session.books ? {
        id: session.books.id,
        title: session.books.title,
        author: session.books.author,
        coverUrl: session.books.cover_url,
      } : null,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      durationMinutes: session.duration_minutes,
      pagesRead: session.pages_read,
      startPage: session.start_page,
      endPage: session.end_page,
      percentageRead: session.percentage_read,
      readingLocation: session.reading_location,
      readingFormat: session.reading_format,
      notes: session.notes,
      mood: session.mood,
      pagesPerMinute: session.pages_per_minute,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: transformedSession,
    });
  } catch (error) {
    console.error('Error in PATCH /api/reading-sessions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reading-sessions/:id - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting session:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/reading-sessions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
