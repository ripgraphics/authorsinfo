import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET: List all participants for a thread
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const threadId = req.nextUrl.searchParams.get('thread_id');
  if (!threadId) return NextResponse.json({ error: 'Missing thread_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_participants')
    .select('*')
    .eq('thread_id', threadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Add a participant to a thread
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const body = await req.json();
  if (!body.thread_id || !body.user_id) return NextResponse.json({ error: 'Missing thread_id or user_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('group_chat_thread_participants')
    .insert([{ ...body, group_id: params.id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Remove a participant from a thread
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const threadId = req.nextUrl.searchParams.get('thread_id');
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!threadId || !userId) return NextResponse.json({ error: 'Missing thread_id or user_id' }, { status: 400 });
  const { error } = await supabase
    .from('group_chat_thread_participants')
    .delete()
    .eq('thread_id', threadId)
    .eq('user_id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
} 