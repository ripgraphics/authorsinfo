import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get friends' IDs
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (friendsError) throw friendsError;

    const friendIds = friends.map(f => f.friend_id);

    if (friendIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get public challenges of friends
    const { data: challenges, error: challengesError } = await supabase
      .from('reading_challenges')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .in('user_id', friendIds)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (challengesError) throw challengesError;

    // Map to camelCase
    const mappedChallenges = challenges.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      title: c.title,
      description: c.description,
      goalType: c.goal_type,
      goalValue: c.goal_value,
      currentValue: c.current_value,
      startDate: c.start_date,
      endDate: c.end_date,
      challengeYear: c.challenge_year,
      status: c.status,
      isPublic: c.is_public,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      user: c.user
    }));

    return NextResponse.json(mappedChallenges);

  } catch (error: any) {
    console.error('Error fetching friends challenges:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

