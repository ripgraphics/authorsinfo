import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
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

    const body = await request.json();
    const {
      intervention_id,
      user_id,
      risk_score_before,
      risk_score_after,
      engagement_increase,
    } = body;

    const riskReduction =
      risk_score_before > 0
        ? ((risk_score_before - risk_score_after) / risk_score_before) * 100
        : 0;

    const { data, error } = await supabase
      .from('intervention_effectiveness')
      .insert({
        intervention_id,
        user_id,
        risk_score_before,
        risk_score_after,
        risk_reduction: riskReduction,
        engagement_increase,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update intervention status to 'engaged'
    await supabase
      .from('churn_interventions')
      .update({
        status: 'engaged',
        engaged_at: new Date().toISOString(),
        effectiveness_score: Math.min(1, Math.max(0, riskReduction / 100)),
      })
      .eq('id', intervention_id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error recording effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to record effectiveness' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const userId = searchParams.get('user_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    let query = supabase
      .from('intervention_effectiveness')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
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
    console.error('Error fetching effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to fetch effectiveness' },
      { status: 500 }
    );
  }
}
