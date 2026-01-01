import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';
import {
  TrendingTopic,
  TrendingTopicsResponse,
} from '@/types/analytics';

// GET /api/analytics/trending-topics - Get trending topics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const topicType = searchParams.get('topic_type');
    const trendDate = searchParams.get('trend_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('trending_topics')
      .select('*', { count: 'exact' });

    if (topicType) {
      query = query.eq('topic_type', topicType);
    }

    if (trendDate) {
      query = query.eq('trend_date', trendDate);
    } else {
      // Default to today
      query = query.eq('trend_date', new Date().toISOString().split('T')[0]);
    }

    const { data, count, error } = await query
      .order('trend_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const response: TrendingTopicsResponse = {
      success: true,
      data: data as TrendingTopic[],
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trending topics GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/analytics/trending-topics - Create/update trending topic (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'admin' && (profile as any)?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      topic_name,
      topic_type,
      trend_score,
      mention_count,
      unique_users,
      trend_direction,
      trend_date,
      metadata,
    } = body;

    if (!topic_name || !topic_type || trend_score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: topic_name, topic_type, trend_score' },
        { status: 400 }
      );
    }

    const { data, error } = await (supabase
      .from('trending_topics') as any)
      .upsert({
        topic_name,
        topic_type,
        trend_score,
        mention_count: mention_count || 0,
        unique_users: unique_users || 0,
        trend_direction: trend_direction || 'stable',
        trend_date: trend_date || new Date().toISOString().split('T')[0],
        metadata: metadata || {},
      }, {
        onConflict: 'topic_name,topic_type,trend_date',
      })
      .select()
      .single();

    if (error) throw error;

    const response: TrendingTopicsResponse = {
      success: true,
      data: [data as TrendingTopic],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Trending topic POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

