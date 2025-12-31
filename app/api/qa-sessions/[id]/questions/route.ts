import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/qa-sessions/[id]/questions
 * Get all questions for a Q&A session
 * Query params:
 * - status: 'pending' | 'approved' | 'answered' | 'rejected' | 'featured'
 * - sort: 'recent' | 'popular' | 'answered' (default: popular)
 * - limit: number (default: 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id: sessionId } = params;
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if session exists
    const { data: session, error: sessionError } = await supabase
      .from('qa_sessions')
      .select('id, is_public')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Q&A session not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('qa_questions')
      .select(`
        *,
        user:user_id(id, full_name, avatar_url),
        answers:qa_answers(
          *,
          responder:responder_id(id, full_name, avatar_url)
        )
      `)
      .eq('session_id', sessionId);

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Sort questions
    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'popular') {
      query = query.order('upvotes', { ascending: false });
    } else if (sort === 'answered') {
      query = query.not('answered_at', 'is', null);
      query = query.order('answered_at', { ascending: false });
    }

    query = query.limit(limit);

    const { data: questions, error } = await query;

    if (error) {
      console.error('[API] Error fetching questions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if user has voted on each question
    if (user && questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      const { data: votes } = await supabase
        .from('qa_question_votes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds);

      const votedIds = new Set(votes?.map(v => v.question_id) || []);
      questions.forEach((q: any) => {
        q.hasUpvoted = votedIds.has(q.id);
      });
    }

    return NextResponse.json({ data: questions });
  } catch (error: any) {
    console.error('[API] Error fetching questions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/qa-sessions/[id]/questions
 * Submit a new question to a Q&A session
 * Body: SubmitQuestionInput
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

    const { id: sessionId } = params;
    const body = await request.json();
    const { question_text, is_anonymous = false } = body;

    if (!question_text || question_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    // Check if session exists and is accepting questions
    const { data: session, error: sessionError } = await supabase
      .from('qa_sessions')
      .select('id, status, max_questions, allow_anonymous')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Q&A session not found' }, { status: 404 });
    }

    if (!['scheduled', 'accepting_questions', 'live'].includes(session.status)) {
      return NextResponse.json(
        { error: 'This session is not accepting questions' },
        { status: 400 }
      );
    }

    if (is_anonymous && !session.allow_anonymous) {
      return NextResponse.json(
        { error: 'Anonymous questions are not allowed for this session' },
        { status: 400 }
      );
    }

    // Check question limit
    const { count: questionCount } = await supabase
      .from('qa_questions')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (questionCount && questionCount >= session.max_questions) {
      return NextResponse.json(
        { error: 'Maximum number of questions reached for this session' },
        { status: 400 }
      );
    }

    // Create the question
    const { data: question, error } = await supabase
      .from('qa_questions')
      .insert({
        session_id: sessionId,
        user_id: is_anonymous ? null : user.id,
        question_text: question_text.trim(),
        is_anonymous,
        status: 'pending',
      })
      .select(`
        *,
        user:user_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error creating question:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { data: question, message: 'Question submitted successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error creating question:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit question' },
      { status: 500 }
    );
  }
}
