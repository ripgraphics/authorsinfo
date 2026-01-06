import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/qa-sessions
 * Get all Q&A sessions with filtering and pagination
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 10)
 * - status: 'scheduled' | 'accepting_questions' | 'live' | 'completed' | 'cancelled'
 * - author_id: UUID
 * - upcoming: boolean (only future sessions)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const authorId = searchParams.get('author_id');
    const upcoming = searchParams.get('upcoming') === 'true';

    const offset = (page - 1) * limit;

    let query = supabase
      .from('qa_sessions')
      .select(`
        *,
        host:host_id(id, full_name, avatar_url),
        author:author_id(id, name, author_image:author_image_id(id, url, alt_text)),
        book:book_id(id, title, cover_url)
      `, { count: 'exact' });

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by author
    if (authorId) {
      query = query.eq('author_id', authorId);
    }

    // Filter upcoming sessions
    if (upcoming) {
      query = query.gte('scheduled_start', new Date().toISOString());
    }

    // Get question count for each session
    const { data: sessions, error, count } = await query
      .order('scheduled_start', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] Error fetching Q&A sessions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get question counts
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      const { data: questionCounts } = await supabase
        .from('qa_questions')
        .select('session_id')
        .in('session_id', sessionIds);

      // Add question count to each session
      const countMap = questionCounts?.reduce((acc, q) => {
        acc[q.session_id] = (acc[q.session_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      sessions.forEach(session => {
        (session as any).questionCount = countMap[session.id] || 0;
      });
    }

    return NextResponse.json({
      data: sessions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('[API] Error fetching Q&A sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Q&A sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qa-sessions
 * Create a new Q&A session
 * Body: CreateQASessionInput
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      session_type,
      scheduled_start,
      scheduled_end,
      author_id,
      book_id,
      max_questions = 100,
      is_public = true,
      requires_approval = false,
      allow_anonymous = false,
    } = body;

    // Validate required fields
    if (!title || !scheduled_start || !scheduled_end) {
      return NextResponse.json(
        { error: 'Missing required fields: title, scheduled_start, scheduled_end' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(scheduled_start);
    const endDate = new Date(scheduled_end);
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'scheduled_end must be after scheduled_start' },
        { status: 400 }
      );
    }

    // Create the Q&A session
    const { data: session, error } = await supabase
      .from('qa_sessions')
      .insert({
        host_id: user.id,
        title,
        description,
        session_type: session_type || 'ama',
        scheduled_start: startDate.toISOString(),
        scheduled_end: endDate.toISOString(),
        author_id,
        book_id,
        max_questions,
        is_public,
        requires_approval,
        allow_anonymous,
        status: 'scheduled',
      })
      .select(`
        *,
        host:host_id(id, full_name, avatar_url),
        author:author_id(id, name, author_image:author_image_id(id, url, alt_text)),
        book:book_id(id, title, cover_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error creating Q&A session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: session, message: 'Q&A session created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error creating Q&A session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Q&A session' },
      { status: 500 }
    );
  }
}

