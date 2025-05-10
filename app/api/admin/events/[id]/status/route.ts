import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PATCH /api/admin/events/[id]/status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const { status, reason, reviewer_id } = await request.json();
    const supabase = createClient();
    // Only allow certain statuses
    const allowed = ['published', 'cancelled', 'rejected', 'postponed'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    // Update event status
    const { data: event, error } = await supabase
      .from('events')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Log the approval action
    await supabase.from('event_approvals').insert({
      event_id: eventId,
      approval_status: status,
      review_notes: reason || null,
      reviewer_id: reviewer_id || null,
      reviewed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      submitted_by: reviewer_id || null
    });
    return NextResponse.json({ data: event, message: `Event status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update event status' }, { status: 500 });
  }
} 