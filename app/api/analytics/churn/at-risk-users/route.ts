import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';
import {
  UserChurnRisk,
  RiskLevel,
  ChurnRiskQueryParams,
  ChurnRiskResponse,
} from '@/types/analytics';

const validateAdminRole = async (supabase: any, userId: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role === 'admin' || profile?.role === 'super_admin';
};

// GET /api/analytics/churn/at-risk-users - Get users at churn risk
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

    const isAdmin = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const riskLevel = searchParams.get('risk_level') as RiskLevel | null;
    const minScore = parseFloat(searchParams.get('min_score') || '0');
    const maxScore = parseFloat(searchParams.get('max_score') || '100');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('user_churn_risk')
      .select('*', { count: 'exact' });

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    const { data, count, error } = await query
      .gte('risk_score', minScore)
      .lte('risk_score', maxScore)
      .order('risk_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate summary
    const summary = {
      critical: (data as UserChurnRisk[])?.filter(r => r.risk_level === 'critical').length || 0,
      high: (data as UserChurnRisk[])?.filter(r => r.risk_level === 'high').length || 0,
      medium: (data as UserChurnRisk[])?.filter(r => r.risk_level === 'medium').length || 0,
      low: (data as UserChurnRisk[])?.filter(r => r.risk_level === 'low').length || 0,
    };

    const response: ChurnRiskResponse = {
      success: true,
      data: data as UserChurnRisk[],
      total: count || 0,
    };

    return NextResponse.json({ ...response, summary });
  } catch (error) {
    console.error('Churn risk GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/analytics/churn/at-risk-users - Create or update churn risk record (admin only)
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

    const isAdmin = await validateAdminRole(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      risk_score,
      activity_trend,
      engagement_trend,
      feature_adoption_trend,
      last_active_date,
      days_since_last_activity,
      predicted_churn_date,
      confidence_score,
      contributing_factors,
    } = body;

    if (!user_id || risk_score === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, risk_score' },
        { status: 400 }
      );
    }

    // Determine risk level from score
    let risk_level: RiskLevel;
    if (risk_score < 25) risk_level = 'low' as const;
    else if (risk_score < 50) risk_level = 'medium' as const;
    else if (risk_score < 75) risk_level = 'high' as const;
    else risk_level = 'critical' as const;

    const { data, error } = await supabase
      .from('user_churn_risk')
      .upsert({
        user_id,
        risk_score,
        risk_level,
        activity_trend,
        engagement_trend,
        feature_adoption_trend,
        last_active_date,
        days_since_last_activity,
        predicted_churn_date,
        confidence_score,
        contributing_factors: contributing_factors || {},
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) throw error;

    const response: ChurnRiskResponse = {
      success: true,
      data: [data as UserChurnRisk],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Churn risk POST error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

