import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all snoozed threads for a user in a group
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_snooze')
    .select('*')
    .eq('group_id', id)
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Snooze a thread for a user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const body = await req.json();
  if (!body.thread_id || !body.user_id || !body.until) return NextResponse.json({ error: 'Missing thread_id, user_id, or until' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_snooze')
    .insert([{ ...body, group_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Unsnooze a thread for a user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await params; // Await params even though we don't use it in this function
  const supabase = createClient();
  const threadId = req.nextUrl.searchParams.get('thread_id');
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!threadId || !userId) return NextResponse.json({ error: 'Missing thread_id or user_id' }, { status: 400 });
  const { error } = await supabase
    .from('group_chat_thread_snooze')
    .delete()
    .eq('thread_id', threadId)
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 