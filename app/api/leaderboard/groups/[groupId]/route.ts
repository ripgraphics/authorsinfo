import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/leaderboard/groups/[groupId]
 * Get group-specific leaderboard rankings
 * 
 * Query params:
 * - metric: 'books' | 'pages' | 'streak' | 'points' (default: 'books')
 * - limit: number (default: 50, max: 100)
 * - timeframe: 'all_time' | 'this_month' | 'this_week' (default: 'all_time')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id, user_id, role_id, status')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You must be a member of this group to view its leaderboard' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') || 'books';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const timeframe = searchParams.get('timeframe') || 'all_time';

    // Check if we have a cached leaderboard
    const cacheKey = `group_${groupId}_${metric}_${timeframe}`;
    const { data: cachedLeaderboard } = await supabase
      .from('group_leaderboards')
      .select('data, generated_at')
      .eq('group_id', groupId)
      .eq('leaderboard_type', cacheKey)
      .single();

    // If cache is fresh (< 1 hour old), return it
    const cacheAge = cachedLeaderboard?.generated_at
      ? Date.now() - new Date(cachedLeaderboard.generated_at).getTime()
      : Infinity;

    if (cachedLeaderboard && cacheAge < 3600000) {
      // 1 hour in milliseconds
      return NextResponse.json({
        leaderboard: cachedLeaderboard.data,
        cached: true,
        cacheAge: Math.floor(cacheAge / 1000), // seconds
      });
    }

    // Build leaderboard based on metric
    let leaderboardData: any[] = [];

    if (metric === 'books') {
      // Count completed books per group member
      const { data: bookCounts, error: booksError } = await supabase.rpc(
        'get_group_book_leaderboard',
        {
          p_group_id: groupId,
          p_timeframe: timeframe,
          p_limit: limit,
        }
      );

      if (booksError) {
        // Fallback to manual query if RPC doesn't exist
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id, users(id, name, avatar_url)')
          .eq('group_id', groupId)
          .eq('status', 'active');

        if (members) {
          const memberIds = members.map((m) => m.user_id);

          // Get reading progress for group members
          const { data: progress } = await supabase
            .from('reading_progress')
            .select('user_id, status, finish_date')
            .in('user_id', memberIds)
            .eq('status', 'completed');

          // Filter by timeframe
          const filteredProgress = progress?.filter((p) => {
            if (timeframe === 'all_time') return true;
            if (!p.finish_date) return false;

            const finishDate = new Date(p.finish_date);
            const now = new Date();

            if (timeframe === 'this_week') {
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return finishDate >= weekAgo;
            }

            if (timeframe === 'this_month') {
              return (
                finishDate.getMonth() === now.getMonth() &&
                finishDate.getFullYear() === now.getFullYear()
              );
            }

            return true;
          });

          // Count books per user
          const bookCountMap = new Map<string, number>();
          filteredProgress?.forEach((p) => {
            bookCountMap.set(p.user_id, (bookCountMap.get(p.user_id) || 0) + 1);
          });

          // Build leaderboard
          leaderboardData = members
            .map((m: any) => ({
              user_id: m.user_id,
              username: m.users?.name || 'Unknown',
              avatar_url: m.users?.avatar_url || null,
              metric_value: bookCountMap.get(m.user_id) || 0,
            }))
            .filter((entry) => entry.metric_value > 0)
            .sort((a, b) => b.metric_value - a.metric_value)
            .slice(0, limit)
            .map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));
        }
      } else {
        leaderboardData = bookCounts || [];
      }
    } else if (metric === 'pages') {
      // Count pages read per group member
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, users(id, name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (members) {
        const memberIds = members.map((m) => m.user_id);

        // Get reading sessions for group members
        const { data: sessions } = await supabase
          .from('reading_sessions')
          .select('user_id, pages_read, created_at')
          .in('user_id', memberIds);

        // Filter by timeframe
        const filteredSessions = sessions?.filter((s) => {
          if (timeframe === 'all_time') return true;

          const sessionDate = new Date(s.created_at);
          const now = new Date();

          if (timeframe === 'this_week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return sessionDate >= weekAgo;
          }

          if (timeframe === 'this_month') {
            return (
              sessionDate.getMonth() === now.getMonth() &&
              sessionDate.getFullYear() === now.getFullYear()
            );
          }

          return true;
        });

        // Sum pages per user
        const pageCountMap = new Map<string, number>();
        filteredSessions?.forEach((s) => {
          pageCountMap.set(s.user_id, (pageCountMap.get(s.user_id) || 0) + (s.pages_read || 0));
        });

        // Build leaderboard
        leaderboardData = members
          .map((m: any) => ({
            user_id: m.user_id,
            username: m.users?.name || 'Unknown',
            avatar_url: m.users?.avatar_url || null,
            metric_value: pageCountMap.get(m.user_id) || 0,
          }))
          .filter((entry) => entry.metric_value > 0)
          .sort((a, b) => b.metric_value - a.metric_value)
          .slice(0, limit)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
      }
    } else if (metric === 'streak') {
      // Get current reading streaks for group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, users(id, name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (members) {
        const memberIds = members.map((m) => m.user_id);

        // Get reading streaks
        const { data: streaks } = await supabase
          .from('reading_streaks')
          .select('user_id, current_streak')
          .in('user_id', memberIds);

        // Build leaderboard
        const streakMap = new Map(streaks?.map((s) => [s.user_id, s.current_streak]) || []);

        leaderboardData = members
          .map((m: any) => ({
            user_id: m.user_id,
            username: m.users?.name || 'Unknown',
            avatar_url: m.users?.avatar_url || null,
            metric_value: streakMap.get(m.user_id) || 0,
          }))
          .filter((entry) => entry.metric_value > 0)
          .sort((a, b) => b.metric_value - a.metric_value)
          .slice(0, limit)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
      }
    } else if (metric === 'points') {
      // Get gamification points for group members
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, users(id, name, avatar_url)')
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (members) {
        const memberIds = members.map((m) => m.user_id);

        // Get user badges (each badge gives points)
        const { data: badges } = await supabase
          .from('user_badges')
          .select('user_id, badges(tier)')
          .in('user_id', memberIds);

        // Calculate points based on badge tiers
        const tierPoints: Record<string, number> = {
          bronze: 10,
          silver: 25,
          gold: 50,
          platinum: 100,
          diamond: 250,
        };

        const pointsMap = new Map<string, number>();
        badges?.forEach((b: any) => {
          const tier = b.badges?.tier || 'bronze';
          const points = tierPoints[tier] || 10;
          pointsMap.set(b.user_id, (pointsMap.get(b.user_id) || 0) + points);
        });

        // Build leaderboard
        leaderboardData = members
          .map((m: any) => ({
            user_id: m.user_id,
            username: m.users?.name || 'Unknown',
            avatar_url: m.users?.avatar_url || null,
            metric_value: pointsMap.get(m.user_id) || 0,
          }))
          .filter((entry) => entry.metric_value > 0)
          .sort((a, b) => b.metric_value - a.metric_value)
          .slice(0, limit)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
      }
    }

    // Cache the leaderboard
    await supabase
      .from('group_leaderboards')
      .upsert({
        group_id: groupId,
        leaderboard_type: cacheKey,
        data: leaderboardData,
        generated_at: new Date().toISOString(),
      });

    return NextResponse.json({
      leaderboard: leaderboardData,
      cached: false,
      metric,
      timeframe,
      groupId,
    });
  } catch (error) {
    console.error('Error fetching group leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group leaderboard' },
      { status: 500 }
    );
  }
}
