import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/engagement
 * Get platform engagement metrics
 * 
 * Query params:
 * - days: number of days to look back (default: 30)
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

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch engagement analytics
    const { data: engagementData } = await supabase
      .from('engagement_analytics')
      .select('action, entity_type, timestamp')
      .gte('timestamp', startDate.toISOString());

    // Aggregate engagement by action type
    const actionCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    const dailyEngagement: Record<string, number> = {};

    engagementData?.forEach((item) => {
      // Count by action
      actionCounts[item.action] = (actionCounts[item.action] || 0) + 1;

      // Count by entity type
      entityCounts[item.entity_type] = (entityCounts[item.entity_type] || 0) + 1;

      // Count by day
      const day = item.timestamp.split('T')[0];
      dailyEngagement[day] = (dailyEngagement[day] || 0) + 1;
    });

    // Get post analytics
    const { data: postAnalytics } = await supabase
      .from('post_analytics')
      .select('view_count, like_count, comment_count, share_count, engagement_score')
      .order('engagement_score', { ascending: false })
      .limit(10);

    // Calculate total engagement
    const totalEngagement = engagementData?.length || 0;

    // Get unique engaged users
    const uniqueUsers = new Set(
      (
        await supabase
          .from('engagement_analytics')
          .select('user_id')
          .gte('timestamp', startDate.toISOString())
      ).data?.map((e) => e.user_id) || []
    );

    // Format daily engagement chart data
    const chartData = Object.entries(dailyEngagement)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        engagements: count,
      }));

    // Calculate averages
    const avgDailyEngagement = totalEngagement / days;

    return NextResponse.json({
      totalEngagement,
      uniqueEngagedUsers: uniqueUsers.size,
      avgDailyEngagement: Math.round(avgDailyEngagement),
      actionBreakdown: Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([action, count]) => ({ action, count })),
      entityBreakdown: Object.entries(entityCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([entity, count]) => ({ entity, count })),
      topPosts: postAnalytics || [],
      chartData,
      dateRange: {
        start: startDate.toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching engagement analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement analytics' }, { status: 500 });
  }
}

