import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/qa-sessions/[id]/questions/[questionId]/vote
 * Upvote a question (toggle)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { questionId } = params;

    // Check if question exists
    const { data: question, error: questionError } = await supabase
      .from('qa_questions')
      .select('id, session_id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('qa_question_votes')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // Remove vote (toggle off)
      const { error: deleteError } = await supabase
        .from('qa_question_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) {
        console.error('[API] Error removing vote:', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Vote removed successfully',
        voted: false,
      });
    } else {
      // Add vote (toggle on)
      const { error: insertError } = await supabase
        .from('qa_question_votes')
        .insert({
          question_id: questionId,
          user_id: user.id,
        });

      if (insertError) {
        console.error('[API] Error adding vote:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Vote added successfully',
        voted: true,
      });
    }
  } catch (error: any) {
    console.error('[API] Error toggling vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle vote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/qa-sessions/[id]/questions/[questionId]/vote
 * Remove upvote from a question
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { questionId } = params;

    // Remove the vote
    const { error } = await supabase
      .from('qa_question_votes')
      .delete()
      .eq('question_id', questionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] Error removing vote:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Vote removed successfully',
    });
  } catch (error: any) {
    console.error('[API] Error removing vote:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
