/**
 * Friends Leaderboard API
 * GET /api/leaderboard/friends - Get leaderboard among friends
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const metric = url.searchParams.get('metric') || 'points';

    // Get user's friends
    const { data: friendships, error: friendsError } = await supabase
      .from('user_friends')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (friendsError) {
      return NextResponse.json({ error: friendsError.message }, { status: 400 });
    }

    // Include current user in the leaderboard
    const userIds = [user.id, ...((friendships as any[])?.map(f => f.friend_id) || [])];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No friends found',
      });
    }

    // Get user data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url, full_name')
      .in('id', userIds);

    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 400 });
    }

    // Build leaderboard data
    const leaderboardData: {
      userId: string;
      username: string;
      avatarUrl: string | null;
      fullName: string | null;
      booksRead: number;
      pagesRead: number;
      badgesEarned: number;
      totalPoints: number;
      challengesCompleted: number;
      currentStreak: number;
      isCurrentUser: boolean;
      rank?: number;
    }[] = [];

    for (const userData of users as any[]) {
      // Get books read
      const { count: booksRead } = await supabase
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)
        .eq('status', 'completed');

      // Get pages read - join with books table to get page counts from completed books
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('book_id, status, books!inner(pages)')
        .eq('user_id', userData.id)
        .eq('status', 'completed');
      
      const pagesRead = (progressData as any[])?.reduce((sum, p) => sum + ((p.books as any)?.pages || 0), 0) || 0;

      // Get badges and points
      const { data: badges } = await supabase
        .from('user_badges')
        .select('badge:badges(points)')
        .eq('user_id', userData.id);

      const totalPoints = badges?.reduce((sum: number, b: any) => sum + (b.badge?.points || 0), 0) || 0;
      const badgesEarned = badges?.length || 0;

      // Get challenges completed
      const { count: challengesCompleted } = await supabase
        .from('reading_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id)
        .eq('status', 'completed');

      leaderboardData.push({
        userId: userData.id,
        username: userData.username,
        avatarUrl: userData.avatar_url,
        fullName: userData.full_name,
        booksRead: booksRead || 0,
        pagesRead,
        badgesEarned,
        totalPoints,
        challengesCompleted: challengesCompleted || 0,
        currentStreak: 0, // Calculate if needed
        isCurrentUser: userData.id === user.id,
      });
    }

    // Sort by metric
    if (metric === 'books') {
      leaderboardData.sort((a, b) => b.booksRead - a.booksRead);
    } else if (metric === 'streak') {
      leaderboardData.sort((a, b) => b.currentStreak - a.currentStreak);
    } else if (metric === 'challenges') {
      leaderboardData.sort((a, b) => b.challengesCompleted - a.challengesCompleted);
    } else {
      leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
    }

    // Add ranks
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      success: true,
      data: leaderboardData,
    });
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

