import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/admin/events/bulk-status
export async function POST(request: NextRequest) {
  try {
    const { ids, status, reason, reviewer_id } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No event IDs provided' }, { status: 400 });
    }
    const allowed = ['published', 'cancelled', 'rejected', 'postponed'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const supabase = createClient();
    // Update all events
    const { error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Log all actions
    const logs = ids.map((event_id: string) => ({
      event_id,
      approval_status: status,
      review_notes: reason || null,
      reviewer_id: reviewer_id || null,
      reviewed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      submitted_by: reviewer_id || null
    }));
    await supabase.from('event_approvals').insert(logs);
    return NextResponse.json({ message: `Updated ${ids.length} events to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update events' }, { status: 500 });
  }
} 