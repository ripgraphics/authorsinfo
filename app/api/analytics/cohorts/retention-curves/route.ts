import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database';
import { CohortRetentionView } from '@/types/analytics';

const getClient = async () => {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};

interface RetentionResponse {
  success: boolean;
  data?: CohortRetentionView[];
  error?: string;
}

// GET /api/analytics/cohorts/retention-curves - Get retention curves for all cohorts
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
    const cohortId = searchParams.get('cohort_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query materialized view or direct query
    let query = supabase
      .from('mv_cohort_retention')
      .select('*', { count: 'exact' });

    if (cohortId) {
      query = query.eq('cohort_id', parseInt(cohortId));
    }

    if (startDate) {
      query = query.gte('snapshot_date', startDate);
    }

    if (endDate) {
      query = query.lte('snapshot_date', endDate);
    }

    const { data, count, error } = await query
      .order('snapshot_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const response: RetentionResponse = {
      success: true,
      data: data as CohortRetentionView[],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Retention curves GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/analytics/cohorts/retention-curves - Create retention snapshot (admin only)
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
      cohort_id,
      snapshot_date,
      day_1_retention,
      day_7_retention,
      day_30_retention,
      day_90_retention,
      year_1_retention,
      cohort_size,
    } = body;

    if (!cohort_id || !snapshot_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: cohort_id, snapshot_date' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('cohort_retention_snapshots')
      .insert({
        cohort_id,
        snapshot_date,
        day_1_retention: day_1_retention || null,
        day_7_retention: day_7_retention || null,
        day_30_retention: day_30_retention || null,
        day_90_retention: day_90_retention || null,
        year_1_retention: year_1_retention || null,
        cohort_size: cohort_size || null,
      })
      .select()
      .single();

    if (error) throw error;

    const response: RetentionResponse = {
      success: true,
      data: [data as CohortRetentionView],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Retention snapshot POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
