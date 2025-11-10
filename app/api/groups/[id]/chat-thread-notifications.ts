import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all notifications for a user in a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_notifications')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a notification for a user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.thread_id || !body.user_id || !body.type || !body.message) return NextResponse.json({ error: 'Missing thread_id, user_id, type, or message' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_notifications')
    .insert([{ ...body, group_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a notification
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const notificationId = req.nextUrl.searchParams.get('id');
  if (!notificationId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase
    .from('group_chat_thread_notifications')
    .delete()
    .eq('id', notificationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 