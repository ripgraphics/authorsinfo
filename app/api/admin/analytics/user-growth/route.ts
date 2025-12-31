import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/analytics/user-growth
 * Get user growth metrics over time
 * 
 * Query params:
 * - period: 'daily' | 'weekly' | 'monthly' (default: 'daily')
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
    const period = searchParams.get('period') || 'daily';
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user registrations over time
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (usersError) {
      throw usersError;
    }

    // Aggregate by period
    const growthData: Record<string, number> = {};
    const activeUsersData: Record<string, number> = {};

    users?.forEach((u) => {
      const date = new Date(u.created_at);
      let key: string;

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const week = Math.floor(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      growthData[key] = (growthData[key] || 0) + 1;
    });

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active users (users with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers } = await supabase
      .from('reading_sessions')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const uniqueActiveUsers = new Set(activeUsers?.map((s) => s.user_id) || []);

    // Format response
    const chartData = Object.entries(growthData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        newUsers: count,
      }));

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: uniqueActiveUsers.size,
      activeUsersPercentage: totalUsers ? ((uniqueActiveUsers.size / totalUsers) * 100).toFixed(2) : 0,
      chartData,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch user growth analytics' }, { status: 500 });
  }
}
