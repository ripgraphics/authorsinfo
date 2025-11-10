import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all announcements for a group (optionally filter by pinned, scheduled, and role)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const url = new URL(req.url);
  const pinned = url.searchParams.get('pinned');
  const scheduled = url.searchParams.get('scheduled');
  const userRole = url.searchParams.get('user_role');
  let query = supabase
    .from('group_announcements')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: false });
  if (pinned) query = query.eq('pinned', pinned === 'true');
  if (scheduled === 'future') query = query.gt('scheduled_at', new Date().toISOString());
  if (scheduled === 'past') query = query.lte('scheduled_at', new Date().toISOString());
  let { data, error } = await query;
  // Filter by role if provided
  if (userRole) {
    data = (data || []).filter((a: any) => !a.visible_to_roles || a.visible_to_roles.length === 0 || a.visible_to_roles.includes(userRole));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a new announcement to a group (support attachments and role visibility)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.title || !body.body || !body.created_by) return NextResponse.json({ error: 'Missing title, body, or created_by' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_announcements')
    .insert([{ ...body, group_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Placeholder: trigger notification logic here if needed
  return NextResponse.json(data);
}

// PATCH: Update an announcement (attachments, role visibility, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing announcement id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_announcements')
    .update(body)
    .eq('id', body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Placeholder: trigger notification logic here if needed
  return NextResponse.json(data);
}

// DELETE: Delete an announcement (only if user is creator or admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const url = new URL(req.url);
  const announcementId = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');
  if (!announcementId || !userId) return NextResponse.json({ error: 'Missing id or user_id' }, { status: 400 });
  // Fetch the announcement
  const { data: announcement, error: fetchError } = await supabase
    .from('group_announcements')
    .select('id, created_by')
    .eq('id', announcementId)
    .single();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });
  // Mock admin check: allow if user is creator or user_id === 'admin'
  if (announcement.created_by !== userId && userId !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { error } = await supabase
    .from('group_announcements')
    .delete()
    .eq('id', announcementId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// --- Read Receipts ---
// GET: List all users who have read an announcement
export async function GET_readers(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const announcementId = new URL(req.url).searchParams.get('announcement_id');
  if (!announcementId) return NextResponse.json({ error: 'Missing announcement_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_announcement_reads')
    .select('*')
    .eq('announcement_id', announcementId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
// POST: Mark an announcement as read
export async function POST_readers(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.announcement_id || !body.user_id) return NextResponse.json({ error: 'Missing announcement_id or user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_announcement_reads')
    .insert([{ ...body, group_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
} 