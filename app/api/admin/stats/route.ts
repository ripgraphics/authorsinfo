import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/stats
 * Get overall platform statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all statistics in parallel
    const [
      { count: totalUsers },
      { count: totalBooks },
      { count: totalAuthors },
      { count: totalGroups },
      { count: totalReadingProgress },
      { count: totalReviews },
      { count: totalPosts },
      { count: totalEvents },
      { count: newUsersThisMonth },
      { count: activeReadingSessions },
      { count: pendingModeration },
      { data: performanceMetrics },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('books').select('*', { count: 'exact', head: true }),
      supabase.from('authors').select('*', { count: 'exact', head: true }),
      supabase.from('groups').select('*', { count: 'exact', head: true }),
      supabase.from('reading_progress').select('*', { count: 'exact', head: true }),
      supabase.from('book_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('reading_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(100),
    ]);

    // Get daily active users (users with activity today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayActivity } = await supabase
      .from('reading_sessions')
      .select('user_id')
      .gte('created_at', today.toISOString());

    const dauCount = new Set(todayActivity?.map((s) => s.user_id) || []).size;

    // Get monthly active users
    const { data: monthActivity } = await supabase
      .from('reading_sessions')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const mauCount = new Set(monthActivity?.map((s) => s.user_id) || []).size;

    // Calculate growth percentages
    const previousMonthStart = new Date(thirtyDaysAgo);
    previousMonthStart.setDate(previousMonthStart.getDate() - 30);

    const { count: previousMonthUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonthStart.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const userGrowthRate =
      previousMonthUsers && previousMonthUsers > 0
        ? (((newUsersThisMonth || 0) - previousMonthUsers) / previousMonthUsers) * 100
        : 0;

    // Aggregate performance metrics
    const avgResponseTime =
      performanceMetrics
        ?.filter((m) => m.category === 'api' && m.metric_name === 'response_time')
        .reduce((sum, m) => sum + Number(m.metric_value), 0) /
        (performanceMetrics?.filter((m) => m.category === 'api').length || 1) || 0;

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalBooks: totalBooks || 0,
        totalAuthors: totalAuthors || 0,
        totalGroups: totalGroups || 0,
        totalReadingProgress: totalReadingProgress || 0,
        totalReviews: totalReviews || 0,
        totalPosts: totalPosts || 0,
        totalEvents: totalEvents || 0,
      },
      activity: {
        newUsersThisMonth: newUsersThisMonth || 0,
        userGrowthRate: userGrowthRate.toFixed(2),
        activeReadingSessions: activeReadingSessions || 0,
        dailyActiveUsers: dauCount,
        monthlyActiveUsers: mauCount,
        dau_mau_ratio: mauCount > 0 ? ((dauCount / mauCount) * 100).toFixed(2) : 0,
      },
      moderation: {
        pendingItems: pendingModeration || 0,
      },
      performance: {
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        totalMetrics: performanceMetrics?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch platform statistics' }, { status: 500 });
  }
}

