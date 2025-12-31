/**
 * Leaderboard API Routes
 * GET /api/leaderboard - Get global leaderboard
 * GET /api/leaderboard/friends - Get friends leaderboard
 */

import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/leaderboard - Get global leaderboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    
    const url = new URL(request.url);
    const metric = url.searchParams.get('metric') || 'points'; // points, books, streak
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Try to get from materialized view first
    let { data: leaderboard, error } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .order(metric === 'books' ? 'books_read' : metric === 'streak' ? 'current_streak' : 'total_points', { ascending: false })
      .range(offset, offset + limit - 1);

    // If materialized view doesn't exist or is empty, build from tables
    if (error || !leaderboard || leaderboard.length === 0) {
      // Fallback: Build leaderboard from base tables
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url, full_name');

      if (usersError || !users) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 400 });
      }

      // Get stats for each user (simplified query)
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
        overallRank?: number;
        booksRank?: number;
        streakRank?: number;
      }[] = [];

      for (const user of users.slice(0, limit) as any[]) {
        // Get books read
        const { count: booksRead } = await supabase
          .from('reading_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        // Get badges and points
        const { data: badges } = await supabase
          .from('user_badges')
          .select('badge:badges(points)')
          .eq('user_id', user.id);

        const totalPoints = badges?.reduce((sum: number, b: any) => sum + (b.badge?.points || 0), 0) || 0;

        leaderboardData.push({
          userId: user.id,
          username: user.username,
          avatarUrl: user.avatar_url,
          fullName: user.full_name,
          booksRead: booksRead || 0,
          pagesRead: 0,
          badgesEarned: badges?.length || 0,
          totalPoints,
          challengesCompleted: 0,
          currentStreak: 0,
        });
      }

      // Sort by metric
      if (metric === 'books') {
        leaderboardData.sort((a, b) => b.booksRead - a.booksRead);
      } else if (metric === 'streak') {
        leaderboardData.sort((a, b) => b.currentStreak - a.currentStreak);
      } else {
        leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
      }

      // Add ranks
      leaderboardData.forEach((entry, index) => {
        entry.overallRank = offset + index + 1;
        entry.booksRank = offset + index + 1;
        entry.streakRank = offset + index + 1;
      });

      return NextResponse.json({
        success: true,
        data: leaderboardData,
        pagination: {
          offset,
          limit,
          total: users.length,
        },
      });
    }

    // Map materialized view data to camelCase
    const mappedLeaderboard = leaderboard.map((entry: any) => ({
      userId: entry.user_id,
      username: entry.username,
      avatarUrl: entry.avatar_url,
      fullName: entry.full_name,
      booksRead: entry.books_read,
      pagesRead: entry.pages_read,
      badgesEarned: entry.badges_earned,
      totalPoints: entry.total_points,
      challengesCompleted: entry.challenges_completed,
      currentStreak: entry.current_streak,
      overallRank: entry.overall_rank,
      booksRank: entry.books_rank,
      streakRank: entry.streak_rank,
    }));

    return NextResponse.json({
      success: true,
      data: mappedLeaderboard,
      pagination: {
        offset,
        limit,
        total: mappedLeaderboard.length,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

