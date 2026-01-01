import { createRouteHandlerClientAsync } from '@/lib/supabase/client-helper';
import { NextRequest, NextResponse } from 'next/server';
import {
  UpdateCohortPayload,
  CohortResponse,
  CohortRetentionView,
} from '@/types/analytics';

const validateAdminRole = async (supabase: any, userId: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return profile?.role === 'admin' || profile?.role === 'super_admin';
};

// GET /api/analytics/cohorts/[id] - Get cohort details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClientAsync();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('user_cohorts')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Cohort not found' },
        { status: 404 }
      );
    }

    const response: CohortResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cohort detail GET error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/analytics/cohorts/[id] - Update cohort (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const payload: UpdateCohortPayload = await request.json();

    const { data, error } = await (supabase
      .from('user_cohorts') as any)
      .update(payload)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    const response: CohortResponse = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cohort PATCH error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/analytics/cohorts/[id] - Delete cohort (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from('user_cohorts')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Cohort DELETE error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
