import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/moderation
 * Get moderation queue items
 * 
 * Query params:
 * - status: 'pending' | 'in_review' | 'resolved' | 'dismissed' (default: 'pending')
 * - priority: 'low' | 'normal' | 'high' | 'urgent'
 * - content_type: filter by content type
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const priority = searchParams.get('priority');
    const contentType = searchParams.get('content_type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('moderation_queue')
      .select('*, assigned_user:users!moderation_queue_assigned_to_fkey(name, avatar_url)', {
        count: 'exact',
      })
      .eq('status', status)
      .order('priority', { ascending: false })
      .order('last_flagged_at', { ascending: false });

    if (priority) query = query.eq('priority', priority);
    if (contentType) query = query.eq('content_type', contentType);

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('moderation_queue')
      .select('status, priority')
      .is('resolved_at', null);

    const statusCounts = {
      pending: 0,
      in_review: 0,
      resolved: 0,
      dismissed: 0,
    };

    const priorityCounts = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    stats?.forEach((item) => {
      if (item.status) statusCounts[item.status as keyof typeof statusCounts]++;
      if (item.priority) priorityCounts[item.priority as keyof typeof priorityCounts]++;
    });

    return NextResponse.json({
      items: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
      statistics: {
        byStatus: statusCounts,
        byPriority: priorityCounts,
      },
      filters: {
        status,
        priority,
        contentType,
      },
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    return NextResponse.json({ error: 'Failed to fetch moderation queue' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/moderation/[id]
 * Update moderation queue item status
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, resolution_action, resolution_notes, assign_to } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (resolution_action) updates.resolution_action = resolution_action;
    if (resolution_notes) updates.resolution_notes = resolution_notes;

    if (status === 'in_review' && !assign_to) {
      updates.assigned_to = user.id;
      updates.assigned_at = new Date().toISOString();
    } else if (assign_to) {
      updates.assigned_to = assign_to;
      updates.assigned_at = new Date().toISOString();
    }

    if (status === 'resolved' || status === 'dismissed') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('moderation_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('Error updating moderation item:', error);
    return NextResponse.json({ error: 'Failed to update moderation item' }, { status: 500 });
  }
}

