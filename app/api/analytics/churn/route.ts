import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const riskLevel = searchParams.get('risk_level');
  const sortBy = searchParams.get('sort_by') || 'risk_score';
  const order = (searchParams.get('order') || 'desc').toLowerCase();

  try {
    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('user_churn_risk')
      .select('*', { count: 'exact' });

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel.toLowerCase());
    }

    const validSortFields = ['risk_score', 'activity_trend', 'engagement_trend', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'risk_score';
    const isAsc = order === 'asc';

    const { data, count, error } = await query
      .order(sortField, { ascending: isAsc })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      hasMore: count ? offset + limit < count : false,
    });
  } catch (error) {
    console.error('Error fetching churn risks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch churn risks' },
      { status: 500 }
    );
  }
}
