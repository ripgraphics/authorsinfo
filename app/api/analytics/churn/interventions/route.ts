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
    const { user_id, intervention_type, message } = body;

    // Get current risk score
    const { data: riskData } = await supabase
      .from('user_churn_risk')
      .select('risk_score')
      .eq('user_id', user_id)
      .single();

    // Create intervention
    const { data, error } = await supabase
      .from('churn_interventions')
      .insert({
        user_id,
        intervention_type,
        message,
        risk_score_at_intervention: riskData?.risk_score || 0,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update last intervention sent time
    await supabase
      .from('user_churn_risk')
      .update({ intervention_sent_at: new Date().toISOString() })
      .eq('user_id', user_id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { error: 'Failed to create intervention' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  const userId = searchParams.get('user_id');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    let query = supabase
      .from('churn_interventions')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query
      .order('sent_at', { ascending: false })
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
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}

