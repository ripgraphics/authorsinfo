import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all events for a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_events')
    .select('*, event:events(*)')
    .eq('group_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new event for a group
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  // 1. Create the event
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([body])
    .select()
    .single();
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 400 });
  // 2. Link the event to the group
  const { data: groupEvent, error: groupEventError } = await supabase
    .from('group_events')
    .insert([{ group_id: id, event_id: event.id }])
    .select()
    .single();
  if (groupEventError) return NextResponse.json({ error: groupEventError.message }, { status: 400 });
  return NextResponse.json({ event, groupEvent });
} 