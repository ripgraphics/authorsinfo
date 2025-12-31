/**
 * Reading Sessions API
 * GET /api/reading-sessions - List sessions
 * POST /api/reading-sessions - Create session
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/reading-sessions - List reading sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('reading_sessions')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    if (startDate) {
      query = query.gte('started_at', startDate);
    }

    if (endDate) {
      query = query.lte('started_at', endDate);
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transform to camelCase
    const transformedSessions = sessions?.map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      bookId: s.book_id,
      book: s.books ? {
        id: s.books.id,
        title: s.books.title,
        author: s.books.author,
        coverUrl: s.books.cover_url,
      } : null,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      durationMinutes: s.duration_minutes,
      pagesRead: s.pages_read,
      startPage: s.start_page,
      endPage: s.end_page,
      percentageRead: s.percentage_read,
      readingLocation: s.reading_location,
      readingFormat: s.reading_format,
      notes: s.notes,
      mood: s.mood,
      pagesPerMinute: s.pages_per_minute,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSessions,
      pagination: {
        limit,
        offset,
        total: count,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/reading-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/reading-sessions - Create a reading session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookId,
      startedAt,
      endedAt,
      durationMinutes,
      pagesRead,
      startPage,
      endPage,
      readingLocation,
      readingFormat = 'physical',
      notes,
      mood,
    } = body;

    // Validate required fields
    if (pagesRead === undefined || pagesRead === null) {
      return NextResponse.json({ error: 'pagesRead is required' }, { status: 400 });
    }

    // Build session data
    const sessionData: any = {
      user_id: user.id,
      book_id: bookId || null,
      started_at: startedAt || new Date().toISOString(),
      ended_at: endedAt || null,
      duration_minutes: durationMinutes || null,
      pages_read: pagesRead,
      start_page: startPage || null,
      end_page: endPage || null,
      reading_location: readingLocation || null,
      reading_format: readingFormat,
      notes: notes || null,
      mood: mood || null,
    };

    // Calculate percentage if we have book info
    if (bookId && startPage !== undefined && endPage !== undefined) {
      const { data: book } = await supabase
        .from('books')
        .select('page_count')
        .eq('id', bookId)
        .single();

      if (book?.page_count && book.page_count > 0) {
        sessionData.percentage_read = ((endPage - startPage) / book.page_count) * 100;
      }
    }

    const { data: session, error } = await supabase
      .from('reading_sessions')
      .insert(sessionData)
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
      console.error('Error creating session:', error);
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
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reading-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
