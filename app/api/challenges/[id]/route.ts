/**
 * Dynamic Reading Challenge Routes
 * GET /api/challenges/:id - Get challenge details with tracking
 * PATCH /api/challenges/:id - Update challenge metadata
 * DELETE /api/challenges/:id - Delete challenge
 * POST /api/challenges/:id/progress - Log progress
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';
import { UUID } from 'crypto';
import { checkAndAwardBadges } from '@/lib/achievement-engine';

// Force dynamic for API routes
export const dynamic = 'force-dynamic';

// Helper to verify user owns the challenge
async function verifyChallengeOwnership(supabase: any, challengeId: string, userId: string) {
  const { data: challenge } = await supabase
    .from('reading_challenges')
    .select('id')
    .eq('id', challengeId)
    .eq('user_id', userId)
    .single();

  return !!challenge;
}

// GET /api/challenges/:id - Get challenge details with tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership or check if public
    const { data: challenge, error: challengeError } = await supabase
      .from('reading_challenges')
      .select('*')
      .eq('id', params.id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Check if user owns it or if it's public
    if (challenge.user_id !== user.id && !challenge.is_public) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tracking logs
    const { data: tracking, error: trackingError } = await supabase
      .from('challenge_tracking')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .eq('challenge_id', params.id)
      .order('date_added', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...challenge,
        tracking: tracking || [],
      },
    });
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/challenges/:id - Update challenge metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyChallengeOwnership(supabase, params.id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, goalValue, status, isPublic, endDate } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (goalValue !== undefined) updates.goal_value = goalValue;
    if (status !== undefined) updates.status = status;
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (endDate !== undefined) updates.end_date = endDate;
    updates.updated_at = new Date().toISOString();

    const { data: updatedChallenge, error } = await supabase
      .from('reading_challenges')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: updatedChallenge,
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/challenges/:id - Delete challenge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyChallengeOwnership(supabase, params.id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('reading_challenges')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/challenges/:id/progress - Log progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{}> }
) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isOwner = await verifyChallengeOwnership(supabase, params.id, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const { bookId, pagesRead, minutesRead, dateAdded } = await request.json();

    if (!pagesRead && !minutesRead && !bookId) {
      return NextResponse.json({ error: 'Missing progress data' }, { status: 400 });
    }

    // Insert tracking record
    const { error: insertError } = await supabase
      .from('challenge_tracking')
      .insert({
        challenge_id: params.id,
        book_id: bookId || null,
        pages_read: pagesRead || null,
        minutes_read: minutesRead || null,
        date_added: dateAdded || new Date().toISOString().split('T')[0],
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Fetch the updated challenge to return to the client
    const { data: updatedChallenge, error: fetchError } = await supabase
      .from('reading_challenges')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !updatedChallenge) {
      return NextResponse.json({ error: fetchError?.message || 'Failed to fetch updated challenge' }, { status: 400 });
    }

    // Get updated tracking logs
    const { data: tracking } = await supabase
      .from('challenge_tracking')
      .select(`
        *,
        books (
          id,
          title,
          author,
          cover_url
        )
      `)
      .eq('challenge_id', params.id)
      .order('date_added', { ascending: false });

    // Check for badge eligibility after logging progress
    let newBadges: any[] = [];
    try {
      if (pagesRead) {
        const pagesResults = await checkAndAwardBadges(user.id, 'pages_logged');
        newBadges = [...newBadges, ...pagesResults.filter(r => r.awarded)];
      }
      if (bookId) {
        const bookResults = await checkAndAwardBadges(user.id, 'book_completed');
        newBadges = [...newBadges, ...bookResults.filter(r => r.awarded)];
      }
      // Check streak badges
      const streakResults = await checkAndAwardBadges(user.id, 'streak_updated');
      newBadges = [...newBadges, ...streakResults.filter(r => r.awarded)];
      
      // Check if challenge is now completed
      const challenge = updatedChallenge as any;
      if (challenge.current_value >= challenge.goal_value) {
        const challengeResults = await checkAndAwardBadges(user.id, 'challenge_completed');
        newBadges = [...newBadges, ...challengeResults.filter(r => r.awarded)];
      }
    } catch (badgeError) {
      console.error('Error checking badges:', badgeError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...(updatedChallenge as any),
        tracking: tracking || [],
        newBadges, // Include any newly earned badges
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
