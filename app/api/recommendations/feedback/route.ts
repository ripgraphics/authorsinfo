/**
 * Recommendation Feedback API
 * POST - Submit feedback on a recommendation
 * DELETE - Dismiss/hide a recommendation
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { FeedbackType, SubmitFeedbackInput } from '@/types/phase3';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubmitFeedbackInput = await request.json();
    
    if (!body.bookId || !body.feedbackType) {
      return NextResponse.json(
        { error: 'bookId and feedbackType are required' },
        { status: 400 }
      );
    }

    const validFeedbackTypes: FeedbackType[] = [
      'like', 'dislike', 'not_interested', 'already_read', 'want_more_like_this'
    ];
    
    if (!validFeedbackTypes.includes(body.feedbackType)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Insert feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('recommendation_feedback')
      .insert({
        user_id: user.id,
        book_id: body.bookId,
        recommendation_id: body.recommendationId,
        feedback_type: body.feedbackType,
        reason: body.reason
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    // If user marked as 'not_interested' or 'dislike', dismiss the recommendation
    if (body.feedbackType === 'not_interested' || body.feedbackType === 'dislike') {
      await supabase
        .from('recommendation_cache')
        .update({ 
          was_dismissed: true,
          interaction_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('book_id', body.bookId);
    }

    // If 'already_read', add to reading progress if not already there
    if (body.feedbackType === 'already_read') {
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', body.bookId)
        .single();

      if (!existing) {
        await supabase
          .from('reading_progress')
          .insert({
            user_id: user.id,
            book_id: body.bookId,
            status: 'completed',
            progress_percentage: 100
          });
      }
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        bookId: feedback.book_id,
        feedbackType: feedback.feedback_type,
        createdAt: feedback.created_at
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// Mark a recommendation as viewed/clicked
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recommendationId, action } = body;

    if (!recommendationId || !action) {
      return NextResponse.json(
        { error: 'recommendationId and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['view', 'click', 'dismiss'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be view, click, or dismiss' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      interaction_at: new Date().toISOString()
    };

    if (action === 'view') {
      updates.was_viewed = true;
    } else if (action === 'click') {
      updates.was_clicked = true;
      updates.was_viewed = true;
    } else if (action === 'dismiss') {
      updates.was_dismissed = true;
    }

    const { error: updateError } = await supabase
      .from('recommendation_cache')
      .update(updates)
      .eq('id', recommendationId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating recommendation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    );
  }
}

// Dismiss a recommendation
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recommendationId = searchParams.get('id');
    const bookId = searchParams.get('bookId');

    if (!recommendationId && !bookId) {
      return NextResponse.json(
        { error: 'Either id or bookId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('recommendation_cache')
      .update({ 
        was_dismissed: true,
        interaction_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (recommendationId) {
      query = query.eq('id', recommendationId);
    } else if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error('Error dismissing recommendation:', updateError);
      return NextResponse.json(
        { error: 'Failed to dismiss recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss recommendation' },
      { status: 500 }
    );
  }
}

