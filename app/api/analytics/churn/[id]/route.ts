import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { data, error } = await supabase
      .from('user_churn_risk')
      .select(`
        *,
        churn_interventions(
          id,
          intervention_type,
          status,
          risk_score_at_intervention,
          sent_at,
          engaged_at
        )
      `)
      .eq('user_id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: 'Churn risk data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching churn risk:', error);
    return NextResponse.json(
      { error: 'Failed to fetch churn risk' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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
    const { risk_score, activity_trend, engagement_trend } = body;

    const { data, error } = await supabase
      .from('user_churn_risk')
      .update({
        risk_score,
        activity_trend,
        engagement_trend,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating churn risk:', error);
    return NextResponse.json(
      { error: 'Failed to update churn risk' },
      { status: 500 }
    );
  }
}
