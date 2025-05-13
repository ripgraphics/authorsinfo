import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all author events for a group
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_author_events')
    .select(`
      *,
      events (
        id,
        title,
        description,
        start_date,
        end_date,
        format,
        status,
        virtual_meeting_url,
        cover_image_id
      ),
      authors (
        id,
        name,
        bio,
        author_image_id
      )
    `)
    .eq('group_id', params.id)
    .order('scheduled_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Create a new author event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.author_id || !body.event_id) {
    return NextResponse.json({ error: 'Missing author_id or event_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_author_events')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH: Update an author event
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  
  if (!body.event_id) {
    return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('group_author_events')
    .update(body)
    .eq('id', body.event_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove an author event
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const url = new URL(req.url);
  const eventId = url.searchParams.get('event_id');

  if (!eventId) {
    return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('group_author_events')
    .delete()
    .eq('id', eventId)
    .eq('group_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 