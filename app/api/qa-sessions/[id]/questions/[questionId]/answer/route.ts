import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/qa-sessions/[id]/questions/[questionId]/answer
 * Answer a question in a Q&A session
 * Body: SubmitAnswerInput
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id: sessionId, questionId } = params;
    const body = await request.json();
    const { answer_text, is_official = false } = body;

    if (!answer_text || answer_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer text is required' },
        { status: 400 }
      );
    }

    // Check if question exists and belongs to this session
    const { data: question, error: questionError } = await supabase
      .from('qa_questions')
      .select('id, session_id')
      .eq('id', questionId)
      .eq('session_id', sessionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if user is the session host (for official answers)
    let isHost = false;
    if (is_official) {
      const { data: session } = await supabase
        .from('qa_sessions')
        .select('host_id')
        .eq('id', sessionId)
        .single();

      isHost = session?.host_id === user.id;
      
      if (!isHost) {
        return NextResponse.json(
          { error: 'Only the session host can mark answers as official' },
          { status: 403 }
        );
      }
    }

    // Create the answer
    const { data: answer, error } = await supabase
      .from('qa_answers')
      .insert({
        question_id: questionId,
        responder_id: user.id,
        answer_text: answer_text.trim(),
        is_official: is_official && isHost,
      })
      .select(`
        *,
        responder:responder_id(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('[API] Error creating answer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update question status to 'answered' if this is an official answer
    if (is_official && isHost) {
      await supabase
        .from('qa_questions')
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);
    }

    return NextResponse.json(
      { data: answer, message: 'Answer submitted successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API] Error creating answer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
