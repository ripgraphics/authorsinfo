import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database';
import {
  EngagementHeatmap,
  HeatmapResponse,
  TrendingTopic,
  TrendingTopicsResponse,
} from '@/types/analytics';

const getClient = async () => {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};

// GET /api/analytics/engagement/heatmap - Get engagement heatmap
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

    const { data, error } = await supabase
      .from('engagement_heatmap')
      .select('*')
      .order('day_of_week')
      .order('hour_of_day');

    if (error) throw error;

    const response: HeatmapResponse = {
      success: true,
      data: data as EngagementHeatmap[],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Heatmap GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/analytics/engagement/heatmap - Update heatmap data (admin only)
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
      day_of_week,
      hour_of_day,
      engagement_score,
      action_count,
      unique_users,
      trend_data,
    } = body;

    if (day_of_week === undefined || hour_of_day === undefined || engagement_score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: day_of_week, hour_of_day, engagement_score' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('engagement_heatmap')
      .upsert({
        day_of_week,
        hour_of_day,
        engagement_score,
        action_count: action_count || 0,
        unique_users: unique_users || 0,
        trend_data: trend_data || {},
      }, {
        onConflict: 'day_of_week,hour_of_day',
      })
      .select()
      .single();

    if (error) throw error;

    const response: HeatmapResponse = {
      success: true,
      data: [data as EngagementHeatmap],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Heatmap POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
