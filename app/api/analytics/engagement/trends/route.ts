import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database';
import {
  EngagementTrendView,
  EngagementTrendsResponse,
} from '@/types/analytics';

const getClient = async () => {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};

interface TrendsResponse {
  success: boolean;
  data?: EngagementTrendView[];
  total?: number;
  error?: string;
}

// GET /api/analytics/engagement/trends - Get engagement trends
export async function GET(request: NextRequest) {
  try {
    const supabase = await getClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('mv_engagement_trends')
      .select('*', { count: 'exact' });

    if (startDate) {
      query = query.gte('day', startDate);
    }

    if (endDate) {
      query = query.lte('day', endDate);
    }

    const { data, count, error } = await query
      .order('day', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const response: TrendsResponse = {
      success: true,
      data: data as EngagementTrendView[],
      total: count || 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Engagement trends GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/analytics/engagement/trends - Create engagement metrics entry (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await getClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      day,
      total_actions,
      unique_users,
      reading_actions,
      social_actions,
      discussion_actions,
      admin_actions,
      avg_session_duration_minutes,
      bounce_rate,
    } = body;

    if (!day) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: day' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('daily_engagement_metrics')
      .upsert({
        day,
        total_actions: total_actions || 0,
        unique_users: unique_users || 0,
        reading_actions: reading_actions || 0,
        social_actions: social_actions || 0,
        discussion_actions: discussion_actions || 0,
        admin_actions: admin_actions || 0,
        avg_session_duration_minutes: avg_session_duration_minutes || null,
        bounce_rate: bounce_rate || null,
      }, {
        onConflict: 'day',
      })
      .select()
      .single();

    if (error) throw error;

    const response: TrendsResponse = {
      success: true,
      data: [data as EngagementTrendView],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Engagement metrics POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
